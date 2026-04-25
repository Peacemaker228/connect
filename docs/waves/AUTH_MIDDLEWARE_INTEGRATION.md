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
