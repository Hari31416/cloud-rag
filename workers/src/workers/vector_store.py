from __future__ import annotations

from collections import defaultdict
from datetime import UTC
from typing import Any, Protocol

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
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.http import models

        self.collection_name = collection_name
        self.dense_dimensions = dense_dimensions
        self.models = models
        self.client = AsyncQdrantClient(
            url=base_url.rstrip("/"),
            api_key=api_key,
            timeout=20.0,
        )

    async def ensure_schema(self) -> None:
        exists = await self.client.collection_exists(self.collection_name)
        if exists:
            return

        await self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config={
                "dense": self.models.VectorParams(
                    size=self.dense_dimensions,
                    distance=self.models.Distance.COSINE,
                )
            },
            sparse_vectors_config={"sparse": self.models.SparseVectorParams()},
        )
        for field_name in ("source_id", "chunk_id", "document_hash"):
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name=field_name,
                field_schema=self.models.PayloadSchemaType.KEYWORD,
            )

    async def existing_chunk_count(self, chunk_ids: list[str]) -> int:
        if not chunk_ids:
            return 0
        points = await self.client.retrieve(
            collection_name=self.collection_name,
            ids=chunk_ids,
            with_payload=False,
            with_vectors=False,
        )
        return len(points)

    async def upsert_chunks(self, chunks: list[ChunkRecord]) -> None:
        points: list[Any] = []
        for chunk in chunks:
            points.append(
                self.models.PointStruct(
                    id=chunk.chunk_id,
                    payload={
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
                    vector={
                        "dense": chunk.dense_vector,
                        "sparse": self.models.SparseVector(
                            indices=list(chunk.sparse_vector.keys()),
                            values=list(chunk.sparse_vector.values()),
                        ),
                    },
                )
            )
        await self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

    async def hybrid_search(
        self,
        dense_vector: list[float],
        sparse_vector: dict[int, float],
        top_k: int,
        min_score: float,
    ) -> list[SourceReference]:
        prefetch = [
            self.models.Prefetch(
                query=dense_vector,
                using="dense",
                limit=max(top_k * 4, 8),
            )
        ]
        if sparse_vector:
            prefetch.append(
                self.models.Prefetch(
                    query=self.models.SparseVector(
                        indices=list(sparse_vector.keys()),
                        values=list(sparse_vector.values()),
                    ),
                    using="sparse",
                    limit=max(top_k * 4, 8),
                )
            )

        response = await self.client.query_points(
            collection_name=self.collection_name,
            prefetch=prefetch,
            query=self.models.FusionQuery(fusion=self.models.Fusion.RRF),
            with_payload=True,
            limit=top_k,
        )
        points = getattr(response, "points", response)
        matches: list[SourceReference] = []
        for point in points:
            score = float(getattr(point, "score", 0.0))
            if score < min_score:
                continue
            payload = getattr(point, "payload", {}) or {}
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
        close = getattr(self.client, "close", None) or getattr(self.client, "aclose", None)
        if callable(close):
            await close()
