# Segment Brief 023: Storage Foundation

## Segment

`storage-foundation`

## Recommended Branch Name

`wave/stage5-storage-foundation`

## Goal

Start `Wave 17 / Stage 5` after the active `Stage 4` auth-provider replacement work is complete.

Segment task:
- establish a backend-owned storage foundation
- move toward a backend-owned `S3-compatible` storage model
- keep the implementation cloud-first for now
- prepare the project for later provider replacement without broadening the scope

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

### 2. Cloud-first `S3-compatible` direction

Prefer a managed cloud `S3-compatible` direction first.

This segment should not start with self-hosted `MinIO`.

### 3. Boundary-first approach

Reduce direct dependency spread and tighten the storage abstraction.

`UploadThing` may remain temporarily only if needed to keep the migration step narrow and reviewable.

### 4. No forced `Redis`

Do not introduce `Redis` in this segment unless a concrete storage-driven reason appears in the implementation itself.

### 5. Stage sequencing

Advance `Stage 5` without pulling in `Postgres`, media, or deferred auth-product work.

## Out of Scope

Forbidden in this segment:
- full `UploadThing` removal
- self-hosted `MinIO` rollout as an immediate infra step
- adding `Redis` just because storage work exists
- `Postgres` migration
- `LiveKit/media` rewrite
- deferred auth-product work like `email verification` or `password reset`
- unrelated refactors outside the storage boundary

## Constraints

- stay inside the storage boundary
- do not break current upload/runtime behavior
- do not reopen finished `Stage 4` provider-replacement work
- prefer thin, reviewable foundation changes over a large storage rewrite
- prefer a provider-agnostic `S3-compatible` shape over a new vendor-specific abstraction

## Expected Deliverable

By the end of the segment:
- storage ownership is cleaner and more backend-owned
- current upload flow still works
- the project is better prepared for later `UploadThing -> S3-compatible` replacement
- the project has a clear cloud-first direction without prematurely taking on self-hosted infra or `Redis`

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
- whether the implementation keeps the project on the cloud-first / no-Redis path for this stage

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
