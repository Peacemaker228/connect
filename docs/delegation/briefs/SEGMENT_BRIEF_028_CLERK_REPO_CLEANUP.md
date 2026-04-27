# Segment Brief 028: Clerk Repo Cleanup

## Segment

`clerk-repo-cleanup`

## Recommended Branch Name

`cleanup/clerk-repo-cleanup`

## Goal

Run an optional narrow cleanup after functional `Clerk` removal is already complete.

Segment task:
- remove leftover repo/package/electron naming traces of `Clerk`
- keep the current backend-owned auth runtime untouched
- avoid reopening `Stage 4` architecture work

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [CLERK_REPO_CLEANUP.md](../../waves/CLERK_REPO_CLEANUP.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Package cleanup

Remove `@clerk/nextjs` and lockfile leftovers if they are no longer used.

### 2. Electron/desktop naming cleanup

Rename or clean up stale `Clerk` event/type names in `electron/*` and related typing files if they are now only historical naming.

### 3. Docs cleanup

Clean docs/runbook text that still describes `Clerk` as an active dependency where that is no longer true.

## Out of Scope

Forbidden in this segment:
- auth redesign
- storage/media/database work
- reopening Stage 4 runtime/session architecture

## Constraints

- do not break the current backend-owned auth flow
- if a `Clerk` reference is still functionally required, do not remove it blindly
- keep the change narrow and reviewable

## Expected Deliverable

By the end of the segment:
- repo-level `Clerk` leftovers are materially reduced
- active auth runtime remains unchanged
- the codebase and docs better reflect the real post-Clerk architecture

## Acceptance Criteria

- no dead `Clerk` package/runtime leftovers remain in the targeted scope
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- targeted search to confirm the remaining `Clerk` references are either gone or intentionally justified

## Handoff Requirements

The executor must return:

### Summary

- what `Clerk` leftovers were removed
- what still remains and why

### Changed Files

Flat file list

### Validation

- what was checked
- what was not checked

### Risks

- what still blocks a fuller Clerk repo cleanup if anything
