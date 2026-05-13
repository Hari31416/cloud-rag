# Worker Service

Python worker implementation managed by `uv`, with BullMQ queue consumption, idempotent ingestion, hybrid retrieval, semantic cache reuse, and JSON structured logging.

## Commands

- `uv sync --all-groups`
- `uv run --group dev pytest`
- `uv run python -m workers`

## Runtime Modes

- `WORKER_RUNTIME_BACKEND=services` uses Redis, S3-compatible object storage, and Qdrant.
- `WORKER_RUNTIME_BACKEND=memory` uses in-process adapters for tests and isolated development.

## Notes

- `WORKER_RUNTIME_BACKEND=services` uses provider-backed embeddings, S3-compatible object storage, Redis semantic cache, and Qdrant.
- `EMBEDDING_MODEL`, `EMBEDDING_API_KEY`, and `EMBEDDING_API_BASE_URL` control cloud embedding generation.
- `LLM_MODEL`, `LLM_API_KEY`, and `LLM_API_BASE_URL` control answer generation.
- `WORKER_RUNTIME_BACKEND=memory` keeps deterministic embeddings and extractive answers for tests only.
- Redis connections are automatically verified on startup, supporting graceful fallback if the target server runs unauthenticated.
