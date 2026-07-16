"""Hourly delivery job: find due users, rank, render, send."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.engine import Connection

from .. import repository
from ..config import Settings
from .email import send_email
from .html import ArticleView, TemplateData, render_newsletter_html
from .ranking import rank_articles_for_user


def _local_now(tz_name: str) -> datetime:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:  # noqa: BLE001
        tz = ZoneInfo("UTC")
    return datetime.now(tz)


def _js_weekday_to_python(js_day: int) -> int:
    """Convert 0=Sunday..6=Saturday to Python weekday() 0=Monday..6=Sunday."""
    return (js_day - 1) % 7


def is_user_due(user: repository.DeliveryUser) -> bool:
    local = _local_now(user.timezone)
    if local.hour != user.send_hour:
        return False
    if user.cadence == "WEEKLY":
        if local.weekday() != _js_weekday_to_python(user.weekly_send_day):
            return False
    return True


def period_start_utc(user: repository.DeliveryUser) -> datetime:
    local = _local_now(user.timezone)
    if user.cadence == "DAILY":
        start_local = local.replace(hour=0, minute=0, second=0, microsecond=0)
        return start_local.astimezone(timezone.utc)

    start_local = local.replace(hour=0, minute=0, second=0, microsecond=0)
    start_local = start_local - timedelta(days=start_local.weekday())
    return start_local.astimezone(timezone.utc)


def branding_for(cadence: str) -> str:
    return "Astra Daily" if cadence == "DAILY" else "Astra Weekly"


def build_subject(trending: str | None) -> str:
    date = datetime.now(timezone.utc).strftime("%b %d")
    if trending:
        return f"Your {trending} briefing — {date}"
    return f"Your Astra briefing — {date}"


def deliver_for_user(
    conn: Connection,
    settings: Settings,
    user: repository.DeliveryUser,
    candidates: list[repository.CandidateArticle],
) -> bool:
    """Generate and send one edition. Returns True if an edition was sent."""
    if repository.has_sent_in_period(
        conn,
        user_id=user.id,
        cadence=user.cadence,
        period_start=period_start_utc(user),
    ):
        return False

    weights = repository.fetch_user_topic_weights(conn, user.id)
    engagement = repository.fetch_user_engagement_topic_counts(conn, user.id)
    ranked = rank_articles_for_user(
        candidates=candidates,
        topic_weights=weights,
        engagement_by_topic=engagement,
        cadence=user.cadence,
    )
    if not ranked:
        print(f"[deliver] no articles for {user.email}")
        return False

    topic_counts = Counter(r.top_topic for r in ranked if r.top_topic)
    trending = topic_counts.most_common(1)[0][0] if topic_counts else None
    subject = build_subject(trending)
    period_word = "today" if user.cadence == "DAILY" else "this week"
    intro = (
        f"We curated {len(ranked)} stories tuned to your interests"
        + (f", with extra signal on {trending}" if trending else "")
        + f". Here is what matters most {period_word}."
    )

    newsletter_id = repository.new_id()

    views: list[ArticleView] = []
    for item in ranked:
        tracked = (
            f"{settings.app_url}/api/track/click"
            f"?n={newsletter_id}&a={item.article.id}"
        )
        topics = [t[2] for t in item.article.topics]
        views.append(
            ArticleView(
                title=item.article.title,
                summary=item.article.summary,
                reason=item.reason,
                source_name=item.article.source_name,
                reading_time_min=item.article.reading_time_min,
                topics=topics,
                tracked_url=tracked,
            )
        )

    tool = next(
        (v for v in views if "Developer Tools" in v.topics),
        views[0] if views else None,
    )

    html = render_newsletter_html(
        TemplateData(
            subject=subject,
            intro=intro,
            articles=views,
            trending_topic=trending,
            tool_of_the_week=tool,
            open_pixel_url=f"{settings.app_url}/api/track/open?n={newsletter_id}",
            unsubscribe_url=f"{settings.app_url}/preferences",
            recipient_email=user.email,
            branding=branding_for(user.cadence),
        )
    )

    repository.create_newsletter(
        conn,
        newsletter_id=newsletter_id,
        user_id=user.id,
        subject=subject,
        intro=intro,
        html_content=html,
        cadence=user.cadence,
        status="READY",
        sent_at=None,
    )

    for rank_index, item in enumerate(ranked, start=1):
        repository.insert_newsletter_article(
            conn,
            newsletter_id=newsletter_id,
            article_id=item.article.id,
            rank=rank_index,
            reason=item.reason,
            tracked_url=(
                f"{settings.app_url}/api/track/click"
                f"?n={newsletter_id}&a={item.article.id}"
            ),
        )

    try:
        send_email(settings, to=user.email, subject=subject, html=html)
    except Exception:
        repository.update_newsletter_status(conn, newsletter_id, status="FAILED")
        raise

    repository.update_newsletter_status(
        conn,
        newsletter_id,
        status="SENT",
        sent_at=datetime.now(timezone.utc),
    )
    print(f"[deliver] sent {user.cadence} edition to {user.email}")
    return True


def run_deliver(conn: Connection, settings: Settings) -> int:
    users = repository.fetch_auto_send_users(conn)
    due = [u for u in users if is_user_due(u)]
    if not due:
        print("[deliver] no users due this hour")
        return 0

    candidates = repository.fetch_candidate_articles(conn)
    sent = 0
    for user in due:
        try:
            if deliver_for_user(conn, settings, user, candidates):
                sent += 1
        except Exception as exc:  # noqa: BLE001
            print(f"[deliver] failed for {user.email}: {exc}")
    return sent
