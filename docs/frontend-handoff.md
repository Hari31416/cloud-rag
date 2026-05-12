# Frontend Handoff

This document is the implementation handoff for phase 6. It translates the roadmap into a concrete frontend build plan based on the backend that now exists.

## Goal

Build the first usable CloudRAG frontend against the implemented gateway API. The UI should feel like an operational tool, not a landing page.

The first screen should let a user:

1. ingest text content
2. submit a query
3. inspect answer citations
4. see gateway and system health
5. see recent ingestion attempts inside the current browser session

## Current Backend Contract

Base URL comes from `VITE_API_BASE_URL`.

Implemented endpoints:

- `GET /health`
- `GET /ready`
- `POST /api/v1/ingest`
- `POST /api/v1/query`

Reference contract: [docs/contracts.md](/Users/hari/Desktop/sandbox/cloud-rag/docs/contracts.md)

### Ingest request

```json
{
  "sourceId": "optional",
  "title": "optional",
  "content": "required plain text content",
  "contentType": "text/plain",
  "metadata": {
    "team": "search"
  }
}
```

### Ingest response

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

### Query request

```json
{
  "prompt": "How does CloudRAG ingest data?",
  "topK": 5,
  "minScore": 0.15,
  "useCache": true
}
```

### Query response

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

## Constraints

- Use React with strict TypeScript.
- Use `pnpm`.
- Use `shadcn/ui` primitives and Tailwind.
- Use TanStack Query for server state.
- Use functional components and custom hooks only.
- Do not assume hidden backend endpoints beyond the four listed above.
- Do not build file upload yet. The current backend only supports text ingestion.

## UX Direction

- Dense, work-focused layout.
- No hero page.
- No marketing copy.
- Desktop-first operational layout that still collapses cleanly on mobile.
- Keep the main app in a two-column layout on desktop:
  - left: ingestion and health/status
  - right: query workspace and citations

## Primary Screens and Regions

The first version can live on one route, `/`.

### 1. Top bar

Purpose:

- app identity
- API base visibility
- live readiness status

Contents:

- `CloudRAG`
- small environment badge derived from `VITE_API_BASE_URL`
- readiness indicator from `GET /ready`

### 2. Ingestion panel

Purpose:

- submit text content into the pipeline

Fields:

- `sourceId` optional text input
- `title` optional text input
- `content` required textarea
- metadata editor:
  - simple key/value repeater
  - start with one empty row only when user clicks add
- `contentType` hidden or read-only as `text/plain`

Actions:

- primary submit button
- clear form button

Behavior:

- validate required content before submit
- on success, prepend an entry to local recent-ingestion history
- show returned `taskId`, `sourceId`, `documentHash`
- show request/trace ids in a collapsible detail row

### 3. Recent ingestion activity panel

Purpose:

- give the user confidence that ingestion requests were accepted

Important limitation:

- there is no backend ingestion-status endpoint yet
- this panel should explicitly reflect browser-session submissions, not true worker completion state

Display per entry:

- title or source id
- submitted time
- accepted status
- task id
- document hash

Persist:

- session storage is enough for v1

### 4. Query workspace

Purpose:

- ask questions against ingested content

Fields:

- prompt textarea
- top-k numeric control, default `5`
- minimum score numeric control or slider, default `0.15`
- cache toggle, default on

Actions:

- submit query
- clear result

Behavior:

- disable submit during in-flight request
- preserve last successful result until next success or explicit clear

### 5. Query result panel

Purpose:

- display answer and retrieval metadata

Display:

- answer body
- cache badge:
  - hit/miss
  - similarity when present
- retrieval timing
- request id
- trace id

### 6. Citations panel

Purpose:

- make source inspection easy

Display each citation as an expandable item with:

- title if present, otherwise source id
- score
- chunk id
- document hash
- metadata key/value list
- chunk content preview

Expected interaction:

- clicking a citation expands raw chunk text

### 7. Health panel

Purpose:

