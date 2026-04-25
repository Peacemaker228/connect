# Wave 10. Auth Sessions Foundation

## Goal

This wave continues `Stage 4` after auth foundation, auth context integration, auth runtime integration, and auth middleware integration already exist.

Wave task:
- start backend-owned sessions/tokens foundation
- prepare the project for later full `Clerk` replacement
- keep current runtime stable during the transition
- converge toward the target browser auth model: backend-owned sessions with `Secure` + `HttpOnly` cookies

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = backend auth foundation
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = auth context/profile integration
- `Wave 8 / AUTH_RUNTIME_INTEGRATION` = runtime/proxy auth integration
- `Wave 9 / AUTH_MIDDLEWARE_INTEGRATION` = middleware/runtime auth wiring integration
- `Wave 10 / AUTH_SESSIONS_FOUNDATION` = backend-owned sessions/tokens step before full replacement

## In Scope

- backend-owned sessions/tokens foundation
- auth-boundary work required to support later full replacement
- compatibility-preserving transition work if needed
- shaping the auth layer so browser runtime can later use cookie-backed session transport

## Out of Scope

- full `Clerk` removal
- final browser cookie wiring in web runtime
- `UploadThing` replacement
- `Postgres` migration
- `LiveKit` replacement
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Current Segment Direction

The next correct slice inside this wave is:

- backend session persistence
- cookie-compatible browser transport foundation

This is still part of `Wave 10`, not a new stage.
