"""Personalized ranking — port of apps/web recommendation + shared scoring."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlparse

from ..repository import CandidateArticle

SCORE_WEIGHTS = {
    "globalScore": 0.3,
    "topicAffinity": 0.3,
    "interactionScore": 0.2,
    "freshnessScore": 0.1,
    "diversityBonus": 0.1,
}

ARTICLE_LIMIT = {"DAILY": 6, "WEEKLY": 10}
DIVERSITY_PENALTY = {"DAILY": 0.2, "WEEKLY": 0.15}
SOURCE_FAMILY_CAP = {"DAILY": 1, "WEEKLY": 2}


def clamp01(value: float) -> float:
    if value != value:  # NaN
        return 0.0
    return min(1.0, max(0.0, value))


def freshness_score(
    published_at: datetime | None,
    now: datetime | None = None,
    half_life_hours: float = 48.0,
) -> float:
    if not published_at:
        return 0.0
    now = now or datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_hours = (now - published_at).total_seconds() / 3600.0
    if age_hours <= 0:
        return 1.0
    return clamp01(0.5 ** (age_hours / half_life_hours))


def compute_rank_score(
    *,
    global_score: float,
    topic_affinity: float,
    interaction_score: float,
    fresh: float,
    diversity_bonus: float = 0.0,
) -> float:
    return (
        clamp01(global_score) * SCORE_WEIGHTS["globalScore"]
        + clamp01(topic_affinity) * SCORE_WEIGHTS["topicAffinity"]
        + clamp01(interaction_score) * SCORE_WEIGHTS["interactionScore"]
        + clamp01(fresh) * SCORE_WEIGHTS["freshnessScore"]
        + clamp01(diversity_bonus) * SCORE_WEIGHTS["diversityBonus"]
    )


def source_family(source_url: str | None) -> str:
    """Group sibling feeds (HN, arXiv, Exa) by NewsSource URL host."""
    if not source_url:
        return "unknown"
    trimmed = source_url.strip()
    if trimmed.startswith("exa:") or trimmed.startswith("exa://"):
        return "exa"
    parsed = urlparse(trimmed)
    host = (parsed.hostname or "").removeprefix("www.")
    return host or trimmed


@dataclass
class RankedArticle:
    article: CandidateArticle
    score: float
    top_topic: str | None
    reason: str


def _build_reason(topic: str | None, fresh: float) -> str:
    if topic and fresh > 0.6:
        return f"Fresh and highly relevant to your interest in {topic}."
    if topic:
        return f"Matches your interest in {topic}."
    if fresh > 0.6:
        return "A timely story trending across your sources."
    return "Selected for its overall quality and relevance."


def rank_articles_for_user(
    *,
    candidates: list[CandidateArticle],
    topic_weights: list[tuple[str, float]],
    engagement_by_topic: dict[str, int],
    cadence: str,
) -> list[RankedArticle]:
    limit = ARTICLE_LIMIT.get(cadence, 10)
    diversity_penalty = DIVERSITY_PENALTY.get(cadence, 0.15)
    family_cap = SOURCE_FAMILY_CAP.get(cadence, 2)

    weight_by_topic = {tid: w for tid, w in topic_weights}
    total_weight = sum(weight_by_topic.values()) or 0.0
    max_engagement = max([1, *engagement_by_topic.values()])

    now = datetime.now(timezone.utc)
    scored: list[tuple[CandidateArticle, float, str | None, float, str]] = []

    for article in candidates:
        affinity_num = 0.0
        engagement_sum = 0.0
        top_topic: tuple[str, float] | None = None

        for topic_id, relevance, topic_name in article.topics:
            weight = weight_by_topic.get(topic_id, 0.0)
            affinity_num += relevance * weight
            engagement_sum += engagement_by_topic.get(topic_id, 0)
            if weight > 0 and (top_topic is None or weight > top_topic[1]):
                top_topic = (topic_name, weight)

        topic_affinity = (
            clamp01(affinity_num / total_weight) if total_weight > 0 else 0.0
        )
        interaction = clamp01(
            engagement_sum
            / (max_engagement * max(1, len(article.topics)))
        )
        fresh = freshness_score(article.published_at, now)
        base = compute_rank_score(
            global_score=article.global_score,
            topic_affinity=topic_affinity,
            interaction_score=interaction,
            fresh=fresh,
        )
        scored.append(
            (
                article,
                base,
                top_topic[0] if top_topic else None,
                fresh,
                source_family(article.source_url),
            )
        )

    scored.sort(key=lambda x: x[1], reverse=True)

    selected: list[RankedArticle] = []
    seen_clusters: set[str] = set()
    topic_usage: dict[str, int] = {}
    family_usage: dict[str, int] = {}

    for article, base, top_topic, fresh, family in scored:
        if len(selected) >= limit:
            break

        if article.duplicate_cluster:
            if article.duplicate_cluster in seen_clusters:
                continue

        family_count = family_usage.get(family, 0)
        if family_count >= family_cap:
            continue

        primary_topic = article.topics[0][0] if article.topics else None
        topic_count = topic_usage.get(primary_topic, 0) if primary_topic else 0
        adjusted = (
            base
            - topic_count * diversity_penalty
            - family_count * diversity_penalty
        )

        selected.append(
            RankedArticle(
                article=article,
                score=round(adjusted, 4),
                top_topic=top_topic,
                reason=_build_reason(top_topic, fresh),
            )
        )

        if article.duplicate_cluster:
            seen_clusters.add(article.duplicate_cluster)
        if primary_topic:
            topic_usage[primary_topic] = topic_count + 1
        family_usage[family] = family_count + 1

    selected.sort(key=lambda r: r.score, reverse=True)
    return selected
