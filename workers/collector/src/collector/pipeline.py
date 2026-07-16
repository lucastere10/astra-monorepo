"""Per-source collection pipeline: collect -> enrich -> embed -> score -> dedup -> store."""

from __future__ import annotations

from sqlalchemy.engine import Connection

from . import repository
from .collectors import collect_exa, collect_rss, collect_scrape
from .config import Settings
from .dedup import resolve_duplicate_cluster
from .embeddings import embed
from .enrichment import enrich
from .enrichment.enricher import _plain_text
from .models import RawArticle
from .repository import Source
from .scoring import compute_global_score


def _collect(source: Source, limit: int, settings: Settings) -> list[RawArticle]:
    if source.type == "RSS":
        return collect_rss(source.url, limit)
    if source.type == "SCRAPER":
        return collect_scrape(source.url, limit)
    if source.type == "API":
        provider = (source.config or {}).get("provider")
        if provider == "exa":
            return collect_exa(source, limit, settings)
        print(
            f"[pipeline] API provider {provider!r} not supported yet: {source.name}"
        )
        return []
    print(f"[pipeline] source type {source.type} not supported yet: {source.name}")
    return []


def process_source(
    conn: Connection,
    source: Source,
    topic_map: dict[str, str],
    settings: Settings,
) -> int:
    raws = _collect(source, settings.max_articles_per_source, settings)
    inserted = 0

    candidates = repository.fetch_recent_articles_for_dedup(
        conn,
        lookback_days=settings.dedup_lookback_days,
        limit=settings.dedup_candidate_limit,
    )

    for raw in raws:
        if repository.article_exists(conn, raw.url):
            continue

        enrichment = enrich(raw, settings)
        embedding = embed(_plain_text(raw), settings)
        score = compute_global_score(raw, enrichment)

        article_id = repository.new_id()
        cluster = resolve_duplicate_cluster(
            article_id=article_id,
            embedding=list(embedding),
            title=raw.title,
            url=raw.url,
            candidates=candidates,
            threshold=settings.dedup_similarity_threshold,
        )

        repository.insert_article(
            conn,
            article_id=article_id,
            url=raw.url,
            title=raw.title,
            summary=enrichment.summary,
            content=raw.content,
            keywords=enrichment.keywords,
            embedding=embedding,
            reading_time_min=enrichment.reading_time_min,
            global_score=score,
            duplicate_cluster=cluster,
            entities=enrichment.entities,
            published_at=raw.published_at,
            source_id=source.id,
        )

        # Keep in-memory candidates fresh within the same run.
        candidates.append(
            (article_id, cluster, list(embedding), raw.title, raw.url)
        )

        for slug, relevance in enrichment.topics:
            topic_id = topic_map.get(slug)
            if topic_id:
                repository.insert_article_topic(
                    conn,
                    article_id=article_id,
                    topic_id=topic_id,
                    relevance=relevance,
                )

        inserted += 1

    repository.mark_source_fetched(conn, source.id)
    return inserted
