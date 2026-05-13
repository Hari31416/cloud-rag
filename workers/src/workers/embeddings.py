from __future__ import annotations

import hashlib
import math
from typing import Protocol

from .hashing import tokenize
from .llm_utils import embedding_completion


class EmbeddingAdapter(Protocol):
    async def embed_texts(self, texts: list[str]) -> list[list[float]]: ...

    async def embed_text(self, text: str) -> list[float]: ...


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


class DeterministicEmbeddingAdapter:
    def __init__(self, dimensions: int) -> None:
        self.dimensions = dimensions

    async def embed_text(self, text: str) -> list[float]:
        return (await self.embed_texts([text]))[0]

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            vector = [0.0] * self.dimensions
            for token in tokenize(text):
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                index = int.from_bytes(digest[:4], "big") % self.dimensions
                sign = 1.0 if digest[4] % 2 == 0 else -1.0
                vector[index] += sign
            vectors.append(_normalize(vector))
        return vectors


class LiteLLMEmbeddingAdapter:
    def __init__(
        self,
        model: str,
        dimensions: int,
        batch_size: int = 64,
        api_key: str | None = None,
        api_base: str | None = None,
    ) -> None:
        self.model = model
        self.dimensions = dimensions
        self.batch_size = batch_size
        self.api_key = api_key
        self.api_base = api_base

    async def embed_text(self, text: str) -> list[float]:
        return (await self.embed_texts([text]))[0]

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        vectors: list[list[float]] = []
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            batch_vectors = await embedding_completion(
                model=self.model,
                inputs=batch,
                api_key=self.api_key,
                api_base=self.api_base,
                dimensions=self.dimensions,
            )
            for vector in batch_vectors:
                if len(vector) != self.dimensions:
                    raise ValueError(
                        f"Embedding dimension mismatch for model {self.model}: "
                        f"expected {self.dimensions}, got {len(vector)}"
                    )
            vectors.extend(batch_vectors)
        return vectors
