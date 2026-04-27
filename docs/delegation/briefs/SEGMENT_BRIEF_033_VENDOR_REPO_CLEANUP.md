# Segment Brief 033: Vendor Repo Cleanup

## Segment ID

`vendor-repo-cleanup`

## Branch

`cleanup/vendor-repo-cleanup`

## Goal

Run a final narrow repo cleanup for dead `Clerk` and `UploadThing` leftovers that are no longer part of the active runtime path.

## Scope

### In Scope

- repo-level dead dependency leftovers
- dead env/runbook/current-runtime references
- repo glue naming/history leftovers that still imply `Clerk` or `UploadThing` is active

### Out of Scope

- auth redesign
- storage redesign
- deleting historical roadmap/wave references that still describe the migration history
- changing active runtime behavior

## Expected Work

### 1. Remove dead repo-level leftovers

Clean remaining repo-level traces of `Clerk` and `UploadThing` only where they are dead and no longer operationally useful.

### 2. Align operational docs

Make sure runbook/current-runtime docs do not describe either dependency as active.

### 3. Keep history intact

Do not scrub historical wave/roadmap references that are still useful to understand the migration path.

## Acceptance Criteria

- no dead repo-level `Clerk` / `UploadThing` leftovers remain in the targeted scope
- current-runtime docs do not present them as active dependencies
- historical roadmap/wave references remain intact where they still carry migration meaning
- no active runtime behavior changes are introduced

## Verification

- targeted search for remaining dead repo-level references
- typecheck/lint only if code/package files changed
- manual review of docs/runbook targets

## Handoff Format

- what dead leftovers were removed
- what references were intentionally kept as migration history
- whether any runtime/package verification was needed
