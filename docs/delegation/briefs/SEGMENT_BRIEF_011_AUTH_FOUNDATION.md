# Segment Brief 011: Auth Foundation

## Segment

`auth-foundation`

## Recommended Branch Name

`wave/stage4-auth-foundation`

## Goal

Start `Stage 4` with a focused auth foundation step.

Segment task:
- build the backend auth foundation in `apps/api`
- prepare the boundary for the future `Clerk` replacement
- avoid mixing this with the full auth migration or other late-stage rewrites

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_FOUNDATION.md](../../waves/AUTH_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend auth foundation

Work inside `apps/api` around:
- auth module structure
- auth contracts and boundaries
- foundation for sessions/tokens/profile resolution if needed by the chosen implementation step

### 2. Preparation for later replacement

The result should make the later `Clerk` replacement safer and more controlled.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- keep scope inside the auth boundary
- do not mix this with a full auth product rewrite
- do not break current runtime
- do not pull in unrelated storage/media/database work

## Expected Deliverable

By the end of the segment:
- auth foundation exists in `apps/api`
- the project is closer to a backend-owned auth boundary
- the path toward `Clerk` replacement is clearer and safer

## Acceptance Criteria

- auth-related foundation is moved forward in `apps/api`
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that this segment improves the auth boundary without overscoping

## Handoff Requirements

The executor must return:

### Summary

- what auth foundation was added
- what remains for the later replacement

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
