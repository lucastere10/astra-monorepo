"""Data-access layer. Uses explicit SQL so we can interoperate with the
Prisma-managed schema (mixed-case identifiers and Postgres enum types)."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Sequence

from sqlalchemy import text
from sqlalchemy.engine import Connection


def _new_id() -> str:
    return uuid.uuid4().hex


def new_id() -> str:
    return _new_id()


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Source:
    id: str
    name: str
    url: str
    type: str
    config: dict[str, Any] | None = None


def fetch_active_sources(conn: Connection) -> list[Source]:
    rows = conn.execute(
        text(
            'SELECT id, name, url, type, config FROM "NewsSource" '
            'WHERE "isActive" = true'
        )
    ).fetchall()
    sources: list[Source] = []
    for r in rows:
        config = r[4]
        if isinstance(config, str):
            try:
                config = json.loads(config)
            except json.JSONDecodeError:
                config = None
        sources.append(
            Source(
                id=r[0],
                name=r[1],
                url=r[2],
                type=str(r[3]),
                config=config if isinstance(config, dict) else None,
            )
        )
    return sources


def fetch_topic_map(conn: Connection) -> dict[str, str]:
    """Return {slug: topicId}."""
    rows = conn.execute(text('SELECT id, slug FROM "Topic"')).fetchall()
    return {r[1]: r[0] for r in rows}


def article_exists(conn: Connection, url: str) -> bool:
    row = conn.execute(
        text('SELECT 1 FROM "Article" WHERE url = :url LIMIT 1'), {"url": url}
    ).first()
    return row is not None


def fetch_recent_articles_for_dedup(
    conn: Connection, *, lookback_days: int, limit: int
) -> list[tuple[str, str | None, list[float], str, str]]:
    """Return (id, duplicateCluster, embedding, title, url) for recent articles."""
    since = _now() - timedelta(days=lookback_days)
    rows = conn.execute(
        text(
            '''
            SELECT id, "duplicateCluster", embedding, title, url
            FROM "Article"
            WHERE "createdAt" >= :since
            ORDER BY "globalScore" DESC
            LIMIT :limit
            '''
        ),
        {"since": since, "limit": limit},
    ).fetchall()

    result: list[tuple[str, str | None, list[float], str, str]] = []
    for r in rows:
        emb = r[2] or []
        if not isinstance(emb, list):
            emb = list(emb) if emb is not None else []
        result.append((r[0], r[1], [float(x) for x in emb], r[3], r[4]))
    return result


def insert_article(
    conn: Connection,
    *,
    article_id: str | None = None,
    url: str,
    title: str,
    summary: str | None,
    content: str | None,
    keywords: Sequence[str],
    embedding: Sequence[float],
    reading_time_min: int | None,
    global_score: float,
    duplicate_cluster: str | None,
    entities: Sequence[str],
    published_at: datetime | None,
    source_id: str | None,
) -> str:
    aid = article_id or _new_id()
    conn.execute(
        text(
            '''
            INSERT INTO "Article"
              (id, url, title, summary, content, keywords, embedding,
               "readingTimeMin", "globalScore", "duplicateCluster", entities,
               "publishedAt", "sourceId", "createdAt", "updatedAt")
            VALUES
              (:id, :url, :title, :summary, :content, :keywords, :embedding,
               :reading_time, :global_score, :duplicate_cluster, :entities,
               :published_at, :source_id, :now, :now)
            '''
        ),
        {
            "id": aid,
            "url": url,
            "title": title,
            "summary": summary,
            "content": content,
            "keywords": list(keywords),
            "embedding": list(embedding),
            "reading_time": reading_time_min,
            "global_score": global_score,
            "duplicate_cluster": duplicate_cluster,
            "entities": list(entities),
            "published_at": published_at,
            "source_id": source_id,
            "now": _now(),
        },
    )
    return aid


def insert_article_topic(
    conn: Connection, *, article_id: str, topic_id: str, relevance: float
) -> None:
    conn.execute(
        text(
            '''
            INSERT INTO "ArticleTopic" (id, "articleId", "topicId", relevance)
            VALUES (:id, :article_id, :topic_id, :relevance)
            ON CONFLICT ("articleId", "topicId") DO NOTHING
            '''
        ),
        {
            "id": _new_id(),
            "article_id": article_id,
            "topic_id": topic_id,
            "relevance": relevance,
        },
    )


def mark_source_fetched(conn: Connection, source_id: str) -> None:
    conn.execute(
        text(
            'UPDATE "NewsSource" SET "lastFetchedAt" = :now, "updatedAt" = :now '
            "WHERE id = :id"
        ),
        {"now": _now(), "id": source_id},
    )


def start_worker(conn: Connection, worker_name: str) -> str:
    worker_id = _new_id()
    conn.execute(
        text(
            '''
            INSERT INTO "WorkerExecution"
              (id, "workerName", status, "itemsProcessed", "startedAt")
            VALUES (:id, :name, CAST('RUNNING' AS "WorkerStatus"), 0, :now)
            '''
        ),
        {"id": worker_id, "name": worker_name, "now": _now()},
    )
    return worker_id


def finish_worker(
    conn: Connection,
    worker_id: str,
    *,
    status: str,
    items_processed: int,
    logs: str | None = None,
    error: str | None = None,
) -> None:
    conn.execute(
        text(
            '''
            UPDATE "WorkerExecution"
            SET status = CAST(:status AS "WorkerStatus"),
                "itemsProcessed" = :items,
                logs = :logs,
                error = :error,
                "finishedAt" = :now
            WHERE id = :id
            '''
        ),
        {
            "status": status,
            "items": items_processed,
            "logs": logs,
            "error": error,
            "now": _now(),
            "id": worker_id,
        },
    )


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------


@dataclass
class DeliveryUser:
    id: str
    email: str
    timezone: str
    auto_send_enabled: bool
    daily_enabled: bool
    daily_send_hour: int
    daily_send_days: list[int]
    weekly_enabled: bool
    weekly_send_hour: int
    weekly_send_day: int
    unsubscribe_token: str


def fetch_auto_send_users(conn: Connection) -> list[DeliveryUser]:
    rows = conn.execute(
        text(
            '''
            SELECT u.id, u.email, u.timezone, u."autoSendEnabled",
                   u."dailyEnabled", u."dailySendHour", u."dailySendDays",
                   u."weeklyEnabled", u."weeklySendHour", u."weeklySendDay",
                   u."unsubscribeToken"
            FROM "User" u
            WHERE u."autoSendEnabled" = true
              AND (
                u."dailyEnabled" = true OR u."weeklyEnabled" = true
              )
              AND EXISTS (
                SELECT 1 FROM "UserPreference" p WHERE p."userId" = u.id
              )
            '''
        )
    ).fetchall()
    return [
        DeliveryUser(
            id=r[0],
            email=r[1],
            timezone=r[2],
            auto_send_enabled=bool(r[3]),
            daily_enabled=bool(r[4]),
            daily_send_hour=int(r[5]),
            daily_send_days=[int(d) for d in (r[6] or [])],
            weekly_enabled=bool(r[7]),
            weekly_send_hour=int(r[8]),
            weekly_send_day=int(r[9]),
            unsubscribe_token=str(r[10]),
        )
        for r in rows
    ]


def fetch_user_topic_weights(conn: Connection, user_id: str) -> list[tuple[str, float]]:
    rows = conn.execute(
        text(
            'SELECT "topicId", weight FROM "UserPreference" WHERE "userId" = :uid'
        ),
        {"uid": user_id},
    ).fetchall()
    return [(r[0], float(r[1])) for r in rows]


def fetch_user_engagement_topic_counts(
    conn: Connection, user_id: str, sample: int = 500
) -> dict[str, int]:
    rows = conn.execute(
        text(
            '''
            SELECT at."topicId", COUNT(*) AS c
            FROM "UserArticleInteraction" i
            JOIN "ArticleTopic" at ON at."articleId" = i."articleId"
            WHERE i."userId" = :uid
            GROUP BY at."topicId"
            LIMIT :sample
            '''
        ),
        {"uid": user_id, "sample": sample},
    ).fetchall()
    return {r[0]: int(r[1]) for r in rows}


@dataclass
class CandidateArticle:
    id: str
    title: str
    summary: str | None
    url: str
    global_score: float
    published_at: datetime | None
    duplicate_cluster: str | None
    reading_time_min: int | None
    source_name: str | None
    topics: list[tuple[str, float, str]]  # topicId, relevance, name


def fetch_candidate_articles(conn: Connection, limit: int = 200) -> list[CandidateArticle]:
    since = _now() - timedelta(days=30)
    rows = conn.execute(
        text(
            '''
            SELECT a.id, a.title, a.summary, a.url, a."globalScore", a."publishedAt",
                   a."duplicateCluster", a."readingTimeMin", s.name
            FROM "Article" a
            LEFT JOIN "NewsSource" s ON s.id = a."sourceId"
            WHERE (a."publishedAt" IS NOT NULL AND a."publishedAt" >= :since)
               OR (a."publishedAt" IS NULL AND a."createdAt" >= :since)
            ORDER BY a."globalScore" DESC
            LIMIT :limit
            '''
        ),
        {"since": since, "limit": limit},
    ).fetchall()

    if not rows:
        return []

    ids = [r[0] for r in rows]
    topics_by_article: dict[str, list[tuple[str, float, str]]] = {}
    # Chunk IN queries to stay within driver parameter limits.
    chunk_size = 50
    for i in range(0, len(ids), chunk_size):
        chunk = ids[i : i + chunk_size]
        placeholders = ", ".join(f":id{j}" for j in range(len(chunk)))
        params = {f"id{j}": aid for j, aid in enumerate(chunk)}
        topic_rows = conn.execute(
            text(
                f'''
                SELECT at."articleId", at."topicId", at.relevance, t.name
                FROM "ArticleTopic" at
                JOIN "Topic" t ON t.id = at."topicId"
                WHERE at."articleId" IN ({placeholders})
                '''
            ),
            params,
        ).fetchall()
        for tr in topic_rows:
            topics_by_article.setdefault(tr[0], []).append(
                (tr[1], float(tr[2]), tr[3])
            )

    return [
        CandidateArticle(
            id=r[0],
            title=r[1],
            summary=r[2],
            url=r[3],
            global_score=float(r[4] or 0),
            published_at=r[5],
            duplicate_cluster=r[6],
            reading_time_min=r[7],
            source_name=r[8],
            topics=topics_by_article.get(r[0], []),
        )
        for r in rows
    ]


def has_sent_in_period(
    conn: Connection,
    *,
    user_id: str,
    cadence: str,
    period_start: datetime,
) -> bool:
    row = conn.execute(
        text(
            '''
            SELECT 1 FROM "Newsletter"
            WHERE "userId" = :uid
              AND status = CAST('SENT' AS "NewsletterStatus")
              AND cadence = CAST(:cadence AS "NewsletterCadence")
              AND "sentAt" >= :start
            LIMIT 1
            '''
        ),
        {"uid": user_id, "cadence": cadence, "start": period_start},
    ).first()
    return row is not None


def create_newsletter(
    conn: Connection,
    *,
    newsletter_id: str | None = None,
    user_id: str,
    subject: str,
    intro: str,
    html_content: str,
    cadence: str,
    status: str,
    sent_at: datetime | None,
) -> str:
    nid = newsletter_id or _new_id()
    conn.execute(
        text(
            '''
            INSERT INTO "Newsletter"
              (id, "userId", subject, intro, "htmlContent", status, cadence,
               "sentAt", "createdAt", "updatedAt")
            VALUES
              (:id, :uid, :subject, :intro, :html, CAST(:status AS "NewsletterStatus"),
               CAST(:cadence AS "NewsletterCadence"), :sent_at, :now, :now)
            '''
        ),
        {
            "id": nid,
            "uid": user_id,
            "subject": subject,
            "intro": intro,
            "html": html_content,
            "status": status,
            "cadence": cadence,
            "sent_at": sent_at,
            "now": _now(),
        },
    )
    return nid


def insert_newsletter_article(
    conn: Connection,
    *,
    newsletter_id: str,
    article_id: str,
    rank: int,
    reason: str | None,
    tracked_url: str | None,
) -> None:
    conn.execute(
        text(
            '''
            INSERT INTO "NewsletterArticle"
              (id, "newsletterId", "articleId", rank, reason, "trackedUrl")
            VALUES (:id, :nid, :aid, :rank, :reason, :tracked)
            ON CONFLICT ("newsletterId", "articleId") DO NOTHING
            '''
        ),
        {
            "id": _new_id(),
            "nid": newsletter_id,
            "aid": article_id,
            "rank": rank,
            "reason": reason,
            "tracked": tracked_url,
        },
    )


def update_newsletter_status(
    conn: Connection,
    newsletter_id: str,
    *,
    status: str,
    sent_at: datetime | None = None,
) -> None:
    conn.execute(
        text(
            '''
            UPDATE "Newsletter"
            SET status = CAST(:status AS "NewsletterStatus"),
                "sentAt" = COALESCE(:sent_at, "sentAt"),
                "updatedAt" = :now
            WHERE id = :id
            '''
        ),
        {
            "status": status,
            "sent_at": sent_at,
            "now": _now(),
            "id": newsletter_id,
        },
    )
