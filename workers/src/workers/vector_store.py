from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Protocol

import httpx

from .contracts import ChunkRecord, SourceReference
from .hashing import cosine_similarity, sparse_dot


class VectorStore(Protocol):
    async def ensure_schema(self) -> None: ...

    async def existing_chunk_count(self, chunk_ids: list[str]) -> int: ...

    async def upsert_chunks(self, chunks: list[ChunkRecord]) -> None: ...

    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_vector: dict[int, float],
        top_k: int,
        min_score: float,
    ) -> list[SourceReference]: ...


class MemoryVectorStore:
    def __init__(self) -> None:
        self._chunks: dict[str, ChunkRecord] = {}

    async def ensure_schema(self) -> None:
        return None

    async def existing_chunk_count(self, chunk_ids: list[str]) -> int:
        return sum(1 for chunk_id in chunk_ids if chunk_id in self._chunks)

    async def upsert_chunks(self, chunks: list[ChunkRecord]) -> None:
        for chunk in chunks:
            self._chunks[chunk.chunk_id] = chunk

    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_vector: dict[int, float],
        top_k: int,
        min_score: float,
    ) -> list[SourceReference]:
        dense_ranked = sorted(
            (
                (
                    cosine_similarity(dense_vector, chunk.dense_vector),
                    chunk,
                )
                for chunk in self._chunks.values()
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        sparse_ranked = sorted(
            (
                (
                    sparse_dot(sparse_vector, chunk.sparse_vector),
                    chunk,
                )
                for chunk in self._chunks.values()
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        reciprocal_scores: defaultdict[str, float] = defaultdict(float)
        for rank, (_, chunk) in enumerate(dense_ranked[: top_k * 4], start=1):
            reciprocal_scores[chunk.chunk_id] += 1.0 / (60 + rank)
        for rank, (_, chunk) in enumerate(sparse_ranked[: top_k * 4], start=1):
            reciprocal_scores[chunk.chunk_id] += 1.0 / (60 + rank)

        merged = sorted(reciprocal_scores.items(), key=lambda item: item[1], reverse=True)
        results: list[SourceReference] = []
        for chunk_id, score in merged:
            if score < min_score:
                continue
            chunk = self._chunks[chunk_id]
            results.append(
                SourceReference(
                    sourceId=chunk.source_id,
                    chunkId=chunk.chunk_id,
                    documentHash=chunk.document_hash,
                    score=score,
                    content=chunk.content,
                    title=chunk.title,
                    metadata=chunk.metadata,
                )
            )
            if len(results) >= top_k:
                break
        return results


class QdrantVectorStore:
    def __init__(
        self,
        base_url: str,
        api_key: str | None,
        collection_name: str,
        dense_dimensions: int,
    ) -> None:
        self.collection_name = collection_name
        self.dense_dimensions = dense_dimensions
        headers = {"api-key": api_key} if api_key else None
        self.client = httpx.AsyncClient(base_url=base_url.rstrip("/"), headers=headers, timeout=20.0)

    async def ensure_schema(self) -> None:
        response = await self.client.get(f"/collections/{self.collection_name}")
        if response.status_code == 200:
            return
        response = await self.client.put(
            f"/collections/{self.collection_name}",
            json={
                "vectors": {
                    "dense": {
                        "size": self.dense_dimensions,
                        "distance": "Cosine",
                    }
                },
                "sparse_vectors": {
                    "sparse": {},
                },
            },
        )
        response.raise_for_status()

    async def existing_chunk_count(self, chunk_ids: list[str]) -> int:
        if not chunk_ids:
            return 0
        response = await self.client.post(
            f"/collections/{self.collection_name}/points",
            json={
                "ids": chunk_ids,
                "with_payload": False,
                "with_vector": False,
            },
        )
        response.raise_for_status()
        result = response.json().get("result", [])
        return len(result)

    async def upsert_chunks(self, chunks: list[ChunkRecord]) -> None:
        points = []
        for chunk in chunks:
            points.append(
                {
                    "id": chunk.chunk_id,
                    "payload": {
                        "source_id": chunk.source_id,
                        "chunk_id": chunk.chunk_id,
                        "chunk_hash": chunk.chunk_hash,
                        "document_hash": chunk.document_hash,
                        "title": chunk.title,
                        "content": chunk.content,
                        "content_type": chunk.content_type,
                        "created_at": chunk.created_at.astimezone(UTC).isoformat(),
                        "metadata": chunk.metadata,
                    },
                    "vector": {
                        "dense": chunk.dense_vector,
                        "sparse": {
                            "indices": list(chunk.sparse_vector.keys()),
                            "values": list(chunk.sparse_vector.values()),
                        },
                    },
                }
            )
        response = await self.client.put(
            f"/collections/{self.collection_name}/points",
            json={
                "points": points,
            },
        )
        response.raise_for_status()

    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_vector: dict[int, float],
        top_k: int,
        min_score: float,
    ) -> list[SourceReference]:
        response = await self.client.post(
            f"/collections/{self.collection_name}/points/query",
            json={
                "prefetch": [
                    {
                        "query": dense_vector,
                        "using": "dense",
                        "limit": max(top_k * 4, 8),
                    },
                    {
                        "query": {
                            "indices": list(sparse_vector.keys()),
                            "values": list(sparse_vector.values()),
                        },
                        "using": "sparse",
                        "limit": max(top_k * 4, 8),
                    },
                ],
                "query": {"fusion": "rrf"},
                "with_payload": True,
                "limit": top_k,
            },
        )
        response.raise_for_status()
        result = response.json().get("result", {})
        points = result.get("points", result if isinstance(result, list) else [])
        matches: list[SourceReference] = []
        for point in points:
            score = float(point.get("score", 0.0))
            if score < min_score:
                continue
            payload = point.get("payload", {})
            matches.append(
                SourceReference(
                    sourceId=payload["source_id"],
                    chunkId=payload["chunk_id"],
                    documentHash=payload["document_hash"],
                    score=score,
                    content=payload["content"],
                    title=payload.get("title"),
                    metadata=payload.get("metadata", {}),
                )
            )
        return matches

    async def close(self) -> None:
        await self.client.aclose()