- basic operational confidence

Calls:

- `GET /health`
- `GET /ready`

Display:

- gateway health status
- readiness status
- dependency readiness breakdown from `/ready`

Polling:

- every 15 seconds
- refetch on window focus

## Recommended Frontend Structure

Suggested file layout:

```text
frontend/src/
  app/
    providers.tsx
  components/
    app-shell.tsx
    top-bar.tsx
    ingest-form.tsx
    ingest-history.tsx
    query-form.tsx
    query-result.tsx
    citations-list.tsx
    health-panel.tsx
    empty-state.tsx
  hooks/
    use-health.ts
    use-ready.ts
    use-ingest-document.ts
    use-query-rag.ts
    use-ingest-history.ts
  lib/
    api.ts
    env.ts
    types.ts
    metadata.ts
  pages/
    dashboard.tsx
```

This does not need routing beyond a single page unless implementation naturally benefits from it.

## Data and State Model

### Server state

Use TanStack Query for:

- health
- readiness
- query mutation
- ingest mutation

### Local UI state

Use local component state or small custom hooks for:

- metadata rows in ingest form
- expanded citation row
- recent ingestion history
- last selected citation

### Session persistence

Store recent ingestion history in `sessionStorage`.

Suggested shape:

```ts
type LocalIngestEntry = {
  submittedAt: string;
  title?: string;
  sourceId: string;
  taskId: string;
  documentHash: string;
  requestId: string;
  traceId: string;
};
```

## Type Definitions to Mirror

Frontend should define exact API types that mirror the gateway response shape.

Minimum types:

- `IngestRequest`
- `IngestAcceptedResponse`
- `QueryRequest`
- `QueryResponse`
- `SourceReference`
- `ReadyResponse`
- `HealthResponse`
- `ApiErrorResponse`

## API Client Guidance

Build a small typed client in `frontend/src/lib/api.ts`.

Requirements:

- inject `VITE_API_BASE_URL`
- set `content-type: application/json`
- parse non-2xx responses into a typed app error
- preserve `x-request-id` response header if you want to expose it in the UI later

Suggested functions:

- `getHealth()`
- `getReady()`
- `postIngest(payload)`
- `postQuery(payload)`

## Form Validation

Use `react-hook-form` with `zod`.

### Ingest form rules

- `content` required
- `sourceId` optional
- `title` optional
- metadata keys must be unique when non-empty

### Query form rules

- `prompt` required
- `topK` integer between `1` and `20`
- `minScore` number between `0` and `1`

## Error and Empty States

Must be explicit.

### Ingest

- inline field validation
- submission error alert
- success confirmation with task id

### Query

- empty state before first query
- loading state while fetching
- error state for backend failure
- no-sources state when answer returns with empty citations

### Health

- degraded state when `/ready` returns `503`

## Testing Expectations

Minimum:

- typecheck passes
- build passes
- component tests for:
  - ingest form validation
  - successful ingest mutation
  - query loading and result rendering
  - query error state
  - citation expansion
- one browser-level smoke check for desktop layout

Recommended tools:

- Vitest
- Testing Library
- Playwright only if added as part of this phase

## Implementation Order

1. add shared providers and query client
2. add typed API client and environment loader
3. implement health/readiness hooks and top bar
4. implement ingestion form and local accepted-history panel
5. implement query form and result/citation panels
6. polish loading, empty, error, and responsive states
7. add tests

## Known Backend Gaps the Frontend Must Respect

- there is no ingestion completion/status endpoint yet
- ingestion is text-only today
- there is no document library/list endpoint yet
- there is no streamed query response yet

Do not invent UI claims that imply those features exist.

## Phase 6 Definition of Done

Frontend handoff is considered implemented when:

- a user can submit text ingestion from the UI
- a user can submit a query from the UI
- query results display citations and cache state
- health and readiness are visible
- recent accepted ingestions are visible in-session
- the app builds and tests successfully against the existing backend contract
