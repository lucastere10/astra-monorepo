"""Minimal HTML scraper collector.

Fetches a page and extracts the main textual content. This is intentionally
simple; production scraping would use per-source rules.
"""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from ..models import RawArticle

_HEADERS = {"User-Agent": "AstraCollector/0.1 (+https://astra.local)"}
_TIMEOUT = 15


def _clean_text(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    return "\n".join(p for p in paragraphs if p)


def collect_scrape(url: str, limit: int) -> list[RawArticle]:
    try:
        response = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[scraper] failed to fetch {url}: {exc}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else url
    content = _clean_text(soup)

    if not content:
        return []

    return [RawArticle(url=url, title=title, content=content)][:limit]
