# Phase 6: Frontend Product Experience

## Goal

Build a polished React interface for ingestion, querying, task visibility, and operational confidence.

## Local-First Deliverables

- Scaffold `frontend/` with Vite, React, strict TypeScript, TailwindCSS, and shadcn/ui.
- Configure `VITE_API_BASE_URL` through environment variables.
- Implement core screens:
  - Document ingestion workspace.
  - Query/chat workspace.
  - Ingestion job status view.
  - Basic system health view.
- Add custom hooks for gateway API calls using TanStack Query.
- Add accessible loading, error, empty, and retry states.
- Add source citation display for query responses.

## Serverless-Ready Patterns

- Treat the frontend as a static deployable artifact.
- Keep all backend URLs externalized through configuration.
- Avoid frontend assumptions about gateway deployment topology.
- Use API response contracts rather than service-specific internals.

## Implementation Notes

- Prefer dense, operational UI over a marketing-style landing page.
- Use shadcn/ui primitives for forms, buttons, dialogs, tables, and tabs.
- Keep upload progress and ingestion status visible.
- Design source citations so users can inspect where answers came from.
- Keep UI state in TanStack Query and local React state.

## Validation

- Type check and production build pass.
- Component tests cover key states for upload, query, and errors.
- Browser verification confirms layout works on desktop and mobile widths.
- Frontend can run against the local gateway using `.env` configuration.

## Exit Criteria

- A user can ingest content, track processing, ask questions, and inspect cited sources from the UI.
- The frontend can be deployed independently as static assets.
