# Segment Brief 021: Auth Residual Clerk Cleanup

## Segment

`auth-residual-clerk-cleanup`

## Recommended Branch Name

`wave/stage4-auth-residual-clerk-cleanup`

## Goal

Continue `Wave 15 / Stage 4` after `Clerk` has already been removed from the active browser/runtime auth path.

Segment task:
- remove residual `Clerk` usage outside the primary auth runtime flow
- clean up legacy helpers and server routes that still depend on `Clerk`
- keep the current app stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_RESIDUAL_CLERK_CLEANUP.md](../../waves/AUTH_RESIDUAL_CLERK_CLEANUP.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Residual `Clerk` cleanup

Remove remaining `Clerk` usage from server routes, auth-adjacent helpers, and other non-primary auth-path code.

### 2. Legacy-helper cleanup

Clean up or delete legacy helper paths that still carry `Clerk`-specific assumptions where backend-owned auth is now the real owner.

### 3. Auth-boundary sequencing

Keep the work inside the auth boundary and do not turn it into a storage/media migration.

## Out of Scope

Forbidden in this segment:
- `UploadThing` replacement as storage work
- `Postgres` migration
- `LiveKit/media` rewrite
- auth product completeness
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not broaden into vendor cleanup outside auth ownership
- backend-owned auth must remain the only intended auth owner after the segment

## Expected Deliverable

By the end of the segment:
- residual `Clerk` usage is materially reduced or removed
- auth-boundary ownership is cleaner and more consistent
- the project is closer to calling `Stage 4` complete

## Acceptance Criteria

- residual `Clerk` usage in the targeted auth-adjacent paths is removed or replaced
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that the remaining `Clerk` usage footprint is smaller after the segment

## Handoff Requirements

The executor must return:

### Summary

- what residual `Clerk` usage was removed
- what still remains intentionally deferred

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

- what still blocks calling `Stage 4` complete
- what the next logical step is
