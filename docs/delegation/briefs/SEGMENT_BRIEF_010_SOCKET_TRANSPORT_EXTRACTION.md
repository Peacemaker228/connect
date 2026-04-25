# Segment Brief 010: Socket Transport Extraction

## Segment

`socket-transport-extraction`

## Recommended Branch Name

`wave/stage3-socket-transport-extraction`

## Goal

Complete the next correct `Stage 3` step:
- move socket transport ownership away from legacy `pages/api/socket/*`
- make the `Nest` realtime gateway the real transport owner

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [Wave 5 - SOCKET_TRANSPORT_EXTRACTION.md](../../waves/SOCKET_TRANSPORT_EXTRACTION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Transport ownership

Move transport ownership from:
- `src/pages/api/socket/*`

Toward:
- `apps/api/src/modules/realtime/*`

### 2. Compatibility transition

Keep current clients working while transport ownership shifts.

## Out of Scope

Forbidden in this segment:
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- a new domain slice

## Constraints

- do not mix transport extraction with auth rewrite
- do not do a product-level realtime redesign
- keep current runtime behavior stable
- keep domain ownership in `apps/api`

## Expected Deliverable

By the end of the segment:
- socket transport ownership is no longer centered in legacy `pages/api/socket/*`
- `Nest` realtime gateway becomes the main transport owner
- Stage 3 moves toward completion without mixing in later migrations

## Acceptance Criteria

- transport ownership clearly moves toward `apps/api`
- legacy `pages/api/socket/*` becomes thinner or transitional-only
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that transport ownership moved in the intended direction

## Handoff Requirements

The executor must return:

### Summary

- what moved into `apps/api`
- what remains transitional

### Changed Files

Flat file list

### What Changed

For important files:
- what changed
- why

### Validation

- what was checked
- what was not checked

### Risks

- which transitional transport points still remain
- what the next logical step is
