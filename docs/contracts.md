# CloudRAG Contracts

This document records the versioned API and queue contracts implemented for phases 3, 4, and 5.

## HTTP API

### `POST /api/v1/ingest`

Accepts:

```json
{
  "sourceId": "optional-stable-id",
  "title": "Optional title",
  "content": "Document text content",
  "contentType": "text/plain",
  "metadata": {
    "team": "search"
  }
}
```

Returns `202 Accepted`:

```json
{
  "status": "accepted",
  "taskId": "source-id:document-hash",
  "sourceId": "source-id",
  "documentHash": "sha256",
  "queue": "cloudrag-jobs",
  "requestId": "uuid",
  "traceId": "trace-id"
}
```

### `POST /api/v1/query`

Accepts:

```json
{
  "prompt": "How does CloudRAG ingest data?",
  "topK": 5,
  "minScore": 0.15,
  "useCache": true
}
```

Returns `200 OK`:

```json
{
  "answer": "Response text",
  "cache": {
    "hit": false,
    "key": "semantic-cache:v1:...",
    "similarity": null
  },
  "sources": [
    {
      "sourceId": "source-1",
      "chunkId": "chunk-1",
      "documentHash": "sha256",
      "score": 0.41,
      "content": "Retrieved text",
      "title": "Optional title",
      "metadata": {}
    }
  ],
  "retrieval": {
    "topK": 5,
    "tookMs": 42
  },
  "requestId": "uuid",
  "traceId": "trace-id"
}
```

## Queue Envelopes

Queue name: `cloudrag-jobs`

Contract version: `v1`

Job names:

- `ingest.v1`
- `query.v1`

### `ingest.v1`

```json
{
  "version": "v1",
  "jobName": "ingest.v1",
  "requestId": "uuid",
  "traceId": "trace-id",
  "payload": {
    "sourceId": "source-1",
    "title": "Optional title",
    "content": "Raw text",
    "contentType": "text/plain",
    "metadata": {},
    "storage": {
      "kind": "inline"
    },
    "submittedAt": "2026-05-12T12:00:00Z"
  }
}
```

### `query.v1`

```json
{
  "version": "v1",
  "jobName": "query.v1",
  "requestId": "uuid",
  "traceId": "trace-id",
  "payload": {
    "prompt": "How does CloudRAG ingest data?",
    "topK": 5,
    "minScore": 0.15,
    "useCache": true,
    "cacheKey": "semantic-cache:v1:...",
    "collectionName": "cloudrag-documents",
    "embeddingModel": "deterministic-hash-v1",
    "promptTemplateVersion": "2026-05-12",
    "submittedAt": "2026-05-12T12:00:00Z"
  }
}
```

## Notes

- The gateway and worker use one queue protocol: BullMQ on Node.js and the official BullMQ Python package.
- As of May 12, 2026, the BullMQ Python package is still marked experimental, so the queue boundary is isolated behind adapters for future replacement.
