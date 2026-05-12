from __future__ import annotations

from datetime import UTC, datetime
from time import perf_counter

from .answering import AnswerGenerator
from .cache import SemanticCache
from .chunking import split_text
from .contracts import (
    ChunkRecord,
    IngestionResult,
    IngestJobEnvelope,
    QueryJobEnvelope,
    QueryResult,
    RetrievalMetadata,
    SemanticCacheEntry,
)
from .embeddings import EmbeddingAdapter
from .hashing import make_sparse_vector, sha256_text
from .storage import ObjectStorage
from .vector_store import VectorStore


class IngestionService:
    def __init__(
        self,
        storage: ObjectStorage,
        vector_store: VectorStore,
        embeddings: EmbeddingAdapter,
        chunk_size: int,
        chunk_overlap: int,
        sparse_dimensions: int,
    ) -> None:
        self.storage = storage
        self.vector_store = vector_store
        self.embeddings = embeddings
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.sparse_dimensions = sparse_dimensions

    async def ingest(self, envelope: IngestJobEnvelope) -> IngestionResult:
        await self.storage.ensure_bucket()
        await self.vector_store.ensure_schema()

        document_hash = sha256_text(envelope.payload.content)
        drafts = split_text(
            envelope.payload.content,
            envelope.payload.source_id,
            document_hash,
            self.chunk_size,
            self.chunk_overlap,
        )
        embeddings = await self.embeddings.embed_texts([draft.content for draft in drafts])
        created_at = datetime.now(tz=UTC)
        chunks = [
            ChunkRecord(
                chunk_id=draft.chunk_id,
                chunk_hash=draft.chunk_hash,
                source_id=envelope.payload.source_id,
                document_hash=document_hash,
                title=envelope.payload.title,
                content=draft.content,
                content_type=envelope.payload.content_type,
                created_at=created_at,
                metadata=envelope.payload.metadata,
                dense_vector=dense_vector,
                sparse_vector=make_sparse_vector(draft.content, self.sparse_dimensions),
            )
            for draft, dense_vector in zip(drafts, embeddings, strict=True)
        ]
        duplicate_chunks = await self.vector_store.existing_chunk_count(
            [chunk.chunk_id for chunk in chunks]
        )
        await self.vector_store.upsert_chunks(chunks)
        object_key = (
            envelope.payload.storage.object_key
            or f"sources/{envelope.payload.source_id}/{document_hash}.txt"
        )
        await self.storage.put_text(
            object_key=object_key,
            content=envelope.payload.content,
            content_type=envelope.payload.content_type,
        )
        return IngestionResult(
            status="processed",
            source_id=envelope.payload.source_id,
            document_hash=document_hash,
            chunk_count=len(chunks),
            duplicate_chunks=duplicate_chunks,
            object_key=object_key,
            request_id=envelope.request_id,
            trace_id=envelope.trace_id,
        )


class QueryService:
    def __init__(
        self,
        vector_store: VectorStore,
        cache: SemanticCache,
        embeddings: EmbeddingAdapter,
        answer_generator: AnswerGenerator,
        sparse_dimensions: int,
        semantic_cache_threshold: float,
        semantic_cache_ttl_seconds: int,
    ) -> None:
        self.vector_store = vector_store
        self.cache = cache
        self.embeddings = embeddings
        self.answer_generator = answer_generator
        self.sparse_dimensions = sparse_dimensions
        self.semantic_cache_threshold = semantic_cache_threshold
        self.semantic_cache_ttl_seconds = semantic_cache_ttl_seconds

    async def query(self, envelope: QueryJobEnvelope) -> QueryResult:
        await self.vector_store.ensure_schema()
        started = perf_counter()
        query_embedding = await self.embeddings.embed_text(envelope.payload.prompt)
        cache_key = envelope.payload.cache_key
        if envelope.payload.use_cache:
            cached, similarity = await self.cache.lookup(
                cache_key=cache_key,
                prompt_embedding=query_embedding,
                collection_name=envelope.payload.collection_name,
                embedding_model=envelope.payload.embedding_model,
                prompt_template_version=envelope.payload.prompt_template_version,
                threshold=self.semantic_cache_threshold,
            )
            if cached is not None:
                return QueryResult(
                    answer=cached.answer,
                    cache={
                        "hit": True,
                        "key": cache_key,
                        "similarity": similarity,
                    },
                    sources=cached.sources,
                    retrieval=RetrievalMetadata(
                        topK=envelope.payload.top_k,
                        tookMs=int((perf_counter() - started) * 1000),
                    ),
                    requestId=envelope.request_id,
                    traceId=envelope.trace_id,
                )

        sources = await self.vector_store.hybrid_search(
            dense_vector=query_embedding,
            sparse_vector=make_sparse_vector(envelope.payload.prompt, self.sparse_dimensions),
            top_k=envelope.payload.top_k,
            min_score=envelope.payload.min_score,
        )
        answer = await self.answer_generator.generate_answer(envelope.payload.prompt, sources)
        result = QueryResult(
            answer=answer,
            cache={
                "hit": False,
                "key": cache_key,
                "similarity": None,
            },
            sources=sources,
            retrieval=RetrievalMetadata(
                topK=envelope.payload.top_k,
                tookMs=int((perf_counter() - started) * 1000),
            ),
            requestId=envelope.request_id,
            traceId=envelope.trace_id,
        )
        if envelope.payload.use_cache:
            await self.cache.store(
                SemanticCacheEntry(
                    cache_key=cache_key,
                    prompt=envelope.payload.prompt,
                    query_embedding=query_embedding,
                    top_k=envelope.payload.top_k,
                    min_score=envelope.payload.min_score,
                    collection_name=envelope.payload.collection_name,
                    embedding_model=envelope.payload.embedding_model,
                    prompt_template_version=envelope.payload.prompt_template_version,
                    response=result,
                    created_at=datetime.now(tz=UTC),
                ),
                ttl_seconds=self.semantic_cache_ttl_seconds,
            )
        return result
