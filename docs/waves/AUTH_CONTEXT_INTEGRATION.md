# Wave 7. Auth Context Integration

## Goal

This wave continues `Stage 4` after the backend auth foundation already exists.

Wave task:
- move more profile/session resolution onto the backend auth boundary
- reduce direct runtime dependence on `Clerk`-specific resolution paths
- keep current runtime working during the transition

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = auth foundation start
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = next auth-boundary step before full replacement

## In Scope

- auth context/profile integration on top of the backend auth boundary
- session/profile resolution work that reduces direct `Clerk` coupling
- compatibility work required to keep the current runtime stable

## Out of Scope

- full `Clerk` removal
- `UploadThing` replacement
- `Postgres` migration
- `LiveKit` replacement
- unrelated refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Wave Result

Current state after this wave:
- backend auth boundary can resolve session/profile by user identity
- `currentProfile()` and `currentProfilePages()` now use backend auth resolution as the primary path
- `Clerk` remains a transitional identity source and fallback, but is no longer the owner of active profile resolution
- current runtime behavior is preserved

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. continue `Stage 4` with auth runtime/proxy integration
2. reduce transitional `x-profile-id` flows in runtime entrypoints
3. do not mix this with storage, `Postgres`, or `LiveKit/media`
