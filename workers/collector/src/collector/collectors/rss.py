"""RSS/Atom feed collector."""

from __future__ import annotations

from datetime import datetime, timezone
from time import mktime

import feedparser

from ..models import RawArticle


def _parse_published(entry: feedparser.FeedParserDict) -> datetime | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    try:
        return datetime.fromtimestamp(mktime(parsed), tz=timezone.utc)
    except (OverflowError, ValueError):
        return None


def _extract_content(entry: feedparser.FeedParserDict) -> str | None:
    if entry.get("summary"):
        return str(entry["summary"])
    content = entry.get("content")
    if content and isinstance(content, list) and content:
        return str(content[0].get("value"))
    return None


def collect_rss(feed_url: str, limit: int) -> list[RawArticle]:
    parsed = feedparser.parse(feed_url)
    articles: list[RawArticle] = []

    for entry in parsed.entries[:limit]:
        link = entry.get("link")
        title = entry.get("title")
        if not link or not title:
            continue
        articles.append(
            RawArticle(
                url=str(link),
                title=str(title).strip(),
                content=_extract_content(entry),
                published_at=_parse_published(entry),
            )
        )

    return articles
