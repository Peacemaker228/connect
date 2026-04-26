# Wave 11. Auth Cookie Runtime Integration

## Goal

This wave continues `Stage 4` after backend auth session persistence and cookie transport foundation already exist.

Wave task:
- move browser/runtime auth flow onto the backend cookie-session foundation
- reduce the remaining runtime dependence on transitional `Clerk` auth flow
- keep current runtime behavior stable during the transition

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = backend auth foundation
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = auth context/profile integration
- `Wave 8 / AUTH_RUNTIME_INTEGRATION` = runtime/proxy auth integration
- `Wave 9 / AUTH_MIDDLEWARE_INTEGRATION` = middleware/runtime auth wiring integration
- `Wave 10 / AUTH_SESSIONS_FOUNDATION` = backend-owned sessions and cookie transport foundation
- `Wave 11 / AUTH_COOKIE_RUNTIME_INTEGRATION` = browser/runtime integration on top of backend cookie sessions

## In Scope

- runtime auth flow that consumes backend cookie sessions as the primary browser mechanism
- middleware/runtime/provider/proxy adjustments required to prefer the backend session boundary
- reducing direct `Clerk` dependence where it is still browser/runtime glue

## Out of Scope

- full `Clerk` removal
- signup/login rewrite
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit` replacement
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Wave Result

Current state after this wave:
- browser/runtime auth can bootstrap backend cookie sessions through dedicated auth routes
- runtime auth utilities prefer backend cookie-session auth before falling back to transitional Clerk-backed identity resolution
- runtime provider and middleware are aligned to the backend cookie-session path as the primary browser auth flow

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. continue `Stage 4` with backend-owned identity/login foundation
2. reduce `Clerk` as the auth source of truth
3. do not turn this into a full `Clerk` removal yet
