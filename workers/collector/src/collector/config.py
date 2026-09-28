"""Runtime configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Monorepo root `.env` (same file as web app + Prisma).
_REPO_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(_REPO_ROOT / ".env")


def _normalize_db_url(url: str) -> str:
    """Prisma-style URLs use the `postgresql://` scheme and may carry a
    `schema` query param. SQLAlchemy + psycopg2 wants `postgresql+psycopg2://`
    and does not understand `schema`, so we strip it."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    # Drop the Prisma-only `schema` query parameter if present.
    if "schema=" in url:
        base, _, query = url.partition("?")
        params = [p for p in query.split("&") if not p.startswith("schema=")]
        url = base + (("?" + "&".join(params)) if params else "")
    return url


@dataclass(frozen=True)
class Settings:
    database_url: str
    openai_api_key: str | None
    openai_model: str
    openai_embedding_model: str
    max_articles_per_source: int
    exa_api_key: str | None
    resend_api_key: str | None
    email_from: str
    app_url: str
    dedup_similarity_threshold: float
    dedup_lookback_days: int
    dedup_candidate_limit: int

    @classmethod
    def from_env(cls) -> "Settings":
        # Workers need a direct Postgres connection; web app may use the pooler URL.
        raw_db = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
        if not raw_db:
            raise RuntimeError("DIRECT_URL or DATABASE_URL is not set in the repo root .env")

        return cls(
            database_url=_normalize_db_url(raw_db),
            openai_api_key=os.environ.get("OPENAI_API_KEY") or None,
            openai_model=os.environ.get("OPENAI_MODEL", "gpt-5.6-luna"),
            openai_embedding_model=os.environ.get(
                "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
            ),
            max_articles_per_source=int(
                os.environ.get("MAX_ARTICLES_PER_SOURCE", "15")
            ),
            exa_api_key=os.environ.get("EXA_API_KEY") or None,
            resend_api_key=os.environ.get("RESEND_API_KEY") or None,
            email_from=os.environ.get(
                "EMAIL_FROM", "Astra Newsletter <onboarding@resend.dev>"
            ),
            app_url=(
                os.environ.get("APP_URL")
                or os.environ.get("NEXT_PUBLIC_APP_URL")
                or "http://localhost:3000"
            ).rstrip("/"),
            dedup_similarity_threshold=float(
                os.environ.get("DEDUP_SIMILARITY_THRESHOLD", "0.92")
            ),
            dedup_lookback_days=int(os.environ.get("DEDUP_LOOKBACK_DAYS", "14")),
            dedup_candidate_limit=int(
                os.environ.get("DEDUP_CANDIDATE_LIMIT", "100")
            ),
        )


settings = (
    Settings.from_env()
    if os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    else None
)
