from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

CONTRACT_VERSION = "v1"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
PROMPT_TEMPLATE_VERSION = "2026-05-12"


class IngestRequest(BaseModel):
    source_id: str = Field(alias="sourceId")
    title: str | None = None
    content: str
    content_type: str = Field(alias="contentType", default="text/plain")
    metadata: dict[str, str] = Field(default_factory=dict)


class StorageReference(BaseModel):
    kind: Literal["inline", "s3"] = "inline"
    object_key: str | None = Field(alias="objectKey", default=None)
    bucket: str | None = None


class IngestJobPayload(IngestRequest):
    storage: StorageReference = Field(default_factory=StorageReference)
    submitted_at: datetime = Field(alias="submittedAt")


class QueryRequest(BaseModel):
    prompt: str
    top_k: int = Field(alias="topK", default=5)
    min_score: float = Field(alias="minScore", default=0.15)
    use_cache: bool = Field(alias="useCache", default=True)


class QueryJobPayload(QueryRequest):
    cache_key: str = Field(alias="cacheKey")
    collection_name: str = Field(alias="collectionName")
    embedding_model: str = Field(alias="embeddingModel")
    prompt_template_version: str = Field(alias="promptTemplateVersion")
    submitted_at: datetime = Field(alias="submittedAt")


class IngestJobEnvelope(BaseModel):
    version: Literal["v1"]
    job_name: Literal["ingest.v1"] = Field(alias="jobName")
    request_id: str = Field(alias="requestId")
    trace_id: str = Field(alias="traceId")
    payload: IngestJobPayload


class QueryJobEnvelope(BaseModel):
    version: Literal["v1"]
    job_name: Literal["query.v1"] = Field(alias="jobName")
    request_id: str = Field(alias="requestId")
    trace_id: str = Field(alias="traceId")
    payload: QueryJobPayload


class ChunkRecord(BaseModel):
    chunk_id: str
    chunk_hash: str
    source_id: str
    document_hash: str
    title: str | None = None
    content: str
    content_type: str
    created_at: datetime
    metadata: dict[str, str] = Field(default_factory=dict)
    dense_vector: list[float]
    sparse_vector: dict[int, float]


class IngestionResult(BaseModel):
    status: Literal["processed"]
    source_id: str
    document_hash: str
    chunk_count: int
    duplicate_chunks: int
    object_key: str
    request_id: str
    trace_id: str


class SourceReference(BaseModel):
    source_id: str = Field(alias="sourceId")
    chunk_id: str = Field(alias="chunkId")
    document_hash: str = Field(alias="documentHash")
    score: float
    content: str
    title: str | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class CacheMetadata(BaseModel):
    hit: bool
    key: str
    similarity: float | None = None


class RetrievalMetadata(BaseModel):
    top_k: int = Field(alias="topK")
    took_ms: int = Field(alias="tookMs")


class QueryResult(BaseModel):
    answer: str
    cache: CacheMetadata
    sources: list[SourceReference]
    retrieval: RetrievalMetadata
    request_id: str = Field(alias="requestId")
    trace_id: str = Field(alias="traceId")


class SemanticCacheEntry(BaseModel):
    cache_key: str
    prompt: str
    query_embedding: list[float]
    top_k: int
    min_score: float
    collection_name: str
    embedding_model: str
    prompt_template_version: str
    response: QueryResult
    created_at: datetime
