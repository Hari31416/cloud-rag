# Phase 1: Repository Foundation

## Goal

Create the repository structure, toolchain boundaries, and developer workflow needed for a decoupled polyglot CloudRAG stack.

## Local-First Deliverables

- Create top-level service directories:
  - `frontend/` for Vite, React, TailwindCSS, and shadcn/ui.
  - `gateway/` for the TypeScript API gateway.
  - `workers/` for Python NLP and RAG workers.
  - `infra/` for Dockerfiles, compose support, and future IaC.
  - `docs/` for durable architecture and operational documentation.
  - `plans/` for this phased roadmap and future iteration plans.
- Add root orchestration files:
  - `.env.example`
  - `.gitignore`
  - `justfile`
  - `docker-compose.yml`
- Keep `.env` local-only and out of version control.
- Define baseline service ports and environment variable names in `.env.example`.
- Add root README updates that match the actual commands once they exist.

## Serverless-Ready Patterns

- Keep each service independently buildable as an OCI image.
- Avoid direct imports or shared runtime coupling between gateway and worker code.
- Use shared contracts through generated schemas or explicitly versioned payload definitions, not cross-language code sharing.
- Model local infrastructure as replaceable interfaces:
  - Redis-compatible queue and cache.
  - S3-compatible object storage.
  - Vector database accessed through a worker adapter.

## Implementation Notes

- Use `pnpm` in TypeScript projects and `uv` in Python projects.
- Enable strict TypeScript settings from the first scaffold.
- Configure Python formatting and tests before adding business logic.
- Prefer small service-level READMEs over undocumented scripts.

## Validation

- `just setup` installs service dependencies.
- `just ps` handles the empty or partially scaffolded stack gracefully.
- `frontend`, `gateway`, and `workers` each have an isolated test command.

## Exit Criteria

- A new developer can clone the repo, copy `.env.example` to `.env`, run setup, and understand the service boundaries.
- No implementation assumes a specific cloud provider.
