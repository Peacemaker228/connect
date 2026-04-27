# Segment Brief 031: Storage Staged Upload Sweeper

## Segment

`storage-staged-upload-sweeper`

## Recommended Branch Name

`wave/stage5-storage-staged-upload-sweeper`

## Goal

Add a narrow staged/temp-upload sweeper as the planned storage-hygiene follow-up after `Wave 24`.

Segment task:
- clean abandoned staged/temp uploads
- keep the implementation operationally cheap
- avoid broad object reconciliation or storage redesign

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_STAGED_UPLOAD_SWEEPER.md](../../waves/STORAGE_STAGED_UPLOAD_SWEEPER.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Narrow sweeper

Implement a simple staged/temp-upload sweeper with explicit, bounded cleanup rules.

### 2. Operational safety

Use narrow age/prefix-based cleanup or equivalent bounded logic. Keep the active managed-cloud runtime path stable.

### 3. Reviewable implementation

Keep the job understandable and cheap to operate.

## Out of Scope

Forbidden in this segment:
- full bucket-vs-DB orphan scanner
- broad storage schema redesign
- self-hosted `MinIO`
- `Redis`
- auth/media/database work

## Constraints

- do not break the active storage runtime
- do not turn this into a large operational subsystem
- keep the work narrow and reviewable

## Expected Deliverable

By the end of the segment:
- abandoned staged/temp uploads are cleaned by a bounded backend-owned mechanism
- the storage stage is closer to operational closure
- no broad orphan-reconciliation system is introduced

## Acceptance Criteria

- active runtime path remains working
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification of the cleanup trigger/path

## Handoff Requirements

The executor must return:

### Summary

- what is being cleaned
- by what rule
- what is intentionally not cleaned

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still prevents full storage-hygiene closure
