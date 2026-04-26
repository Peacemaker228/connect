# Wave 15. Auth Residual Clerk Cleanup

## Goal

This wave continues `Stage 4` after `Clerk` has already been removed from the active browser/runtime auth path.

Wave task:
- remove residual `Clerk` usage outside the main auth runtime path
- clean up legacy helpers and server routes that still depend on `Clerk` auth or `Clerk`-shaped assumptions
- finish the remaining provider-replacement cleanup without drifting into later-stage migrations

## Position in the Main Plan

Mapping:
- `Wave 13 / AUTH_OWN_ENTRYPOINTS_INTEGRATION` = runtime/browser integration for backend-owned auth entrypoints
- `Wave 14 / AUTH_CLERK_REMOVAL` = removal of `Clerk` from the active runtime auth path
- `Wave 15 / AUTH_RESIDUAL_CLERK_CLEANUP` = cleanup of remaining non-primary `Clerk` usage before `Stage 4` completion

## In Scope

- residual `Clerk` cleanup in server routes and legacy helpers
- auth-boundary cleanup needed to finish provider replacement
- keeping storage/media/database scope untouched while auth dependencies are cleaned up

## Out of Scope

- `UploadThing` replacement as a storage migration
- `Postgres` migration
- `LiveKit` replacement
- auth product completeness (`email verification`, `password reset`, etc.)
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Wave Result

Current state after this wave:
- residual `Clerk` imports are removed from `server-upload`, `uploadthing`, and the legacy `ensure-profile` helper path
- auth ownership is cleaner outside the primary runtime auth path
- remaining `Clerk`-related work is now mostly compatibility cleanup rather than active provider usage

## What Comes Next

This wave is enough to move to the next auth-focused cleanup step.

Next step by plan:

1. remove remaining backend auth compatibility paths tied to legacy identity resolution
2. finish the last auth-boundary cleanup before calling `Stage 4` complete
3. do not mix this with auth-product completeness work yet
