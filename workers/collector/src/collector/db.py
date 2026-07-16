"""Database engine and connection helpers (SQLAlchemy + psycopg2)."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import Connection

from .config import Settings

_engine: Engine | None = None


def get_engine(settings: Settings) -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
    return _engine


@contextmanager
def connection(settings: Settings) -> Iterator[Connection]:
    engine = get_engine(settings)
    with engine.begin() as conn:
        yield conn
