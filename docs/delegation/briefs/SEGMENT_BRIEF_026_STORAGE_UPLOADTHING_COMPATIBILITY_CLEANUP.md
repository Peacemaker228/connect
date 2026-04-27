# Segment Brief 026: Storage UploadThing Compatibility Cleanup

## Segment

`storage-uploadthing-compatibility-cleanup`

## Recommended Branch Name

`wave/stage5-storage-uploadthing-compat-cleanup`

## Goal

Continue `Wave 20 / Stage 5` after live managed-cloud validation has already passed.

Segment task:
- narrow the remaining `UploadThing` compatibility layer
- keep the managed-cloud `S3-compatible` provider as the active storage path
- reduce storage-vendor overlap without broad redesign

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
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Active-path cleanup

Reduce remaining `UploadThing` usage that is no longer needed for the active storage path.

### 2. Managed-cloud ownership stays primary

Keep the real managed-cloud `S3-compatible` provider as the active path.

### 3. Narrow compatibility retention only where still justified

If some `UploadThing` compatibility must remain temporarily, keep it explicit and narrow.

### 4. Ownership-safety parity

Do not leave compatibility delete/cleanup paths weaker than the managed-cloud provider in terms of ownership checks.

## Out of Scope

Forbidden in this segment:
- broad metadata redesign
- self-hosted `MinIO`
- `Redis`
- abandoned-upload sweeper architecture
- unrelated auth/media/database work

## Constraints

- do not break current upload/runtime behavior
- do not reopen already validated managed-cloud path
- prefer narrow cleanup over large storage rewrite
- if a compatibility path cannot be made ownership-safe, remove or disable it instead of keeping a weaker delete path

## Expected Deliverable

By the end of the segment:
- `UploadThing` overlap is smaller
- active storage ownership remains on managed-cloud `S3-compatible`
- the project is closer to a clean Stage 5 storage boundary

## Acceptance Criteria

- active runtime path does not depend on `UploadThing`
- remaining `UploadThing` usage, if any, is explicit and justified
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that `UploadThing` is no longer needed for the active path

## Handoff Requirements

The executor must return:

### Summary

- what `UploadThing` usage was removed or narrowed
- what still remains and why

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks later complete cleanup if anything
- what the next logical storage step is
