# Segment Brief 032: Web Runtime API Extraction

## Segment

`web-runtime-api-extraction`

## Recommended Branch Name

`wave/stage5a-web-runtime-api-extraction`

## Goal

Start `Stage 5A` by reducing remaining `Next` proxy/API ownership and moving the web runtime closer to direct backend access.

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [WEB_RUNTIME_API_EXTRACTION.md](../../waves/WEB_RUNTIME_API_EXTRACTION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Web runtime extraction

Reduce remaining `Next` runtime API/proxy ownership in a narrow, reviewable slice.

### 2. Shared SDK direction

Move runtime access toward direct backend usage through shared SDK/client access contracts.

### 3. Stability

Keep the current auth/storage-backed product flow working while the extraction happens.

## Out of Scope

Forbidden in this segment:
- `Postgres` migration
- media rewrite
- auth redesign
- broad frontend rewrite to `React + Vite`

## Constraints

- do not break the active runtime
- keep the work narrow and reviewable
- do not turn this into a big-bang frontend/backend rewrite

## Expected Deliverable

By the end of the segment:
- one more meaningful part of web runtime API ownership moves out of `Next`
- direct backend access becomes stronger through the shared SDK direction
- runtime behavior remains stable

## Acceptance Criteria

- active runtime path remains working
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification of the extracted runtime flow

## Handoff Requirements

The executor must return:

### Summary

- what runtime/API ownership moved
- what still remains in `Next` and why

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks fuller web runtime extraction
