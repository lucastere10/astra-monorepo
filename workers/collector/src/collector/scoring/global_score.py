"""Heuristic global quality score for a freshly collected article.

Combines freshness, content richness and topic coverage into a 0..1 score.
The recommendation engine in the web app combines this with per-user signals.
"""

from __future__ import annotations

from datetime import datetime, timezone

from ..models import Enrichment, RawArticle


def _freshness(published_at: datetime | None, half_life_hours: float = 48.0) -> float:
    if not published_at:
        return 0.3
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_hours = (now - published_at).total_seconds() / 3600.0
    if age_hours <= 0:
        return 1.0
    return max(0.0, min(1.0, 0.5 ** (age_hours / half_life_hours)))


def _richness(raw: RawArticle, enrichment: Enrichment) -> float:
    length = len(raw.content or "")
    length_score = min(1.0, length / 2000.0)
    keyword_score = min(1.0, len(enrichment.keywords) / 8.0)
    return 0.6 * length_score + 0.4 * keyword_score


def compute_global_score(raw: RawArticle, enrichment: Enrichment) -> float:
    freshness = _freshness(raw.published_at)
    richness = _richness(raw, enrichment)
    topic_coverage = min(1.0, len(enrichment.topics) / 3.0)

    score = 0.45 * richness + 0.35 * freshness + 0.20 * topic_coverage
    return round(max(0.0, min(1.0, score)), 4)
