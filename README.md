# CloudRAG

CloudRAG is a modular, cloud-agnostic Retrieval-Augmented Generation stack with a decoupled frontend, gateway, and worker architecture.

## Status

Phase 1 (repository foundation) and Phase 2 (local infrastructure runtime) are implemented.

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

5. Stop infrastructure:

   ```bash
   just down
   ```

## Commands

| Command | Purpose |
| :-- | :-- |
| `just up` | Start Redis, PostgreSQL, MinIO, and Qdrant |
| `just down` | Stop infrastructure |
| `just nuke` | Stop infrastructure and delete volumes |
| `just ps` | Show infra state and scaffold state |
| `just health` | Validate service health + credential checks |
| `just setup` | Install worker/gateway/frontend dependencies |
| `just test` | Run isolated frontend, gateway, and worker tests |

## Baseline Service Ports

- Frontend: `5173`
- Gateway: `3000`
- Redis: `6379`
- PostgreSQL: `5432`
- MinIO API: `9000`
- MinIO Console: `9001`
- Qdrant HTTP: `6333`

All ports, credentials, and connection values are configurable in `.env` and documented in `.env.example`.
