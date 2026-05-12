# Infrastructure

This directory contains local runtime assets that are cloud-neutral and replaceable.

## Services

- Redis (`redis`) for queueing and semantic cache.
- PostgreSQL (`postgres`) for local metadata/state.
- MinIO (`minio`) for S3-compatible object storage.
- Qdrant (`qdrant`) for vector storage.

## Commands

- `just up` to start infrastructure.
- `just down` to stop infrastructure.
- `just nuke` to stop and remove infrastructure volumes.
- `just ps` to inspect status.
- `just health` to validate service availability and key credential checks.
