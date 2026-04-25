# Segment Brief 013: Auth Runtime Integration

## Segment

`auth-runtime-integration`

## Recommended Branch Name

`wave/stage4-auth-runtime-integration`

## Goal

Continue `Stage 4` after auth foundation and auth context integration.

Segment task:
- reduce transitional runtime `x-profile-id` auth flow
- move more runtime/proxy auth wiring onto the backend auth boundary
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_RUNTIME_INTEGRATION.md](../../waves/AUTH_RUNTIME_INTEGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Runtime/proxy auth integration

Use the backend auth boundary to reduce transitional auth handling in runtime entrypoints.

### 2. Compatibility-preserving transition

Keep current behavior working while reducing direct `Clerk`-specific and `x-profile-id`-specific flow.

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
- do not turn this into a full auth rewrite
- do not pull in unrelated storage/media/database work

## Expected Deliverable

By the end of the segment:
- more runtime auth flow is routed through the backend auth boundary
- transitional `x-profile-id` glue is reduced
- the project moves closer to the later full `Clerk` replacement safely

## Acceptance Criteria

- auth runtime/proxy integration moves forward
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that transitional runtime auth glue is reduced without overscoping

## Handoff Requirements

The executor must return:

### Summary

- what runtime/proxy auth flow moved behind the backend boundary
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
