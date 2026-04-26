# Wave 12. Auth Identity Ownership Foundation

## Goal

This wave continues `Stage 4` after backend cookie-session runtime integration already exists.

Wave task:
- start moving auth identity ownership away from `Clerk`
- prepare the backend-owned login/identity foundation needed for later full replacement
- keep the current runtime stable during the transition

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = backend auth foundation
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = auth context/profile integration
- `Wave 8 / AUTH_RUNTIME_INTEGRATION` = runtime/proxy auth integration
- `Wave 9 / AUTH_MIDDLEWARE_INTEGRATION` = middleware/runtime auth wiring integration
- `Wave 10 / AUTH_SESSIONS_FOUNDATION` = backend-owned sessions and cookie transport foundation
- `Wave 11 / AUTH_COOKIE_RUNTIME_INTEGRATION` = browser/runtime integration on top of backend cookie sessions
- `Wave 12 / AUTH_IDENTITY_OWNERSHIP_FOUNDATION` = backend-owned identity/login foundation before full `Clerk` removal

## In Scope

- backend auth identity/login foundation
- reducing `Clerk` as the source of truth for auth ownership
- compatibility-preserving transition work inside the auth boundary

## Out of Scope

- full `Clerk` removal
- full signup/signin UI rewrite
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
- backend auth identities exist as a separate ownership layer
- Clerk identity resolution is routed through backend auth-identity records
- password hashing/verification foundation exists inside the backend auth boundary
- backend password-based register/login entrypoints exist and issue backend-owned sessions

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. integrate backend-owned auth entrypoints into the runtime/browser flow
2. reduce `Clerk` as the main sign-in/sign-up source
3. do not turn this into full `Clerk` removal yet
