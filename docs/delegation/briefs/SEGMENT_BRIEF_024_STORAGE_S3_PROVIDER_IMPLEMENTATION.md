# Segment Brief 024: Storage S3 Provider Implementation

## Segment

`storage-s3-provider-implementation`

## Recommended Branch Name

`wave/stage5-storage-s3-provider`

## Goal

Continue `Wave 18 / Stage 5` after the backend storage foundation already exists.

Segment task:
- implement a real managed-cloud `S3-compatible` storage provider in `apps/api`
- keep the runtime upload contract stable
- move active storage ownership away from the temporary `UploadThing` backend adapter

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](../../waves/STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](../../waves/STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Real `S3-compatible` provider

Implement the managed-cloud `S3-compatible` provider behind the existing storage boundary in `apps/api`.

### 2. Stable runtime contract

Keep the current `/api/server-upload` runtime contract stable while moving the active backend provider away from `UploadThing`.

### 3. Config-driven provider wiring

Use the already introduced storage config shape and provider token/module structure.

### 4. Storage policy hardening where needed

If the new backend-owned upload path still has under-specified limits or policy gaps, tighten them as part of this step without widening the segment into a broader redesign.

## Out of Scope

Forbidden in this segment:
- self-hosted `MinIO` rollout
- `Redis`
- broad metadata redesign
- full storage UI rewrite
- `Postgres` migration
- media rewrite
- unrelated auth/runtime work

## Constraints

- stay inside the storage boundary
- keep the current upload flow working
- prefer reviewable implementation over broad rewrite
- do not widen this into file-processing/background-job architecture

## Expected Deliverable

By the end of the segment:
- the active backend storage provider can be `S3-compatible`
- the current upload route contract is still stable
- the project is closer to removing `UploadThing` as the active provider

## Acceptance Criteria

- real `S3-compatible` provider exists in `apps/api`
- provider wiring works through the existing storage module
- current upload flow is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- `bun run typecheck:api`
- root `tsc --noEmit`
- lint for touched files
- logical verification that active storage ownership is no longer bound to the temporary UploadThing adapter

## Handoff Requirements

The executor must return:

### Summary

- what was implemented in the `S3-compatible` provider
- whether `UploadThing` is still present only as fallback/compatibility or still active

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

- what still blocks later `UploadThing` removal if anything
- what the next logical storage step is
