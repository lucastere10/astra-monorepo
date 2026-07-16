"""Exa Search API collector."""

from __future__ import annotations

from datetime import datetime, timezone

import requests

from ..config import Settings
from ..models import RawArticle
from ..repository import Source

_TIMEOUT = 30


def collect_exa(
    source: Source, limit: int, settings: Settings
) -> list[RawArticle]:
    if not settings.exa_api_key:
        print(f"[exa] EXA_API_KEY not set; skipping {source.name}")
        return []

    config = source.config or {}
    query = config.get("query") or source.name
    num_results = min(int(config.get("numResults") or limit), limit)
    category = config.get("category")

    payload: dict = {
        "query": query,
        "numResults": num_results,
        "type": "auto",
        "contents": {
            "text": {"maxCharacters": 2000},
        },
    }
    if category:
        payload["category"] = category

    try:
        response = requests.post(
            "https://api.exa.ai/search",
            headers={
                "x-api-key": settings.exa_api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        print(f"[exa] failed for {source.name}: {exc}")
        return []

    articles: list[RawArticle] = []
    for result in data.get("results") or []:
        url = result.get("url")
        title = result.get("title")
        if not url or not title:
            continue

        text = None
        contents = result.get("text") or result.get("summary")
        if isinstance(contents, str):
            text = contents

        published_at = None
        published = result.get("publishedDate")
        if published:
            try:
                published_at = datetime.fromisoformat(
                    published.replace("Z", "+00:00")
                )
                if published_at.tzinfo is None:
                    published_at = published_at.replace(tzinfo=timezone.utc)
            except ValueError:
                published_at = None

        articles.append(
            RawArticle(
                url=str(url),
                title=str(title).strip(),
                content=text,
                published_at=published_at,
            )
        )

    return articles[:limit]
