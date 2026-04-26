# Wave 14. Auth Clerk Removal

## Goal

This wave continues `Stage 4` after backend-owned auth entrypoints are already integrated into the runtime/browser flow.

Wave task:
- remove `Clerk` as the active auth provider from the current runtime path
- clean up transitional auth wiring that still exists around the app shell
- keep the app stable while backend-owned auth becomes the only active path

## Position in the Main Plan

Mapping:
- `Wave 12 / AUTH_IDENTITY_OWNERSHIP_FOUNDATION` = backend-owned identity/login foundation
- `Wave 13 / AUTH_OWN_ENTRYPOINTS_INTEGRATION` = runtime/browser integration for backend-owned auth entrypoints
- `Wave 14 / AUTH_CLERK_REMOVAL` = final provider-removal wave inside `Stage 4`

## In Scope

- removal of active `Clerk` runtime/provider/middleware usage from the main auth path
- cleanup of transitional auth glue that exists only for `Clerk` compatibility
- compatibility-preserving auth-boundary work needed to make backend-owned auth the only active flow

## Out of Scope

- full auth product completion (`email verification`, `password reset`, account linking, etc.)
- `Postgres` migration
- `UploadThing` replacement
- `LiveKit` replacement
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
