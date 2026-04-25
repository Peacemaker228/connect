# Segment Brief 012: Auth Context Integration

## Segment

`auth-context-integration`

## Recommended Branch Name

`wave/stage4-auth-context-integration`

## Goal

Continue `Stage 4` on top of the new backend auth foundation.

Segment task:
- integrate more profile/session resolution through the backend auth boundary
- reduce direct `Clerk`-coupled resolution paths
- keep current runtime working

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_CONTEXT_INTEGRATION.md](../../waves/AUTH_CONTEXT_INTEGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend auth-boundary adoption

Use the new backend auth boundary to move more profile/session resolution behind it.

### 2. Transitional integration

Reduce direct `Clerk`-specific resolution paths while preserving the current runtime behavior.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not mix this with a full auth product rewrite
- do not pull in unrelated storage/media/database work

## Expected Deliverable

By the end of the segment:
- more auth/profile resolution flows use the backend auth boundary
- direct `Clerk` coupling is reduced further
- the project moves closer to the later full replacement safely

## Acceptance Criteria

- auth-boundary adoption moves forward
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that auth coupling is reduced without overscoping

## Handoff Requirements

The executor must return:

### Summary

- what auth/profile resolution was moved behind the backend boundary
- what still remains transitional

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

- which auth transition points still remain
- what the next logical step is
