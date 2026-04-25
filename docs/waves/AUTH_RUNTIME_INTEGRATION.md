# Wave 8. Auth Runtime Integration

## Goal

This wave continues `Stage 4` after backend auth foundation and auth context integration already exist.

Wave task:
- reduce transitional `x-profile-id` auth flows in runtime entrypoints
- move more runtime auth wiring onto the backend auth boundary
- keep current runtime stable while reducing direct `Clerk` coupling further

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = backend auth foundation
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = backend auth context/profile integration
- `Wave 8 / AUTH_RUNTIME_INTEGRATION` = runtime/proxy auth integration before full replacement

## In Scope

- runtime and proxy auth integration on top of the backend auth boundary
- reducing transitional `x-profile-id` flow where it is now only compatibility glue
- keeping current runtime behavior stable during the transition

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
- runtime proxy routes use backend-auth headers instead of manual `x-profile-id` glue
- transitional auth header creation is centralized
- `src/app/api/*` and `src/pages/api/socket/*` are thinner in auth handling
- current runtime behavior is preserved

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. continue `Stage 4` with middleware/runtime auth wiring integration
2. reduce remaining direct `Clerk` dependence in runtime wiring
3. do not mix this with storage, `Postgres`, or `LiveKit/media`
