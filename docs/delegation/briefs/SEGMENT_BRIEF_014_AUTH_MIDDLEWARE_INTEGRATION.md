# Segment Brief 014: Auth Middleware Integration

## Segment

`auth-middleware-integration`

## Recommended Branch Name

`wave/stage4-auth-middleware-integration`

## Goal

Continue `Stage 4` after auth runtime integration.

Segment task:
- reduce remaining direct `Clerk` dependence in runtime and middleware auth wiring
- move more auth wiring behind the backend auth boundary
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_MIDDLEWARE_INTEGRATION.md](../../waves/AUTH_MIDDLEWARE_INTEGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Middleware/runtime auth wiring

Reduce remaining direct `Clerk`-specific runtime and middleware auth glue by using the backend auth boundary where appropriate.

### 2. Compatibility-preserving transition

Keep current behavior working while reducing direct runtime dependence on `Clerk`.

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
- middleware/runtime auth wiring is more backend-owned
- direct `Clerk` runtime glue is reduced further
- the project moves closer to the later full replacement safely

## Acceptance Criteria

- auth middleware/runtime integration moves forward
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that direct `Clerk` runtime glue is reduced without overscoping

## Handoff Requirements

The executor must return:

### Summary

- what middleware/runtime auth flow moved closer to the backend boundary
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
