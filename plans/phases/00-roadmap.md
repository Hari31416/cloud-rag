# CloudRAG Phase Roadmap

This roadmap translates the project intent into a local-first implementation path that keeps the architecture easy to extend toward serverless cloud deployment later.

## Guiding Principles

- Start with local reproducibility before cloud deployment.
- Keep frontend, gateway, worker, storage, queue, and observability concerns decoupled.
- Use cloud-neutral interfaces: HTTP, Redis-compatible queues/cache, S3-compatible object storage, OCI containers, OpenTelemetry, and vector DB abstractions.
- Treat local Docker Compose services as replaceable adapters, not permanent architectural dependencies.
- Prefer explicit contracts, schemas, idempotency keys, and trace propagation across service boundaries.

## Phase Sequence

1. [Phase 1: Repository Foundation](./01-repository-foundation.md)
2. [Phase 2: Local Infrastructure Runtime](./02-local-infrastructure-runtime.md)
3. [Phase 3: Gateway API and Queue Contracts](./03-gateway-api-and-queue-contracts.md)
4. [Phase 4: Worker Ingestion Pipeline](./04-worker-ingestion-pipeline.md)
5. [Phase 5: Retrieval and Semantic Cache](./05-retrieval-and-semantic-cache.md)
6. [Phase 6: Frontend Product Experience](./06-frontend-product-experience.md)
7. [Phase 7: Observability, Reliability, and Testing](./07-observability-reliability-testing.md)
8. [Phase 8: Serverless-Ready Deployment Path](./08-serverless-ready-deployment-path.md)

## Near-Term Definition of Done

- The full local stack starts with one documented command.
- Documents can be ingested asynchronously and queried after worker processing.
- Every cross-service payload has a versioned schema.
- Local storage, queues, vector database, and cache can be replaced by cloud equivalents through configuration.
- Tests cover core gateway contracts, worker idempotency, retrieval behavior, and UI integration paths.
