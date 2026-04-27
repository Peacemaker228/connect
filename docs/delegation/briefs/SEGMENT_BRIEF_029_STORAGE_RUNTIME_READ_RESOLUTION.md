# Segment Brief 029: Storage Runtime Read Resolution

## Segment

`storage-runtime-read-resolution`

## Recommended Branch Name

`wave/stage5-storage-runtime-read-resolution`

## Goal

Continue `Stage 5` after storage write/delete ownership has already moved toward backend-controlled metadata.

Segment task:
- begin moving runtime reads away from raw stored public URLs as the only read contract
- introduce the first backend-owned runtime read/file-access resolution step
- keep the current managed-cloud storage path stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_RUNTIME_READ_RESOLUTION.md](../../waves/STORAGE_RUNTIME_READ_RESOLUTION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Runtime read ownership step

Introduce a narrow backend-owned step for runtime file access/read resolution so the system is less dependent on public URL values as the only active read path.

### 2. Compatibility narrowing

Keep historical public-URL compatibility where needed, but narrow it and avoid making it the long-term primary model.

### 3. Contract stability

Preserve the current managed-cloud path and keep the change reviewable.

## Out of Scope

Forbidden in this segment:
- full private-file redesign
- broad storage schema redesign
- self-hosted `MinIO`
- `Redis`
- auth/media/database work

## Constraints

- do not break the active managed-cloud runtime path
- do not turn this into a general storage-platform rewrite
- keep the change narrow and reviewable

## Expected Deliverable

By the end of the segment:
- runtime read ownership is less tied to raw public URL values
- backend storage boundary owns more of the active read story
- historical compatibility remains available where necessary

## Acceptance Criteria

- active runtime path remains working
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- targeted logical verification of the active read/access path

## Handoff Requirements

The executor must return:

### Summary

- what changed in the runtime read/access path
- what still remains dependent on public URL compatibility and why

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks fuller backend-owned file-access resolution
