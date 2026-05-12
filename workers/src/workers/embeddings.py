from __future__ import annotations

import hashlib
import math
from typing import Protocol

from .hashing import tokenize


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
    def __init__(self, model: str) -> None:
        self.model = model

    async def embed_text(self, text: str) -> list[float]:
        return (await self.embed_texts([text]))[0]

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        from litellm import aembedding

        response = await aembedding(model=self.model, input=texts)
        return [item["embedding"] for item in response["data"]]

