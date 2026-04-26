# Wave 13. Auth Own Entrypoints Integration

## Goal

This wave continues `Stage 4` after backend-owned identity/login foundation already exists.

Wave task:
- integrate backend-owned auth entrypoints into the runtime/browser flow
- reduce `Clerk` as the main sign-in/sign-up source
- keep the current runtime stable during the transition

## Position in the Main Plan

Mapping:
- `Wave 10 / AUTH_SESSIONS_FOUNDATION` = backend-owned sessions and cookie transport foundation
- `Wave 11 / AUTH_COOKIE_RUNTIME_INTEGRATION` = browser/runtime integration on top of backend cookie sessions
- `Wave 12 / AUTH_IDENTITY_OWNERSHIP_FOUNDATION` = backend-owned identity/login foundation
- `Wave 13 / AUTH_OWN_ENTRYPOINTS_INTEGRATION` = runtime/browser integration for backend-owned auth entrypoints

## In Scope

- runtime/browser integration for backend-owned auth entrypoints
- reducing `Clerk` as the main sign-in/sign-up source
- compatibility-preserving auth-boundary work

## Out of Scope

- full `Clerk` removal
- full auth product completion (`email verification`, `password reset`, etc.)
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
- browser/runtime auth entrypoints now use backend-owned login/register flow as the primary path
- sign-in/sign-up pages prefer local auth entrypoint forms with `Clerk` left as fallback mode
- shared auth entrypoint validation is centralized through app-core schema/contracts

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. perform final `Clerk` removal and clean up transitional auth wiring
2. keep the scope inside the auth boundary
3. do not mix this with auth product-completeness work yet
