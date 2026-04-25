# Segment Brief 009: Messages Domain Slice

## Segment

`messages-domain-slice`

## Recommended Branch Name

`wave/domain-slice-2-messages`

## Goal

Start the next `Stage 3` slice:
- messages
- direct messages

Segment task:
- move this domain logic into `apps/api`
- keep `apps/api` as the backend owner
- turn `Next` layers into compatibility/proxy layers instead of logic owners

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [Wave 4 - DOMAIN_EXTRACTION_SLICE_2_MESSAGES.md](../../waves/DOMAIN_EXTRACTION_SLICE_2_MESSAGES.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Backend ownership for messages

Move message-related logic into `apps/api` for:
- `messages`
- `direct-messages`

### 2. Thin compatibility/proxy work in web runtime

Adjust only the relevant `Next` layers:
- `src/app/api/messages/*`
- `src/app/api/direct-messages/*`
- related transitional socket transport only if required by this slice

## Out of Scope

Forbidden in this segment:
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- unrelated cleanup in older slices unless required to keep this slice working

## Constraints

- do not expand scope beyond messages/direct messages
- do not break current runtime
- keep domain ownership in `apps/api`
- do not mix this with a large transport rewrite

## Expected Deliverable

By the end of the segment:
- messages/direct-messages domain logic lives in `apps/api`
- related `Next` entrypoints are thinner
- Stage 3 moves forward without mixing in later migrations

## Acceptance Criteria

- `apps/api` is the owner for the new slice
- `Next` layers do not regain core message domain logic
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that ownership moved to `apps/api`

## Handoff Requirements

The executor must return:

### Summary

- what moved into `apps/api`
- what remains transitional

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

- which transitional points still remain
- what the next logical step is
