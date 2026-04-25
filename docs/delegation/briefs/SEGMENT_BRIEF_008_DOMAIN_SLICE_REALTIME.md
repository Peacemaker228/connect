# Segment Brief 008: Domain Slice Realtime Tail

## Segment

`domain-slice-realtime`

## Recommended Branch Name

`wave/domain-slice-1-realtime-tail`

## Goal

Do not expand `Stage 3` to a new domain slice yet. Extract the realtime tail for the slice that is already moved:
- invites
- servers
- channels
- members

Segment task:
- reduce the role of legacy `pages/api/socket/*` as a transitional transport layer
- keep domain ownership in `apps/api`
- prepare the ground for fuller realtime extraction later

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [Wave 3 - DOMAIN_EXTRACTION_SLICE_1.md](../../waves/DOMAIN_EXTRACTION_SLICE_1.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Realtime tail for the current slice

Carefully go through the transitional realtime layer for:
- `src/pages/api/socket/servers/*`
- `src/pages/api/socket/channels/*`
- `src/pages/api/socket/members/*`

Goal:
- make the transport layer thinner
- reduce duplication in emit/proxy behavior
- avoid bringing domain logic back there

### 2. Consistency between backend owner and legacy transport

Check consistency between:
- `apps/api`
- `src/app/api/*`
- `src/pages/api/socket/*`

Criteria:
- `apps/api` remains the domain owner
- legacy realtime layer does not turn back into a second backend layer

## Out of Scope

Forbidden in this segment:
- `messages`
- `direct-messages`
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- a new domain slice

## Constraints

- do not expand scope
- do not do a large transport rewrite
- do not break current runtime
- keep `apps/api` as backend owner

## Expected Deliverable

By the end of the segment:
- the realtime tail of the first Stage 3 slice is thinner and cleaner
- legacy socket transport is less brittle
- ownership of realtime/domain logic has not drifted back into `Next`

## Acceptance Criteria

- `apps/api` remains the domain owner
- `pages/api/socket` does not hold core domain logic again
- typecheck passes
- lint for touched files passes, or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that the realtime tail became thinner, not thicker

## Handoff Requirements

The executor must return:

### Summary

- what was done in the realtime tail
- what was intentionally left transitional

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

- which transitional points still remain
- what the next logical step is

### Recommended Next Segment

The next logical segment after this:
- either the next domain slice in `Stage 3`
- or a deeper transport cleanup if the realtime tail is still too heavy
