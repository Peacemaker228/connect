# Segment Brief 023: Storage Foundation

## Segment

`storage-foundation`

## Recommended Branch Name

`wave/stage5-storage-foundation`

## Goal

Start `Wave 17 / Stage 5` after the active `Stage 4` auth-provider replacement work is complete.

Segment task:
- establish backend-owned storage foundation
- keep `UploadThing` behind the storage boundary first
- prepare the project for later storage-provider replacement without broadening the scope

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](../../waves/STORAGE_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend-owned storage foundation

Move active storage ownership further behind the backend/storage boundary.

### 2. Boundary-first approach

Keep `UploadThing` working for now, but reduce direct dependency spread and tighten the storage abstraction.

### 3. Stage sequencing

Advance `Stage 5` without pulling in `Postgres`, media, or deferred auth-product work.

## Out of Scope

Forbidden in this segment:
- full `UploadThing` removal
- full `MinIO` rollout as a production replacement
- `Postgres` migration
- `LiveKit/media` rewrite
- deferred auth-product work like `email verification` or `password reset`
- unrelated refactors outside the storage boundary

## Constraints

- stay inside the storage boundary
- do not break current upload/runtime behavior
- do not reopen finished `Stage 4` provider-replacement work
- prefer thin, reviewable foundation changes over a large storage rewrite

## Expected Deliverable

By the end of the segment:
- storage ownership is cleaner and more backend-owned
- current upload flow still works
- the project is better prepared for later `UploadThing -> MinIO/S3-compatible` replacement

## Acceptance Criteria

- storage foundation clearly advances
- current runtime/upload behavior is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that the change advances `Stage 5` storage abstraction without scope creep

## Handoff Requirements

The executor must return:

### Summary

- what storage-boundary/foundation work was added
- what still remains before storage-provider replacement can happen later

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

- what still blocks later storage-provider replacement if anything
- what the next logical storage step is
