# Segment Brief 025: Storage Managed Cloud Validation

## Segment

`storage-managed-cloud-validation`

## Recommended Branch Name

`wave/stage5-storage-managed-cloud-validation`

## Goal

Continue `Wave 19 / Stage 5` after the real `S3-compatible` provider already exists in code.

Segment task:
- validate the new provider against a real managed-cloud bucket
- confirm the required env contract for local/dev and future prod
- verify that the current upload/runtime contract works end-to-end

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](../../waves/STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](../../waves/STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [STORAGE_MANAGED_CLOUD_VALIDATION.md](../../waves/STORAGE_MANAGED_CLOUD_VALIDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Real bucket validation

Validate the new provider against a real managed-cloud bucket.

### 2. Env contract confirmation

Confirm the exact env variables required for local/dev and future prod shape.

### 3. Runtime smoke test

Verify that the current `/api/server-upload` flow still works end-to-end through the new provider.

## Out of Scope

Forbidden in this segment:
- self-hosted `MinIO`
- `Redis`
- broad storage redesign
- UploadThing removal if validation is still incomplete
- database/media/auth refactors

## Constraints

- keep the current runtime/upload contract stable
- do not widen this step into a new storage architecture phase
- use managed cloud first

## Expected Deliverable

By the end of the segment:
- the new provider is validated against a real bucket
- the env contract is explicit
- the project knows whether the next step is cleanup/removal or another corrective storage pass

## Acceptance Criteria

- at least one real upload is verified through the new provider
- required env keys are explicit and confirmed
- current upload flow is not broken
- typecheck/lint still pass if code changed

## Validation

Minimum:
- live upload check against a real managed-cloud bucket
- local/dev env verification
- typecheck/lint if code was touched

## Handoff Requirements

The executor must return:

### Summary

- whether the live managed-cloud validation passed
- what env contract was used
- what the next storage step should be

### Changed Files

Flat file list

### Validation

- what was tested live
- what was not tested

### Risks

- what still blocks UploadThing fallback cleanup/removal
- what remains before Stage 5 can move forward cleanly
