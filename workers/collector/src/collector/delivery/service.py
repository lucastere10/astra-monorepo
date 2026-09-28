"""Delivery job: find due users at morning/midday/evening, rank, render, send."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.engine import Connection

from .. import repository
from ..config import Settings
from .email import send_email
from .html import ArticleView, TemplateData, render_newsletter_html
from .ranking import rank_articles_for_user
from .voice import write_newsletter_copy

DEFAULT_TIMEZONE = "America/Sao_Paulo"
SEND_HOUR_PRESETS = (8, 12, 18)
SEND_LEAD_MINUTES = 3


def _local_now(tz_name: str) -> datetime:
    try:
        tz = ZoneInfo(tz_name or DEFAULT_TIMEZONE)
    except Exception:  # noqa: BLE001
        tz = ZoneInfo(DEFAULT_TIMEZONE)
    return datetime.now(tz)


def _nearest_send_hour(hour: int) -> int:
    """Snap legacy custom hours onto morning / midday / evening."""
    best = SEND_HOUR_PRESETS[0]
    best_dist = 24
    for preset in SEND_HOUR_PRESETS:
        dist = min(abs(hour - preset), 24 - abs(hour - preset))
        if dist < best_dist:
            best = preset
            best_dist = dist
    return best


def _delivery_target(local: datetime) -> datetime:
    """
    Map "now" onto the send window being processed.

    The scheduler starts SEND_LEAD_MINUTES before each preset (e.g. 07:57 for
    08:00). In that lead window, treat the upcoming preset hour as the target.
    """
    upcoming_hour = (local.hour + 1) % 24
    if (
        local.minute >= 60 - SEND_LEAD_MINUTES
        and upcoming_hour in SEND_HOUR_PRESETS
    ):
        return (local + timedelta(hours=1)).replace(
            minute=0, second=0, microsecond=0
        )
    return local.replace(minute=0, second=0, microsecond=0)


def _js_weekday_to_python(js_day: int) -> int:
    """Convert 0=Sunday..6=Saturday to Python weekday() 0=Monday..6=Sunday."""
    return (js_day - 1) % 7


def _python_weekday_to_js(python_day: int) -> int:
    """Convert Python weekday() 0=Monday..6=Sunday to 0=Sunday..6=Saturday."""
    return (python_day + 1) % 7


@dataclass(frozen=True)
class DeliverySlot:
    user: repository.DeliveryUser
    cadence: str


def due_slots_for_user(user: repository.DeliveryUser) -> list[DeliverySlot]:
    """Return cadence slots due for the current (or upcoming) send window."""
    local = _local_now(DEFAULT_TIMEZONE)
    target = _delivery_target(local)
    js_weekday = _python_weekday_to_js(target.weekday())
    slots: list[DeliverySlot] = []

    if (
        user.daily_enabled
        and target.hour == _nearest_send_hour(user.daily_send_hour)
        and js_weekday in user.daily_send_days
    ):
        slots.append(DeliverySlot(user=user, cadence="DAILY"))

    if (
        user.weekly_enabled
        and target.hour == _nearest_send_hour(user.weekly_send_hour)
        and target.weekday() == _js_weekday_to_python(user.weekly_send_day)
    ):
        slots.append(DeliverySlot(user=user, cadence="WEEKLY"))

    return slots


def period_start_utc(user: repository.DeliveryUser, cadence: str) -> datetime:
    local = _local_now(DEFAULT_TIMEZONE)
    target = _delivery_target(local)
    start_local = target.replace(hour=0, minute=0, second=0, microsecond=0)
    if cadence == "DAILY":
        return start_local.astimezone(timezone.utc)

    start_local = start_local - timedelta(days=start_local.weekday())
    return start_local.astimezone(timezone.utc)


def branding_for(cadence: str) -> str:
    return "Astra Daily" if cadence == "DAILY" else "Astra Weekly"


def build_subject(trending: str | None) -> str:
    date = datetime.now(timezone.utc).strftime("%b %d")
    if trending:
        return f"Your {trending} briefing — {date}"
    return f"Your Astra briefing — {date}"


def deliver_for_slot(
    conn: Connection,
    settings: Settings,
    slot: DeliverySlot,
    candidates: list[repository.CandidateArticle],
) -> bool:
    """Generate and send one edition for a cadence slot. Returns True if sent."""
    user = slot.user
    cadence = slot.cadence

    if repository.has_sent_in_period(
        conn,
        user_id=user.id,
        cadence=cadence,
        period_start=period_start_utc(user, cadence),
    ):
        return False

    weights = repository.fetch_user_topic_weights(conn, user.id)
    engagement = repository.fetch_user_engagement_topic_counts(conn, user.id)
    ranked = rank_articles_for_user(
        candidates=candidates,
        topic_weights=weights,
        engagement_by_topic=engagement,
        cadence=cadence,
    )
    if not ranked:
        print(f"[deliver] no articles for {user.email} ({cadence})")
        return False

    topic_counts = Counter(r.top_topic for r in ranked if r.top_topic)
    trending = topic_counts.most_common(1)[0][0] if topic_counts else None
    subject = build_subject(trending)
    copy = write_newsletter_copy(
        settings,
        cadence=cadence,
        trending_topic=trending,
        articles=[
            {
                "id": item.article.id,
                "title": item.article.title,
                "summary": item.article.summary,
                "topic": item.top_topic,
                "fallback_reason": item.reason,
            }
            for item in ranked
        ],
        use_llm=repository.llm_copy_enabled(conn),
    )
    intro = copy["intro"]
    reasons: dict[str, str] = copy["reasons"]

    newsletter_id = repository.new_id()
    unsubscribe_url = f"{settings.app_url}/unsubscribe?t={user.unsubscribe_token}"
    list_unsubscribe_url = (
        f"{settings.app_url}/api/unsubscribe?t={user.unsubscribe_token}"
    )

    views: list[ArticleView] = []
    for item in ranked:
        tracked = (
            f"{settings.app_url}/api/track/click"
            f"?n={newsletter_id}&a={item.article.id}"
        )
        topics = [t[2] for t in item.article.topics]
        reason = reasons.get(item.article.id) or item.reason
        views.append(
            ArticleView(
                title=item.article.title,
                summary=item.article.summary,
                reason=reason,
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
            unsubscribe_url=unsubscribe_url,
            recipient_email=user.email,
            branding=branding_for(cadence),
        )
    )

    repository.create_newsletter(
        conn,
        newsletter_id=newsletter_id,
        user_id=user.id,
        subject=subject,
        intro=intro,
        html_content=html,
        cadence=cadence,
        status="READY",
        sent_at=None,
    )

    for rank_index, item in enumerate(ranked, start=1):
        repository.insert_newsletter_article(
            conn,
            newsletter_id=newsletter_id,
            article_id=item.article.id,
            rank=rank_index,
            reason=reasons.get(item.article.id) or item.reason,
            tracked_url=(
                f"{settings.app_url}/api/track/click"
                f"?n={newsletter_id}&a={item.article.id}"
            ),
        )

    try:
        send_email(
            settings,
            to=user.email,
            subject=subject,
            html=html,
            list_unsubscribe_url=list_unsubscribe_url,
        )
    except Exception:
        repository.update_newsletter_status(conn, newsletter_id, status="FAILED")
        raise

    repository.update_newsletter_status(
        conn,
        newsletter_id,
        status="SENT",
        sent_at=datetime.now(timezone.utc),
    )
    print(f"[deliver] sent {cadence} edition to {user.email}")
    return True


def run_deliver(conn: Connection, settings: Settings) -> int:
    users = repository.fetch_auto_send_users(conn)
    slots = [slot for user in users for slot in due_slots_for_user(user)]
    if not slots:
        print("[deliver] no users due this hour")
        return 0

    candidates = repository.fetch_candidate_articles(conn)
    sent = 0
    for slot in slots:
        try:
            if deliver_for_slot(conn, settings, slot, candidates):
                sent += 1
        except Exception as exc:  # noqa: BLE001
            print(f"[deliver] failed for {slot.user.email} ({slot.cadence}): {exc}")
    return sent
