# Segment Brief 018: Auth Identity Ownership Foundation

## Segment

`auth-identity-ownership-foundation`

## Recommended Branch Name

`wave/stage4-auth-identity-ownership-foundation`

## Goal

Continue `Wave 12 / Stage 4` after runtime cookie-session integration already exists.

Segment task:
- start backend-owned identity/login foundation
- reduce `Clerk` as the auth source of truth
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md](../../waves/AUTH_IDENTITY_OWNERSHIP_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend-owned identity/login foundation

Introduce the backend-side identity/login primitives needed so auth ownership can keep moving away from `Clerk`.

### 2. Transitional safety

Reduce direct `Clerk` auth ownership without breaking the current runtime.

### 3. Auth-boundary sequencing

Keep the work inside the auth boundary and prepare for later full `Clerk` replacement.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- full signup/signin UI rewrite
- password-reset/verification product completion
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not turn this into a full auth rewrite
- prefer backend-owned identity/auth ownership over new direct `Clerk` coupling

## Expected Deliverable

By the end of the segment:
- backend identity/login foundation moves forward
- `Clerk` is less central as the auth source of truth
- the project is closer to later full `Clerk` replacement

## Acceptance Criteria

- backend auth identity/login foundation moves forward
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that auth ownership is moving from `Clerk` toward backend-owned identity flow

## Handoff Requirements

The executor must return:

### Summary

- what backend-owned identity/login foundation was added
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
