"""Embeddings generation.

Uses OpenAI embeddings when configured. The offline fallback produces a
deterministic, low-dimensional hashed bag-of-words vector so the column is
always populated and similarity remains meaningful within a run.
"""

from __future__ import annotations

import hashlib
import math
import re

from ..config import Settings

_FALLBACK_DIM = 64


def _hashed_embedding(text: str, dim: int = _FALLBACK_DIM) -> list[float]:
    vector = [0.0] * dim
    for token in re.findall(r"[a-zA-Z]{3,}", text.lower()):
        digest = hashlib.md5(token.encode("utf-8")).digest()
        index = digest[0] % dim
        vector[index] += 1.0
    norm = math.sqrt(sum(v * v for v in vector))
    if norm == 0:
        return vector
    return [v / norm for v in vector]


def _openai_embedding(text: str, settings: Settings) -> list[float] | None:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.embeddings.create(
            model=settings.openai_embedding_model,
            input=text[:8000],
        )
        return list(response.data[0].embedding)
    except Exception as exc:  # noqa: BLE001
        print(f"[embedder] OpenAI embedding failed, using fallback: {exc}")
        return None


def embed(text: str, settings: Settings) -> list[float]:
    if settings.openai_api_key:
        result = _openai_embedding(text, settings)
        if result is not None:
            return result
    return _hashed_embedding(text)
