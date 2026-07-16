"""Shared dataclasses for the collection pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawArticle:
    url: str
    title: str
    content: str | None = None
    published_at: datetime | None = None


@dataclass
class Enrichment:
    summary: str | None = None
    keywords: list[str] = field(default_factory=list)
    topics: list[tuple[str, float]] = field(default_factory=list)  # (slug, relevance)
    entities: list[str] = field(default_factory=list)
    reading_time_min: int | None = None
    difficulty: str | None = None
