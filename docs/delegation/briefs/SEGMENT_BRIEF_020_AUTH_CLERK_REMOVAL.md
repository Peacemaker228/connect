# Segment Brief 020: Auth Clerk Removal

## Segment

`auth-clerk-removal`

## Recommended Branch Name

`wave/stage4-auth-clerk-removal`

## Goal

Continue `Wave 14 / Stage 4` after backend-owned auth entrypoints are already integrated into the runtime/browser flow.

Segment task:
- remove `Clerk` as the active auth provider from the main runtime path
- clean up transitional auth wiring
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_CLERK_REMOVAL.md](../../waves/AUTH_CLERK_REMOVAL.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Final provider removal on the active path

Remove `Clerk` as the active auth provider in the current runtime/browser path.

### 2. Transitional auth-glue cleanup

Remove or simplify transitional auth wiring that exists only because `Clerk` was still present.

### 3. Auth-boundary sequencing

Keep the work inside the auth boundary and do not mix it with later auth product-completeness tasks.

## Out of Scope

Forbidden in this segment:
- full auth product completion
- `email verification` / `password reset` flows
- account-linking policy expansion
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not turn this into a broad auth rewrite
- backend-owned auth must remain the only intended active path after the segment

## Expected Deliverable

By the end of the segment:
- `Clerk` is removed from the active runtime auth path
- transitional auth glue is materially reduced
- `Stage 4` is much closer to completion

## Acceptance Criteria

- active auth runtime path no longer depends on `Clerk`
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that `Clerk` is no longer the active auth provider in the runtime flow

## Handoff Requirements

The executor must return:

### Summary

- what `Clerk` runtime/provider/middleware pieces were removed or bypassed
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

- what auth-completeness work still remains after provider removal
- what the next logical step is
