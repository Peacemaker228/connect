# Segment Brief 030: Storage Access Policy Foundation

## Segment

`storage-access-policy-foundation`

## Recommended Branch Name

`wave/stage5-storage-access-policy-foundation`

## Goal

Continue `Stage 5` after runtime reads already have a backend-owned access path.

Segment task:
- define the next storage read/access policy step
- narrow the gap between public redirect-based reads and stronger backend-owned access ownership
- keep the active managed-cloud path stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_ACCESS_POLICY_FOUNDATION.md](../../waves/STORAGE_ACCESS_POLICY_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Access policy step

Make the next narrow step in storage access policy so the project can move beyond public URL dependence in a controlled way.

### 2. Compatibility narrowing

Keep legacy compatibility where needed, but narrow it and make it explicit.

### 3. Contract stability

Preserve the current managed-cloud path and avoid breaking active runtime reads.

## Out of Scope

Forbidden in this segment:
- full private-file redesign
- broad storage schema redesign
- self-hosted `MinIO`
- `Redis`
- auth/media/database work

## Constraints

- do not break the active managed-cloud runtime path
- keep the work narrow and reviewable
- do not turn this into a large storage-platform rewrite

## Expected Deliverable

By the end of the segment:
- the next storage access-policy direction is materially implemented or tightly constrained
- the runtime path is still stable
- the codebase is closer to a stronger backend-owned read/access model

## Acceptance Criteria

- active runtime path remains working
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification of the runtime read/access path

## Handoff Requirements

The executor must return:

### Summary

- what changed in storage access policy or runtime read ownership
- what still remains transitional and why

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks a stronger backend-owned storage access model
