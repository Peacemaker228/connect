# Wave 17. Storage Foundation

## Goal

This wave starts `Stage 5` after the active `Stage 4` auth-provider replacement work is complete.

Wave task:
- establish backend-owned storage foundation
- keep `UploadThing` behind a storage boundary first
- prepare the project for a later move to `MinIO` or another `S3-compatible` provider

## Position in the Main Plan

Mapping:
- `Wave 14 / AUTH_CLERK_REMOVAL` = removal of `Clerk` from the active runtime auth path
- `Wave 15 / AUTH_RESIDUAL_CLERK_CLEANUP` = cleanup of remaining non-primary `Clerk` imports
- `Wave 16 / AUTH_STAGE4_COMPATIBILITY_CLEANUP` = final compatibility cleanup for provider replacement
- `Wave 17 / STORAGE_FOUNDATION` = start of `Stage 5` storage abstraction

Late deferred note:
- `email verification`
- `password reset`
- similar auth-product completeness work

These are intentionally deferred to the very end of the roadmap, before the final `Next.js -> React` decision.

## In Scope

- backend-owned storage foundation
- storage boundary cleanup
- keeping current upload flows stable while reducing storage lock-in

## Out of Scope

- immediate full replacement of `UploadThing`
- `Postgres` migration
- `LiveKit` replacement
- deferred late-roadmap auth-product completeness work
- broad unrelated refactors

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
