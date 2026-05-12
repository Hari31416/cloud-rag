# Gateway Service

TypeScript gateway implementation using Hono, BullMQ, Redis exact-cache lookup, request correlation headers, and OpenTelemetry bootstrap hooks.

## Commands

- `pnpm install`
- `pnpm run dev`
- `pnpm run build`
- `pnpm run typecheck`
- `pnpm run test`

## Routes

- `GET /health`
- `GET /ready`
- `POST /api/v1/ingest`
- `POST /api/v1/query`

## Notes

- Queue envelopes are versioned as `v1`.
- The gateway returns `202 Accepted` for ingestion and keeps the route stateless.
- Query execution is dispatched through BullMQ and waits on worker completion for the synchronous response path.
