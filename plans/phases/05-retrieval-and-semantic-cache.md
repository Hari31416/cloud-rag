# Phase 5: Retrieval and Semantic Cache

## Goal

Build the query path for hybrid retrieval, answer generation, source attribution, and semantic cache reuse.

## Local-First Deliverables

- Implement a retrieval service in the Python worker layer.
- Add dense vector search against Qdrant.
- Add sparse retrieval using Qdrant sparse vector support for hybrid ranking.
- Combine retrieval results with a deterministic ranking strategy.
- Add prompt assembly with source references.
- Add LLM provider abstraction. (Use `LiteLLM` for calling different providers through a common interface.)
- Store query-answer pairs in Redis semantic cache with metadata.
- Return generated answers with source IDs, chunk references, and cache status.

## Serverless-Ready Patterns

- Keep retrieval execution behind a worker API or queue contract that can later move to serverless functions.
- Use LiteLLM-backed hosted embeddings behind an adapter and provider-neutral interfaces for LLM completion.
- Store cache entries with explicit TTLs and model/version metadata.
- Do not rely on Redis as permanent source-of-truth storage.
- Keep prompt templates versioned.

## Implementation Notes

- Start with Qdrant hybrid retrieval and a simple ranking strategy before adding learning-to-rank or rerankers.
- Include retrieval parameters in cache keys or metadata:
  - embedding model
  - prompt template version
  - top-k
  - collection name
  - similarity threshold
- Return cache hits only when similarity and version constraints pass.
- Keep source attribution mandatory for generated responses.

## Validation

- Unit tests cover cache key construction, threshold logic, and ranking.
- Integration tests verify cache miss then cache hit behavior.
- Query results include cited source metadata.
- Retrieval works after service restarts using persisted vector data.

## Exit Criteria

- Users can ask questions against ingested content and receive sourced answers.
- Equivalent repeated queries can be served from semantic cache when configured thresholds match.
