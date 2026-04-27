# Segment Brief 034: Web Runtime SDK Query Extraction

## Segment ID

`web-runtime-sdk-query-extraction`

## Branch

`wave/stage5a-web-runtime-sdk-query-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving more shared client data access away from implicit same-origin `Next` proxy assumptions and toward the shared backend-aware SDK layer.

## Scope

### In Scope

- `packages/sdk` query/mutation paths that still use raw same-origin `axios`/`fetch`
- shared client-side data access primitives
- direct backend-aware request usage through shared API client instances

### Out of Scope

- broad feature-by-feature UI rewrites
- removing all `src/app/api/*` or `src/pages/api/*` in one step
- auth redesign
- storage/media/postgres work

## Expected Work

### 1. Continue shared data-layer extraction

Move the next narrow set of shared queries/mutations onto the backend-aware SDK client path.

### 2. Prefer centralization over scattered feature edits

Touch shared query/mutation files first so multiple runtime callers benefit at once.

### 3. Keep current runtime stable

Do not widen the step into a full client rewrite. Keep it reviewable.

## Acceptance Criteria

- another narrow slice of shared runtime data access no longer depends on implicit same-origin proxy assumptions
- active runtime behavior remains stable
- the extraction meaningfully reduces future dependence on `Next` API ownership

## Verification

- typecheck
- lint
- targeted runtime sanity for the migrated query/mutation paths

## Handoff Format

- what shared query/mutation paths were moved
- what still remains on the old proxy path
- what the next narrow extraction slice should be
