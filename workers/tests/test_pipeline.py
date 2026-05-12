from __future__ import annotations

from datetime import UTC, datetime

from workers.answering import ExtractiveAnswerGenerator
from workers.cache import MemorySemanticCache
from workers.chunking import split_text
from workers.contracts import (
    IngestJobEnvelope,
    QueryJobEnvelope,
    QueryResult,
)
from workers.embeddings import DeterministicEmbeddingAdapter
from workers.services import IngestionService, QueryService
from workers.storage import MemoryObjectStorage
from workers.vector_store import MemoryVectorStore


def test_chunking_is_deterministic() -> None:
    chunks_a = split_text("hello world " * 100, "source-1", "doc-1", 120, 20)
    chunks_b = split_text("hello world " * 100, "source-1", "doc-1", 120, 20)
    assert [chunk.chunk_id for chunk in chunks_a] == [chunk.chunk_id for chunk in chunks_b]


async def _build_services() -> tuple[IngestionService, QueryService, MemoryVectorStore]:
    vector_store = MemoryVectorStore()
    embeddings = DeterministicEmbeddingAdapter(32)
    ingestion_service = IngestionService(
        storage=MemoryObjectStorage(),
        vector_store=vector_store,
        embeddings=embeddings,
        chunk_size=120,
        chunk_overlap=20,
        sparse_dimensions=256,
    )
    query_service = QueryService(
        vector_store=vector_store,
        cache=MemorySemanticCache(),
        embeddings=embeddings,
        answer_generator=ExtractiveAnswerGenerator(),
        sparse_dimensions=256,
        semantic_cache_threshold=0.9,
        semantic_cache_ttl_seconds=3600,
    )
    return ingestion_service, query_service, vector_store


async def test_reingestion_remains_idempotent() -> None:
    ingestion_service, _, vector_store = await _build_services()
    envelope = IngestJobEnvelope.model_validate(
        {
            "version": "v1",
            "jobName": "ingest.v1",
            "requestId": "req-1",
            "traceId": "trace-1",
            "payload": {
                "sourceId": "source-1",
                "title": "Doc",
                "content": "CloudRAG is a distributed retrieval system. " * 20,
                "contentType": "text/plain",
                "metadata": {"team": "core"},
                "storage": {"kind": "inline"},
                "submittedAt": datetime.now(tz=UTC).isoformat(),
            },
        }
    )

    first = await ingestion_service.ingest(envelope)
    second = await ingestion_service.ingest(envelope)

    assert first.chunk_count > 0
    assert second.duplicate_chunks == first.chunk_count
    assert len(vector_store._chunks) == first.chunk_count


async def test_query_cache_miss_then_hit() -> None:
    ingestion_service, query_service, _ = await _build_services()
    ingest_envelope = IngestJobEnvelope.model_validate(
        {
            "version": "v1",
            "jobName": "ingest.v1",
            "requestId": "req-1",
            "traceId": "trace-1",
            "payload": {
                "sourceId": "source-1",
                "title": "Doc",
                "content": (
                    "CloudRAG uses asynchronous ingestion with Redis queues and hybrid retrieval. "
                    * 20
                ),
                "contentType": "text/plain",
                "metadata": {"team": "core"},
                "storage": {"kind": "inline"},
                "submittedAt": datetime.now(tz=UTC).isoformat(),
            },
        }
    )
    await ingestion_service.ingest(ingest_envelope)

    query_envelope = QueryJobEnvelope.model_validate(
        {
            "version": "v1",
            "jobName": "query.v1",
            "requestId": "req-2",
            "traceId": "trace-2",
            "payload": {
                "prompt": "How does CloudRAG ingest data?",
                "topK": 3,
                "minScore": 0.01,
                "useCache": True,
                "cacheKey": "semantic-cache:v1:test",
                "collectionName": "cloudrag-documents",
                "embeddingModel": "deterministic-hash-v1",
                "promptTemplateVersion": "2026-05-12",
                "submittedAt": datetime.now(tz=UTC).isoformat(),
            },
        }
    )

    first = await query_service.query(query_envelope)
    second = await query_service.query(query_envelope)

    assert first.cache.hit is False
    assert second.cache.hit is True
    assert second.cache.similarity is not None
    assert len(first.sources) > 0


async def test_query_results_include_citations() -> None:
    ingestion_service, query_service, _ = await _build_services()
    ingest_envelope = IngestJobEnvelope.model_validate(
        {
            "version": "v1",
            "jobName": "ingest.v1",
            "requestId": "req-1",
            "traceId": "trace-1",
            "payload": {
                "sourceId": "source-9",
                "title": "Architecture",
                "content": "CloudRAG stores documents in object storage and vectors in Qdrant. " * 15,
                "contentType": "text/plain",
                "metadata": {"layer": "worker"},
                "storage": {"kind": "inline"},
                "submittedAt": datetime.now(tz=UTC).isoformat(),
            },
        }
    )
    await ingestion_service.ingest(ingest_envelope)
    query_envelope = QueryJobEnvelope.model_validate(
        {
            "version": "v1",
            "jobName": "query.v1",
            "requestId": "req-3",
            "traceId": "trace-3",
            "payload": {
                "prompt": "Where are vectors stored?",
                "topK": 2,
                "minScore": 0.01,
                "useCache": False,
                "cacheKey": "semantic-cache:v1:where",
                "collectionName": "cloudrag-documents",
                "embeddingModel": "deterministic-hash-v1",
                "promptTemplateVersion": "2026-05-12",
                "submittedAt": datetime.now(tz=UTC).isoformat(),
            },
        }
    )
    result: QueryResult = await query_service.query(query_envelope)
    assert result.sources
    assert result.sources[0].source_id == "source-9"
