# Phase 2: Local Infrastructure Runtime

## Goal

Bring up local infrastructure dependencies with Docker Compose so development can proceed without managed cloud services.

## Local-First Deliverables

- Add Docker Compose services for:
  - Redis for queues and semantic cache.
  - MinIO for S3-compatible object storage.
  - Qdrant as the initial vector database.
  - Optional local observability stack once tracing begins.
- Enforce authentication and non-default credentials through `.env`.
- Add persistent named volumes for local state.
- Implement `just` commands:
  - `just up`
  - `just down`
  - `just nuke`
  - `just ps`
  - `just health`
- Add health checks for Redis, MinIO, and Qdrant.

## Serverless-Ready Patterns

- Use environment variables that map cleanly to cloud equivalents.
- Use S3-compatible APIs only; avoid MinIO-specific behavior in application code.
- Keep Redis usage behind queue/cache adapters where practical.
- Keep vector DB configuration in worker-owned settings.

## Implementation Notes

- Store bootstrap bucket and collection names in environment variables.
- Add initialization scripts only when they are idempotent.
- Prefer Docker Compose profiles if optional services become expensive or noisy.
- Avoid binding application code to local container hostnames beyond environment defaults.

## Validation

- `just up` starts all infrastructure services.
- `just health` reports service availability and key configuration checks.
- Restarting infrastructure preserves expected state unless `just nuke` is used.

## Exit Criteria

- The local infrastructure layer can be started independently from application services.
- All connection strings and credentials are configurable and documented in `.env.example`.
