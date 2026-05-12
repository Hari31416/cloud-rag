from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Protocol

from redis import asyncio as redis_async

from .contracts import QueryResult, SemanticCacheEntry
from .hashing import cosine_similarity


class SemanticCache(Protocol):
    async def ping(self) -> bool: ...

    async def lookup(
        self,
        cache_key: str,
        prompt_embedding: list[float],
        collection_name: str,
        embedding_model: str,
        prompt_template_version: str,
        threshold: float,
    ) -> tuple[QueryResult | None, float | None]: ...

    async def store(self, entry: SemanticCacheEntry, ttl_seconds: int) -> None: ...


class MemorySemanticCache:
    def __init__(self) -> None:
        self.entries: dict[str, SemanticCacheEntry] = {}

    async def ping(self) -> bool:
        return True

    async def lookup(
        self,
        cache_key: str,
        prompt_embedding: list[float],
        collection_name: str,
        embedding_model: str,
        prompt_template_version: str,
        threshold: float,
    ) -> tuple[QueryResult | None, float | None]:
        exact = self.entries.get(cache_key)
        if exact:
            return exact.response, 1.0

        best_match: SemanticCacheEntry | None = None
        best_score = 0.0
        for entry in self.entries.values():
            if (
                entry.collection_name != collection_name
                or entry.embedding_model != embedding_model
                or entry.prompt_template_version != prompt_template_version
            ):
                continue
            score = cosine_similarity(prompt_embedding, entry.query_embedding)
            if score >= threshold and score > best_score:
                best_match = entry
                best_score = score
        if best_match is None:
            return None, None
        return best_match.response, best_score

    async def store(self, entry: SemanticCacheEntry, ttl_seconds: int) -> None:
        self.entries[entry.cache_key] = entry


class RedisSemanticCache:
    def __init__(self, redis_url: str, namespace: str = "cloudrag:semantic-cache") -> None:
        self.namespace = namespace
        self.redis = redis_async.from_url(redis_url, decode_responses=True)

    async def ping(self) -> bool:
        return await self.redis.ping()

    async def lookup(
        self,
        cache_key: str,
        prompt_embedding: list[float],
        collection_name: str,
        embedding_model: str,
        prompt_template_version: str,
        threshold: float,
    ) -> tuple[QueryResult | None, float | None]:
        exact_key = self._entry_key(cache_key)
        exact_value = await self.redis.get(exact_key)
        if exact_value:
            entry = SemanticCacheEntry.model_validate_json(exact_value)
            return entry.response, 1.0

        entry_keys = await self.redis.smembers(self._index_key())
        best_match: SemanticCacheEntry | None = None
        best_score = 0.0
        for entry_key in entry_keys:
            payload = await self.redis.get(entry_key)
            if payload is None:
                continue
            entry = SemanticCacheEntry.model_validate_json(payload)
            if (
                entry.collection_name != collection_name
                or entry.embedding_model != embedding_model
                or entry.prompt_template_version != prompt_template_version
            ):
                continue
            score = cosine_similarity(prompt_embedding, entry.query_embedding)
            if score >= threshold and score > best_score:
                best_match = entry
                best_score = score

        if best_match is None:
            return None, None
        return best_match.response, best_score

    async def store(self, entry: SemanticCacheEntry, ttl_seconds: int) -> None:
        serialized = entry.model_dump_json(by_alias=True)
        redis_key = self._entry_key(entry.cache_key)
        async with self.redis.pipeline(transaction=True) as pipeline:
            await pipeline.set(redis_key, serialized, ex=ttl_seconds)
            await pipeline.sadd(self._index_key(), redis_key)
            await pipeline.execute()

    def _entry_key(self, cache_key: str) -> str:
        return f"{self.namespace}:entry:{cache_key}"

    def _index_key(self) -> str:
        return f"{self.namespace}:index"

