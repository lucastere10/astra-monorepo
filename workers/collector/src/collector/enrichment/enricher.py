"""Article enrichment: summary, keywords, topics, entities.

Uses OpenAI when an API key is configured, otherwise falls back to fast,
deterministic heuristics so the pipeline remains fully runnable offline.
"""

from __future__ import annotations

import json
import re
from collections import Counter

from bs4 import BeautifulSoup

from ..config import Settings
from ..models import Enrichment, RawArticle
from ..openai_chat import create_chat_completion

_WORDS_PER_MINUTE = 220

# Keyword hints per topic slug used by the heuristic classifier.
_TOPIC_HINTS: dict[str, list[str]] = {
    "ai-agents": ["agent", "agents", "autonomous", "multi-agent"],
    "mcp": ["mcp", "model context protocol", "tool use", "tool calling"],
    "open-source-ai": ["open source", "open-source", "open weight", "llama", "mistral"],
    "llms": ["llm", "language model", "gpt", "claude", "gemini", "transformer"],
    "ai-engineering": ["rag", "fine-tune", "fine tuning", "inference", "prompt", "evals"],
    "cloud": ["cloud", "aws", "azure", "gcp", "kubernetes", "serverless"],
    "startups": ["startup", "funding", "seed", "series a", "venture", "raise"],
    "robotics": ["robot", "robotics", "humanoid", "actuator", "embodied"],
    "ai-research": ["paper", "arxiv", "benchmark", "research", "state of the art"],
    "security": ["security", "vulnerability", "exploit", "privacy", "breach"],
    "developer-tools": ["ide", "framework", "sdk", "developer", "library", "cli"],
}

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
    "is", "are", "was", "were", "be", "by", "as", "at", "it", "this", "that",
    "from", "has", "have", "will", "can", "your", "you", "we", "our", "their",
}


def _plain_text(raw: RawArticle) -> str:
    text = raw.content or ""
    if "<" in text and ">" in text:
        text = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
    return f"{raw.title}. {text}".strip()


def _reading_time(text: str) -> int:
    words = len(text.split())
    return max(1, round(words / _WORDS_PER_MINUTE))


def _heuristic(raw: RawArticle) -> Enrichment:
    text = _plain_text(raw)
    lower = text.lower()

    sentences = re.split(r"(?<=[.!?])\s+", text)
    summary = " ".join(sentences[:2])[:320] or raw.title

    tokens = [w for w in re.findall(r"[a-zA-Z]{4,}", lower) if w not in _STOPWORDS]
    keywords = [word for word, _ in Counter(tokens).most_common(8)]

    topics: list[tuple[str, float]] = []
    for slug, hints in _TOPIC_HINTS.items():
        hits = sum(1 for hint in hints if hint in lower)
        if hits:
            topics.append((slug, min(1.0, 0.4 + 0.2 * hits)))
    topics.sort(key=lambda t: t[1], reverse=True)

    reading_time = _reading_time(text)
    difficulty = (
        "ADVANCED"
        if reading_time > 9
        else "INTERMEDIATE"
        if reading_time > 4
        else "BEGINNER"
    )

    return Enrichment(
        summary=summary,
        keywords=keywords,
        topics=topics[:4],
        entities=[],
        reading_time_min=reading_time,
        difficulty=difficulty,
    )


def _openai(raw: RawArticle, settings: Settings) -> Enrichment | None:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        text = _plain_text(raw)[:6000]
        slugs = list(_TOPIC_HINTS.keys())

        prompt = (
            "You enrich technology news. Return strict JSON with keys: "
            "summary (2 sentences), keywords (array of strings), "
            "topics (array of {slug, relevance 0..1} using only these slugs: "
            f"{slugs}), entities (array of strings), difficulty "
            "(BEGINNER|INTERMEDIATE|ADVANCED).\n\n"
            f"TITLE: {raw.title}\n\nCONTENT: {text}"
        )

        completion = create_chat_completion(
            client,
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        payload = json.loads(completion.choices[0].message.content or "{}")

        topics = [
            (t["slug"], float(t.get("relevance", 0.5)))
            for t in payload.get("topics", [])
            if t.get("slug") in _TOPIC_HINTS
        ]

        return Enrichment(
            summary=payload.get("summary"),
            keywords=list(payload.get("keywords", []))[:10],
            topics=topics[:4],
            entities=list(payload.get("entities", []))[:10],
            reading_time_min=_reading_time(text),
            difficulty=payload.get("difficulty"),
        )
    except Exception as exc:  # noqa: BLE001 - fall back gracefully
        print(f"[enricher] OpenAI enrichment failed, using heuristic: {exc}")
        return None


def enrich(raw: RawArticle, settings: Settings) -> Enrichment:
    if settings.openai_api_key:
        result = _openai(raw, settings)
        if result is not None:
            return result
    return _heuristic(raw)
