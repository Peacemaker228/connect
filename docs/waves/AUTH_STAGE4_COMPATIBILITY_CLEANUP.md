# Wave 16. Auth Stage 4 Compatibility Cleanup

## Goal

This wave continues `Stage 4` after residual `Clerk` imports have already been removed from the codebase.

Wave task:
- remove remaining backend auth compatibility paths tied to legacy identity resolution
- clean up dead or transitional auth-context helpers
- finish the last auth-boundary cleanup needed before calling `Stage 4` complete

## Position in the Main Plan

Mapping:
- `Wave 14 / AUTH_CLERK_REMOVAL` = removal of `Clerk` from the active runtime auth path
- `Wave 15 / AUTH_RESIDUAL_CLERK_CLEANUP` = cleanup of remaining non-primary `Clerk` imports
- `Wave 16 / AUTH_STAGE4_COMPATIBILITY_CLEANUP` = final auth-boundary compatibility cleanup before `Stage 4` completion

## In Scope

- backend auth compatibility cleanup
- removal of dead/transitional auth-context helper paths
- cleanup needed to close `Stage 4` without drifting into later auth-product work

## Out of Scope

- auth product completeness (`email verification`, `password reset`, account linking, etc.)
- `Postgres` migration
- `UploadThing` replacement as storage work
- `LiveKit` replacement
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
