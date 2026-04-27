# Segment Brief 027: Storage Metadata Ownership Foundation

## Segment

`storage-metadata-ownership-foundation`

## Recommended Branch Name

`wave/stage5-storage-metadata-ownership`

## Goal

Continue `Wave 21 / Stage 5` after the active managed-cloud provider path is stable.

Segment task:
- begin moving storage ownership away from raw vendor URLs
- introduce a backend-owned metadata/file-key direction
- keep the current runtime contract stable while preparing later normalization

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](../../waves/STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](../../waves/STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [STORAGE_MANAGED_CLOUD_VALIDATION.md](../../waves/STORAGE_MANAGED_CLOUD_VALIDATION.md)
- [STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md](../../waves/STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md)
- [STORAGE_METADATA_OWNERSHIP_FOUNDATION.md](../../waves/STORAGE_METADATA_OWNERSHIP_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Metadata direction

Introduce the first backend-owned storage metadata/file-key direction instead of relying forever on raw vendor URLs.

### 2. Runtime compatibility

Keep the current runtime contract stable during the first normalization step.

### 3. Narrow foundation work

Prefer a small, reviewable ownership step over a broad storage/database redesign.

### 4. Optional dead `Clerk` cleanup

If the repo still contains only dead `Clerk` package/env leftovers, they may be removed as a tiny cleanup inside this segment.

This does not authorize reopening auth architecture work.

## Out of Scope

Forbidden in this segment:
- full storage schema redesign in one step
- self-hosted `MinIO`
- `Redis`
- broad abandoned-upload sweeper architecture
- unrelated auth/media/database work

## Constraints

- do not break the active managed-cloud provider path
- do not widen this into a general database migration
- keep historical compatibility concerns explicit
- if `Clerk` is touched, keep it strictly to dead package/env cleanup only

## Expected Deliverable

By the end of the segment:
- the project is less dependent on raw vendor URLs as the long-term storage source of truth
- the next storage normalization steps are easier
- runtime behavior stays stable

## Acceptance Criteria

- metadata/file-key ownership foundation clearly advances
- current runtime behavior is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that storage ownership is moving away from raw vendor URLs

## Handoff Requirements

The executor must return:

### Summary

- what metadata/file-key ownership work was added
- what still remains before fuller normalization

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks later storage normalization if anything
- what the next logical storage step is
