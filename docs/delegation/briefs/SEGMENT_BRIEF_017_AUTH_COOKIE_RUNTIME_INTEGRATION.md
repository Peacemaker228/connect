# Segment Brief 017: Auth Cookie Runtime Integration

## Segment

`auth-cookie-runtime-integration`

## Recommended Branch Name

`wave/stage4-auth-cookie-runtime-integration`

## Goal

Continue `Wave 11 / Stage 4` after backend cookie-session foundation already exists.

Segment task:
- make browser/runtime auth use the backend cookie-session foundation as the primary path
- reduce remaining direct `Clerk` runtime glue
- keep current runtime behavior stable

## Source of Truth

Before starting, the executor must read:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [AUTH_COOKIE_RUNTIME_INTEGRATION.md](../../waves/AUTH_COOKIE_RUNTIME_INTEGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Runtime integration on top of backend cookie sessions

Use the backend session boundary as the primary browser/runtime auth source where the current runtime still leans on transitional `Clerk` glue.

### 2. Compatibility-preserving migration

Reduce direct runtime `Clerk` dependence without breaking the current app flow.

### 3. Protected-route behavior only as runtime UX glue

If route-level/runtime auth checks are touched, they must remain a UX/navigation layer over backend session validation, not a security source of truth.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- full signup/login rewrite
- unrelated auth-domain redesign
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not turn this into a full auth rewrite
- prefer backend cookie-session flow over new direct bearer-token browser flow
- do not treat protected routes as the real security boundary

## Expected Deliverable

By the end of the segment:
- browser/runtime auth is closer to the backend cookie-session model
- direct runtime `Clerk` glue is reduced further
- the project is closer to later full `Clerk` removal

## Acceptance Criteria

- runtime/browser auth uses the backend cookie-session foundation more directly
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that backend cookie-session auth is more central in runtime flow after the change

## Handoff Requirements

The executor must return:

### Summary

- what runtime/browser auth flow changed
- what backend cookie-session path became primary
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
