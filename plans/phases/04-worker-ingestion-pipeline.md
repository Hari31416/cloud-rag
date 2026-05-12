# Phase 4: Worker Ingestion Pipeline

## Goal

Implement the Python worker pipeline for durable, idempotent document ingestion.

## Local-First Deliverables

- Scaffold `workers/` with `uv`, `pytest`, type hints, formatting, and configuration loading.
- Add Celery worker process startup and graceful shutdown.
- Consume ingestion jobs from Redis-backed Celery queues.
- Persist raw documents to S3-compatible object storage when the gateway has not already done so.
- Parse document content into normalized text.
- Chunk text with deterministic chunk IDs.
- Compute SHA-256 hashes for source documents and chunks.
- Generate hosted embeddings through a LiteLLM-backed embedding adapter.
- Upsert chunks and metadata into Qdrant.
- Record ingestion status and failures in a local store or queue-visible job metadata.

## Serverless-Ready Patterns

- Keep worker execution idempotent; retrying a job must not duplicate chunks.
- Treat object storage as the durable source of truth for raw artifacts.
- Isolate hosted embedding generation behind an interface so providers can change without rewriting ingestion.
- Keep vector database writes behind a repository or adapter abstraction.
- No filesystem dependency except for temporary processing.

## Implementation Notes

- Start with plain text and small file payloads before adding PDF, DOCX, HTML, or OCR support.
- Use deterministic metadata fields:
  - `source_id`
  - `document_hash`
  - `chunk_id`
  - `chunk_hash`
  - `content_type`
  - `created_at`
- Make chunking settings explicit and configurable.
- Log skipped duplicate chunks as normal idempotency events, not errors.

## Validation

- Unit tests cover hashing, chunking, and duplicate detection.
- Integration tests cover queue consumption and vector upsert against local infrastructure.
- Re-ingesting the same document does not create duplicate vector records.
- Failed jobs expose useful error metadata.

## Exit Criteria

- A document submitted through the gateway can be processed by a worker into raw storage and vector storage.
- The ingestion pipeline is safe to retry.
