"""Deduplication helpers: cosine similarity + URL/title normalization."""

from __future__ import annotations

import hashlib
import math
import re
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse


def normalize_url(url: str) -> str:
    """Strip tracking params and fragments for coarse URL dedup."""
    parsed = urlparse(url.strip())
    query = parse_qs(parsed.query, keep_blank_values=False)
    drop = {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "ref",
        "fbclid",
        "gclid",
    }
    cleaned = {k: v for k, v in query.items() if k.lower() not in drop}
    # Sort keys for stable comparison.
    new_query = urlencode(sorted((k, v[0]) for k, v in cleaned.items() if v), doseq=False)
    path = parsed.path.rstrip("/") or "/"
    return urlunparse(
        (parsed.scheme.lower(), parsed.netloc.lower(), path, "", new_query, "")
    )


def normalize_title(title: str) -> str:
    text = title.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def title_fingerprint(title: str) -> str:
    return hashlib.sha256(normalize_title(title).encode("utf-8")).hexdigest()[:32]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for x, y in zip(a, b):
        dot += x * y
        norm_a += x * x
        norm_b += y * y
    if norm_a <= 0.0 or norm_b <= 0.0:
        return 0.0
    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


def resolve_duplicate_cluster(
    *,
    article_id: str,
    embedding: list[float],
    title: str,
    url: str,
    candidates: list[tuple[str, str | None, list[float], str, str]],
    threshold: float,
) -> str:
    """Pick a cluster id for a new article.

    `candidates` rows: (id, duplicate_cluster, embedding, title, url)
    Prefer semantic match; fall back to normalized URL or title fingerprint.
    New unique articles become the canonical id of their own cluster.
    """
    norm_url = normalize_url(url)
    title_fp = title_fingerprint(title)

    best_sim = 0.0
    best_cluster: str | None = None

    for cand_id, cluster, cand_emb, cand_title, cand_url in candidates:
        cluster_id = cluster or cand_id

        if normalize_url(cand_url) == norm_url:
            return cluster_id
        if title_fingerprint(cand_title) == title_fp:
            return cluster_id

        if embedding and cand_emb:
            sim = cosine_similarity(embedding, cand_emb)
            if sim >= threshold and sim > best_sim:
                best_sim = sim
                best_cluster = cluster_id

    return best_cluster or article_id
