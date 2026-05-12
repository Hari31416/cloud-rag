# Deployment Path

CloudRAG now has a provider-neutral deployment path for phases 7 and 8.

## Container Targets

- `frontend/Dockerfile`
- `gateway/Dockerfile`
- `workers/Dockerfile`

## Environment Profiles

Profile templates live in `env/`:

- `env/local.env.example`
- `env/staging.env.example`
- `env/production.env.example`

## Cloud Mapping

| Local dependency | Cloud-neutral replacement options |
| :-- | :-- |
| Redis | Managed Redis, self-hosted Redis, or Redis-compatible cache/queue |
| MinIO | Amazon S3, Google Cloud Storage through an S3-compatible gateway, Cloudflare R2, self-hosted object storage |
| Qdrant | Qdrant Cloud or self-hosted Qdrant |
| Gateway container | Kubernetes deployment, ECS/Fargate, Cloud Run, Azure Container Apps, Nomad |
| Worker container | Long-running deployment, scheduled job, or event-driven queue consumer |
| OTel console exporter | OTLP collector, Jaeger, Tempo, Datadog, New Relic, Honeycomb |

## Deployment Checklist

1. Build all images locally.
2. Configure `REDIS_URL`, `QDRANT_URL`, `S3_ENDPOINT`, and credentials through environment variables only.
3. Set `WORKER_RUNTIME_BACKEND=services`.
4. Configure `OTEL_SERVICE_NAME` and an OTLP exporter if traces should leave the container.
5. Use persistent storage for Redis, object storage, and Qdrant in stateful environments.
6. Keep `EMBEDDING_MODEL` and `LLM_MODEL` in environment config, not in code.
7. Run `pnpm run build` in `gateway/` and `uv run --group dev pytest` in `workers/` before image publication.
