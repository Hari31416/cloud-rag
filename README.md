# CloudRAG

CloudRAG is a modular, cloud-agnostic Retrieval-Augmented Generation stack with a decoupled frontend, gateway, and worker architecture.

## Status

Phases 1 through 8 are fully implemented, including the operational desktop-first Phase 6 frontend interface.

## Repository Structure

```text
.
├── docs/                # durable architecture and operational docs
├── frontend/            # React + Vite frontend scaffold (TypeScript strict)
├── gateway/             # Hono gateway scaffold (TypeScript strict)
├── infra/               # local runtime scripts and infra docs
├── plans/               # roadmap and phase plans
├── workers/             # Python worker scaffold (uv + pytest)
├── .env.example
├── docker-compose.yml
└── justfile
```

## Prerequisites

- Docker + Docker Compose
- just
- pnpm
- uv

## Quickstart

1. Copy env file:

   ```bash
   cp .env.example .env
   ```

2. Install service dependencies:

   ```bash
   just setup
   ```

3. Start infrastructure only (Redis, PostgreSQL, MinIO, Qdrant):

   ```bash
   just up
   ```

4. Check runtime status and health:

   ```bash
   just ps
   just health
   ```

5. Start the backend services:

   ```bash
   just gateway-start
   just worker-start
   ```

6. Run service tests:

   ```bash
   just frontend-test
   just gateway-test
   just worker-test
   ```

7. Stop services and infrastructure:

   ```bash
   just stop
   ```

## Commands

| Command              | Purpose                                          |
| :------------------- | :----------------------------------------------- |
| `just up`            | Start Redis, PostgreSQL, MinIO, and Qdrant       |
| `just down`          | Stop infrastructure                              |
| `just nuke`          | Stop infrastructure and delete volumes           |
| `just ps`            | Show infra state and scaffold state              |
| `just health`        | Validate service health + credential checks      |
| `just setup`         | Install worker/gateway/frontend dependencies     |
| `just test`          | Run isolated frontend, gateway, and worker tests |
| `just gateway-start` | Start the gateway in the background              |
| `just worker-start`  | Start the worker in the background               |
| `just start`         | Start infra, worker, gateway, and frontend       |
| `just stop`          | Stop frontend, worker, gateway, and infra        |

## Baseline Service Ports

- Frontend: `5173`
- Gateway: `3000`
- Redis: `6379`
- PostgreSQL: `5432`
- MinIO API: `9000`
- MinIO Console: `9001`
- Qdrant HTTP: `6333`

All ports, credentials, and connection values are configurable in `.env` and documented in `.env.example`.

## Implemented Service Notes

- The gateway exposes `POST /api/v1/ingest` and `POST /api/v1/query`.
- Queue contracts are versioned and documented in [docs/contracts.md](/Users/hari/Desktop/sandbox/cloud-rag/docs/contracts.md).
- The worker handles idempotent chunking, deterministic local embeddings by default, Qdrant hybrid retrieval, Redis semantic cache evaluation, and optional LiteLLM-backed embeddings and generation.
- Deployment guidance and environment profiles are documented in [docs/deployment-path.md](/Users/hari/Desktop/sandbox/cloud-rag/docs/deployment-path.md).
