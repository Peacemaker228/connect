# Segment Brief 019: Auth Own Entrypoints Integration

## Segment

`auth-own-entrypoints-integration`

## Recommended Branch Name

`wave/stage4-auth-own-entrypoints-integration`

## Goal

Continue `Wave 13 / Stage 4` after backend-owned identity/login foundation already exists.

Segment task:
- integrate backend-owned auth entrypoints into the runtime/browser flow
- reduce `Clerk` as the main sign-in/sign-up source
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_OWN_ENTRYPOINTS_INTEGRATION.md](../../waves/AUTH_OWN_ENTRYPOINTS_INTEGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Runtime/browser integration for backend-owned auth entrypoints

Move the runtime closer to backend-owned auth entrypoints as the primary browser flow.

### 2. Transitional reduction of Clerk sign-in ownership

Reduce `Clerk` as the main sign-in/sign-up source without breaking the current app flow.

### 3. Auth-boundary sequencing

Keep the work inside the auth boundary and prepare for later full `Clerk` replacement.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- full auth product completion
- `email verification` / `password reset` product flows
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not turn this into a full auth rewrite
- prefer backend-owned auth entrypoints over new direct `Clerk` coupling

## Expected Deliverable

By the end of the segment:
- browser/runtime flow is closer to backend-owned auth entrypoints
- `Clerk` is less central as the sign-in/sign-up source
- the project is closer to later full `Clerk` replacement

## Acceptance Criteria

- backend-owned auth entrypoints are integrated further into runtime/browser flow
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that runtime/browser auth entrypoint ownership is moving from `Clerk` toward backend-owned flow

## Handoff Requirements

The executor must return:

### Summary

- what runtime/browser auth entrypoint flow changed
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

- which `Clerk` transition points still remain
- what the next logical step is
