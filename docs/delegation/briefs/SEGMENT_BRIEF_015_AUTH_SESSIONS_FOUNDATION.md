# Segment Brief 015: Auth Sessions Foundation

## Segment

`auth-sessions-foundation`

## Recommended Branch Name

`wave/stage4-auth-sessions-foundation`

## Goal

Continue `Stage 4` after auth middleware integration.

Segment task:
- start backend-owned sessions/tokens foundation
- move the auth boundary closer to a full backend-owned model
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_SESSIONS_FOUNDATION.md](../../waves/AUTH_SESSIONS_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend-owned sessions/tokens foundation

Move the auth boundary forward by introducing the backend foundation needed for sessions/tokens/devices work.

### 2. Compatibility-preserving transition

Keep current behavior stable while preparing for the later full `Clerk` replacement.

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
- backend-owned sessions/tokens foundation exists
- the project is closer to full backend-owned auth
- later `Clerk` removal becomes safer and more controlled

## Acceptance Criteria

- auth sessions/tokens foundation moves forward
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that the backend auth boundary is stronger without overscoping

## Handoff Requirements

The executor must return:

### Summary

- what backend-owned auth foundation was added
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
