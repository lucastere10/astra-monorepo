"""Editorial copy for a finished ranking: intro + Why it matters.

Mirrors apps/web/modules/newsletter/newsletter.voice.ts. Falls back to the
same templates the ranker already produced when OpenAI is unavailable.
"""

from __future__ import annotations

import json
from typing import Any

from ..config import Settings
from ..openai_chat import create_chat_completion


def _template_intro(
    article_count: int, trending: str | None, cadence: str
) -> str:
    period_word = "today" if cadence == "DAILY" else "this week"
    extra = f", with extra signal on {trending}" if trending else ""
    return (
        f"We curated {article_count} stories tuned to your interests"
        f"{extra}. Here is what matters most {period_word}."
    )


def _fallback(
    *,
    cadence: str,
    trending_topic: str | None,
    articles: list[dict[str, Any]],
) -> dict[str, Any]:
    reasons = {
        str(item["id"]): str(item.get("fallback_reason") or "")
        for item in articles
    }
    return {
        "intro": _template_intro(len(articles), trending_topic, cadence),
        "reasons": reasons,
    }


def write_newsletter_copy(
    settings: Settings,
    *,
    cadence: str,
    trending_topic: str | None,
    articles: list[dict[str, Any]],
) -> dict[str, Any]:
    fallback = _fallback(
        cadence=cadence, trending_topic=trending_topic, articles=articles
    )
    if not articles or not settings.openai_api_key:
        return fallback

    period_word = "today" if cadence == "DAILY" else "this week"
    catalog = [
        {
            "id": item["id"],
            "title": item.get("title"),
            "summary": item.get("summary"),
            "topic": item.get("topic"),
        }
        for item in articles
    ]
    thread = (
        f"A recurring thread is {trending_topic}." if trending_topic else ""
    )
    prompt = (
        "You write a short technology newsletter in English.\n"
        "Return strict JSON with keys: intro (string), reasons (object mapping article id to string).\n"
        f'intro: 1–2 sentences about the actual mix of stories below. Use "{period_word}". '
        "Do not list every title. Do not repeat a subject line. "
        'Do not say "curated for you" or "tuned to your interests".\n'
        f"{thread}\n"
        "reasons: one sentence per article, 12–20 words, specific to that story. "
        'No "your interest in", "highly relevant", "curated for you", or "selected for quality".\n\n'
        f"ARTICLES: {json.dumps(catalog)}"
    )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        completion = create_chat_completion(
            client,
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5,
        )
        payload = json.loads(completion.choices[0].message.content or "{}")
        intro = str(payload.get("intro") or "").strip()
        if not intro:
            return fallback
        generated = payload.get("reasons") or {}
        if not isinstance(generated, dict):
            generated = {}
        reasons: dict[str, str] = {}
        for item in articles:
            aid = str(item["id"])
            line = str(generated.get(aid) or "").strip()
            reasons[aid] = line or str(item.get("fallback_reason") or "")
        return {"intro": intro, "reasons": reasons}
    except Exception as exc:  # noqa: BLE001
        print(f"[deliver.voice] OpenAI copy failed, using templates: {exc}")
        return fallback
