# CloudRAG Library Decisions

This document finalizes the initial library and framework choices for CloudRAG. The goal is to keep the local-first implementation productive while preserving clean upgrade paths for serverless cloud architecture.

## Decision Principles

- Prefer libraries with strong TypeScript or Python typing support.
- Prefer small, composable libraries over heavyweight frameworks.
- Keep application code cloud-agnostic and runtime-portable.
- Use interfaces and adapters around infrastructure clients.
- Avoid vendor SDKs in core business logic unless isolated behind provider adapters.

## Finalized Stack

| Area                       | Decision                                                     | Purpose                                                                       |
| :------------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Frontend app               | React + Vite                                                 | Browser UI for ingestion, query, and status workflows                         |
| Frontend styling           | TailwindCSS + shadcn/ui                                      | Accessible component system with project-owned styling                        |
| Frontend API client        | TanStack Query                                               | Request state, retries, cache invalidation, and async UI state                |
| Frontend forms             | React Hook Form + Zod                                        | Typed form state and validation                                               |
| Frontend-facing API        | Hono                                                         | Lightweight TypeScript HTTP API for gateway routes and serverless portability |
| Gateway runtime            | Node.js initially, Hono-compatible serverless runtimes later | Local-first development with future deployment flexibility                    |
| Gateway validation         | Zod                                                          | Shared request/response validation patterns                                   |
| Gateway queue client       | BullMQ                                                       | Redis-backed async job orchestration                                          |
| Gateway Redis client       | ioredis                                                      | Redis connectivity for BullMQ and cache adapters                              |
| Worker runtime             | Python + uv                                                  | NLP and retrieval processing environment                                      |
| Worker queue client        | Celery                                                       | Familiar Redis-backed Python worker execution with mature retry controls      |
| Worker validation/settings | Pydantic + pydantic-settings                                 | Typed configuration and payload validation                                    |
| Worker tests               | pytest                                                       | Unit and integration testing                                                  |
| Worker HTTP client         | httpx                                                        | Async HTTP calls for provider adapters                                        |
| Object storage             | MinIO locally through S3-compatible APIs                     | Raw document persistence without cloud lock-in                                |
| Object storage client      | boto3                                                        | Mature S3-compatible Python client                                            |
| Vector database            | Qdrant locally                                               | Dense and sparse retrieval with metadata filtering                            |
| Vector DB client           | qdrant-client                                                | Python vector upsert and retrieval operations                                 |
| Embeddings client          | LiteLLM embeddings behind an adapter                         | Hosted embeddings with provider flexibility and minimal integration code      |
| Retrieval utilities        | Light LangChain usage when useful                            | Use targeted utilities without adopting full orchestration                    |
| Sparse retrieval           | Qdrant sparse vectors initially                              | Hybrid search inside the selected vector database                             |
| Semantic cache             | Redis                                                        | Low-latency cache for query reuse                                             |
| Observability              | OpenTelemetry                                                | Runtime-neutral tracing and metrics                                           |
| Logging                    | pino for TypeScript, structlog for Python                    | Structured logs across services                                               |
| Infrastructure             | Docker Compose locally                                       | Reproducible local infrastructure                                             |
| IaC path                   | Deferred                                                     | Provider-specific deployment modules will be handled in future branches       |

## Hono API Decision

Hono is the finalized framework for the frontend-facing TypeScript API layer. In CloudRAG this means the `gateway/` service exposes the HTTP API consumed by the React frontend using Hono route handlers.

Hono is preferred because it:

- Keeps the API layer lightweight and explicit.
- Works well with strict TypeScript.
- Can run locally on Node.js while preserving a path to serverless runtimes.
- Encourages handler portability without tying the project to Express-specific middleware behavior.

The frontend React app should not contain backend business logic. It should call the Hono-powered gateway through typed API client hooks.

## TypeScript Library Details

### Frontend

- `react`
- `vite`
- `typescript`
- `tailwindcss`
- `shadcn/ui`
- `lucide-react`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `sonner` for toast notifications
- `vitest`
- `@testing-library/react`
- `playwright` for browser-level verification when UI behavior is implemented

### Gateway

- `hono`
- `@hono/node-server` for local Node.js execution
- `zod`
- `bullmq`
- `ioredis`
- `pino`
- `pino-pretty` for local development only
- `@opentelemetry/api`
- `@opentelemetry/sdk-node`
- `@opentelemetry/auto-instrumentations-node`
- `vitest`
- `tsx` for local TypeScript execution

## Python Library Details

### Worker Core

- `pydantic`
- `pydantic-settings`
- `redis`
- `celery`
- `boto3`
- `qdrant-client`
- `litellm`
- `httpx`
- `tenacity`
- `structlog`
- `opentelemetry-api`
- `opentelemetry-sdk`
- `opentelemetry-instrumentation-redis`
- `opentelemetry-instrumentation-requests`

### RAG Processing

- `langchain-text-splitters`
- `numpy`

### Testing and Quality

- `pytest`
- `pytest-asyncio`
- `pytest-cov`
- `ruff`
- `black`
- `isort`
- `mypy`

## Finalized Non-Goals and Constraints

These decisions are intentionally closed for the initial implementation:

- Do not adopt full LangChain or LlamaIndex orchestration. Use LangChain lightly only for focused utilities such as text splitting when it saves effort.
- Use Celery for Python workers.
- Use Qdrant as the vector database. Use Qdrant sparse vector support for hybrid retrieval rather than switching to pgvector for the initial build.
- Use TanStack Query and local React state only. Do not add a separate frontend global state library unless a later implementation issue clearly requires it.
- Use hosted embeddings through LiteLLM embeddings behind an adapter. Keep the rest of the RAG pipeline provider-neutral.
- Skip cloud-provider deployment modules for now. Future provider-specific deployment work should happen on separate provider branches.

## Constraints for Future Changes

- Adding a heavyweight framework or orchestration library requires an explicit plan update.
- Provider-specific SDKs must stay behind adapters.
- API schemas must remain versioned.
- Queue payload changes must be backward-compatible or include migration handling.
- Local development must continue to work without managed cloud services.
