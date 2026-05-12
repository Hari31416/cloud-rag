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

- Deterministic hash embeddings are the default local embedding path.
- Setting `EMBEDDING_MODEL` switches the embedding adapter to LiteLLM.
- Setting `LLM_MODEL` switches answer generation from extractive fallback to LiteLLM completion.
