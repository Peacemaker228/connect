# Segment Brief 016: Auth Cookie Session Foundation

## Segment

`auth-cookie-session-foundation`

## Recommended Branch Name

`wave/stage4-auth-cookie-session-foundation`

## Goal

Continue `Wave 10 / Stage 4` after the initial sessions/tokens foundation.

Segment task:
- move auth closer to a real backend-owned session model
- add the foundation required for browser `Secure` + `HttpOnly` cookie transport
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

### 1. Backend-owned session persistence

Add the backend persistence needed so sessions can be validated, rotated, revoked, and reasoned about as backend-owned state instead of only signed token payloads.

### 2. Cookie-compatible auth transport foundation

Prepare the auth module so browser auth can move toward `Secure` + `HttpOnly` cookie transport.

This may include:
- cookie names/options/constants/helpers
- controller/service changes that support later cookie-based exchange/refresh/logout
- compatibility-preserving response shaping if needed

### 3. Transitional safety

Keep the current runtime stable and do not break the existing transitional flow while the auth boundary is strengthened.

## Out of Scope

Forbidden in this segment:
- full `Clerk` removal
- full browser runtime cookie integration in `Next` pages/layout/middleware
- full protected-route rewrite
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit/media` rewrite
- unrelated Stage 5+ work

## Constraints

- stay inside the auth boundary
- do not break current runtime
- do not turn this into a full auth rewrite
- do not lock browser auth into bearer-token-as-final-transport
- protected routes are not the security source of truth; backend session validation is

## Expected Deliverable

By the end of the segment:
- backend session state is less ephemeral and more backend-owned
- auth is structurally closer to cookie-backed browser sessions
- the later `Clerk` replacement path becomes safer

## Acceptance Criteria

- backend session persistence/foundation moves forward
- cookie-compatible transport foundation exists
- current runtime is not broken
- typecheck passes
- lint for touched files passes or there is an explicit explanation why it was not run

## Validation

Minimum:
- typecheck
- lint for touched files
- logical verification that session ownership is stronger and aligned with the cookie-based target model

## Handoff Requirements

The executor must return:

### Summary

- what backend-owned session persistence/foundation was added
- what cookie-compatible auth transport pieces were added
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
