# Wave 9. Auth Middleware Integration

## Goal

This wave continues `Stage 4` after auth foundation, auth context integration, and auth runtime integration already exist.

Wave task:
- reduce remaining direct `Clerk` dependence in runtime and middleware auth wiring
- move more auth wiring behind the backend auth boundary
- keep current runtime stable during the transition

## Position in the Main Plan

Mapping:
- `Wave 6 / AUTH_FOUNDATION` = backend auth foundation
- `Wave 7 / AUTH_CONTEXT_INTEGRATION` = backend auth context/profile integration
- `Wave 8 / AUTH_RUNTIME_INTEGRATION` = runtime/proxy auth integration
- `Wave 9 / AUTH_MIDDLEWARE_INTEGRATION` = middleware/runtime auth wiring step before full replacement

## In Scope

- middleware/runtime auth wiring integration
- reducing direct `Clerk` dependence where it is still runtime glue
- keeping the current runtime behavior stable

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
- middleware auth wiring goes through a local auth adapter layer
- layout/provider runtime auth wiring goes through a local auth provider boundary
- current runtime auth state and identity loading are centralized
- direct Clerk glue is reduced in runtime entrypoints while current behavior stays stable

## What Comes Next

This wave is enough to move to the next auth-focused step.

Next step by plan:

1. continue `Stage 4` with backend-owned sessions/tokens foundation
2. keep the scope inside the auth boundary
3. do not mix this with storage, `Postgres`, or `LiveKit/media`
