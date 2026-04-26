# Segment Brief 022: Auth Stage 4 Compatibility Cleanup

## Segment

`auth-stage4-compatibility-cleanup`

## Recommended Branch Name

`wave/stage4-auth-compatibility-cleanup`

## Goal

Continue `Wave 16 / Stage 4` after residual `Clerk` imports have already been removed from the codebase.

Segment task:
- remove remaining backend auth compatibility paths tied to legacy identity resolution
- clean up dead/transitional auth-context helpers
- keep the app stable while closing the last auth-boundary cleanup gap

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_STAGE4_COMPATIBILITY_CLEANUP.md](../../waves/AUTH_STAGE4_COMPATIBILITY_CLEANUP.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend compatibility cleanup

Remove or simplify backend auth paths that exist only for legacy identity resolution and are no longer part of the intended active flow.

### 2. Dead helper cleanup

Remove dead or now-unnecessary auth-context helpers that survived earlier waves but are no longer needed.

### 3. Stage-closure sequencing

Keep the work inside the auth boundary and orient it toward honest `Stage 4` completion.

## Out of Scope

Forbidden in this segment:
- auth product completeness
- `email verification` / `password reset` / account-linking expansion
- `Postgres` migration
- `UploadThing` replacement as storage work
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not broaden into a fresh auth redesign
- remove compatibility paths only where they are no longer needed by the intended active flow

## Expected Deliverable

By the end of the segment:
- legacy backend auth compatibility paths are materially reduced or removed
- dead auth-context helpers are cleaned up
- the project is very close to or ready for honest `Stage 4` closure

## Acceptance Criteria

- targeted compatibility paths are removed or simplified
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that the active auth flow no longer depends on the cleaned-up compatibility paths

## Handoff Requirements

The executor must return:

### Summary

- what compatibility paths were removed or simplified
- what still remains before `Stage 4` can honestly be closed

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

- what still blocks `Stage 4` closure if anything
- what the next logical step is
