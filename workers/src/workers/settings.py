from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .contracts import DEFAULT_EMBEDDING_MODEL, PROMPT_TEMPLATE_VERSION


class WorkerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    service_name: str = Field(default="cloudrag-workers", alias="OTEL_SERVICE_NAME")
    log_level: str = Field(default="info", alias="LOG_LEVEL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    queue_name: str = Field(default="cloudrag-jobs", alias="GATEWAY_QUEUE_NAME")
    runtime_backend: Literal["memory", "services"] = Field(
        default="services", alias="WORKER_RUNTIME_BACKEND"
    )
    chunk_size: int = Field(default=800, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(default=120, alias="CHUNK_OVERLAP")
    dense_dimensions: int = Field(default=64, alias="DENSE_VECTOR_DIMENSIONS")
    sparse_dimensions: int = Field(default=2048, alias="SPARSE_VECTOR_DIMENSIONS")
    semantic_cache_ttl_seconds: int = Field(default=3600, alias="SEMANTIC_CACHE_TTL_SECONDS")
    semantic_cache_threshold: float = Field(default=0.92, alias="SEMANTIC_CACHE_THRESHOLD")
    qdrant_url: str = Field(default="http://localhost:6333", alias="QDRANT_URL")
    qdrant_api_key: str | None = Field(default=None, alias="QDRANT_API_KEY")
    qdrant_collection: str = Field(default="cloudrag-documents", alias="QDRANT_COLLECTION")
    s3_endpoint: str = Field(default="http://localhost:9000", alias="S3_ENDPOINT")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")
    s3_access_key_id: str | None = Field(default=None, alias="S3_ACCESS_KEY_ID")
    s3_secret_access_key: str | None = Field(default=None, alias="S3_SECRET_ACCESS_KEY")
    s3_bucket_raw_documents: str = Field(
        default="cloudrag-raw-documents", alias="S3_BUCKET_RAW_DOCUMENTS"
    )
    s3_force_path_style: bool = Field(default=True, alias="S3_FORCE_PATH_STYLE")
    embedding_model: str = Field(default=DEFAULT_EMBEDDING_MODEL, alias="EMBEDDING_MODEL")
    llm_model: str | None = Field(default=None, alias="LLM_MODEL")
    prompt_template_version: str = Field(
        default=PROMPT_TEMPLATE_VERSION, alias="PROMPT_TEMPLATE_VERSION"
    )
    otel_sdk_disabled: bool = Field(default=False, alias="OTEL_SDK_DISABLED")


@lru_cache(maxsize=1)
def get_settings() -> WorkerSettings:
    return WorkerSettings()
