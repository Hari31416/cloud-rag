# Phase 8: Serverless-Ready Deployment Path

## Goal

Prepare CloudRAG for cloud deployment without binding the implementation to one provider.

## Local-First Deliverables

- Add production-grade Dockerfiles for frontend, gateway, and workers.
- Add cloud-neutral deployment documentation.
- Add environment profiles for local, staging, and production.
- Defer provider-specific Terraform or OpenTofu modules to future cloud-provider branches.
- Document how each local dependency maps to cloud-managed or self-hosted alternatives.

## Serverless-Ready Patterns

- Package stateless gateway code so it can run as:
  - container service.
  - serverless container.
  - function-style HTTP handler if later adapted.
- Package workers so they can run as:
  - long-running queue consumers.
  - scheduled batch processors.
  - event-triggered serverless jobs.
- Keep queue contracts provider-neutral.
- Keep object storage interactions S3-compatible.
- Keep observability export configurable through OpenTelemetry endpoints.

## Implementation Notes

- Do not introduce provider-specific triggers in application code.
- Keep provider-specific infrastructure modules out of the initial branch.
- When cloud-provider branches are created later, separate infrastructure by concern: network, compute, queue/cache, object storage, vector database, and observability.
- Document provider mappings instead of hiding them in code:
  - Redis-compatible managed cache or self-hosted Redis.
  - S3-compatible object storage.
  - Qdrant Cloud or self-hosted Qdrant.
  - Container runtime or serverless container service.

## Validation

- Images build locally and run through Docker Compose.
- Configuration can be swapped without code changes.
- Deployment docs include a provider-neutral checklist.
- No application code imports cloud-provider SDKs unless isolated behind an adapter and justified.

## Exit Criteria

- CloudRAG can move from local Compose to cloud infrastructure through configuration and deployment manifests.
- Serverless adoption remains an infrastructure choice, not an application rewrite.
