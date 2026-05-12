# Phase 3: Gateway API and Queue Contracts

## Goal

Implement the TypeScript gateway as the external API boundary and async orchestration layer.

## Local-First Deliverables

- Scaffold `gateway/` with Hono, strict TypeScript, package scripts, tests, and linting.
- Implement health and readiness endpoints.
- Implement ingestion endpoint:
  - `POST /api/v1/ingest`
  - Validate request payload.
  - Persist or reference raw upload payload through the configured storage path.
  - Enqueue an ingestion task.
  - Return `202 Accepted` with task metadata.
- Implement query endpoint:
  - `POST /api/v1/query`
  - Validate prompt and retrieval options.
  - Check semantic cache through a gateway-owned cache adapter when available.
  - Dispatch retrieval execution through the selected local path.
- Define versioned queue message contracts.
- Add request IDs and trace context propagation.

## Serverless-Ready Patterns

- Keep API handlers stateless.
- Return quickly from ingestion requests and move heavy work to queues.
- Make queue payloads self-contained enough for workers to process after gateway restarts.
- Avoid storing transient process-local state needed by workers.
- Keep adapters swappable for Redis queues, managed queues, or event buses later.

## Implementation Notes

- Use Hono for the frontend-facing HTTP API and `@hono/node-server` for local execution.
- Keep validation schemas close to route definitions.
- Use explicit error response shapes for validation, dependency failure, and queue failure.
- Define retry-safe job IDs from source IDs or content hashes where appropriate.

## Validation

- Unit tests cover route validation and response status codes.
- Integration tests verify Redis queue enqueue behavior.
- API returns `202 Accepted` for valid ingestion without waiting on worker processing.
- Invalid requests return typed `4xx` responses.

## Exit Criteria

- Gateway can accept ingestion and query requests locally.
- Queue messages are documented, versioned, and consumed only through stable contracts.
