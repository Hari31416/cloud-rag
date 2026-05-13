from __future__ import annotations

from dataclasses import dataclass

from .answering import ExtractiveAnswerGenerator, LiteLLMAnswerGenerator
from .cache import MemorySemanticCache, RedisSemanticCache, SemanticCache
from .embeddings import DeterministicEmbeddingAdapter, EmbeddingAdapter, LiteLLMEmbeddingAdapter
from .logging import get_logger
from .services import IngestionService, QueryService
from .settings import WorkerSettings
from .storage import MemoryObjectStorage, ObjectStorage, S3ObjectStorage
from .vector_store import MemoryVectorStore, QdrantVectorStore, VectorStore


@dataclass
class ServiceContainer:
    ingestion_service: IngestionService
    query_service: QueryService
    vector_store: VectorStore


def build_container(settings: WorkerSettings) -> ServiceContainer:
    logger = get_logger()
    if settings.runtime_backend == "memory":
        embeddings: EmbeddingAdapter = DeterministicEmbeddingAdapter(settings.dense_dimensions)
        object_storage: ObjectStorage = MemoryObjectStorage()
        vector_store: VectorStore = MemoryVectorStore()
        cache: SemanticCache = MemorySemanticCache()
        logger.info("worker runtime configured", backend="memory")
        answer_generator = ExtractiveAnswerGenerator()
    else:
        embeddings = LiteLLMEmbeddingAdapter(
            model=settings.embedding_model,
            dimensions=settings.dense_dimensions,
            batch_size=settings.embedding_batch_size,
            api_key=settings.embedding_api_key,
            api_base=settings.embedding_api_base_url,
        )
        object_storage = S3ObjectStorage(
            endpoint_url=settings.s3_endpoint,
            region_name=settings.s3_region,
            access_key_id=settings.s3_access_key_id or "",
            secret_access_key=settings.s3_secret_access_key or "",
            bucket_name=settings.s3_bucket_raw_documents,
            force_path_style=settings.s3_force_path_style,
        )
        vector_store = QdrantVectorStore(
            base_url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
            dense_dimensions=settings.dense_dimensions,
        )
        cache = RedisSemanticCache(settings.redis_url)
        logger.info("worker runtime configured", backend="services")
        answer_generator = (
            LiteLLMAnswerGenerator(
                model=settings.llm_model,
                prompt_template_version=settings.prompt_template_version,
                api_key=settings.llm_api_key,
                api_base=settings.llm_api_base_url,
            )
            if settings.llm_model
            else ExtractiveAnswerGenerator()
        )
    return ServiceContainer(
        ingestion_service=IngestionService(
            storage=object_storage,
            vector_store=vector_store,
            embeddings=embeddings,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            sparse_dimensions=settings.sparse_dimensions,
        ),
        query_service=QueryService(
            vector_store=vector_store,
            cache=cache,
            embeddings=embeddings,
            answer_generator=answer_generator,
            sparse_dimensions=settings.sparse_dimensions,
            semantic_cache_threshold=settings.semantic_cache_threshold,
            semantic_cache_ttl_seconds=settings.semantic_cache_ttl_seconds,
        ),
        vector_store=vector_store,
    )
