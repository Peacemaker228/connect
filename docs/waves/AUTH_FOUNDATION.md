# Wave 6. Auth Foundation

## Goal

This wave starts `Stage 4` after `Stage 3` is complete enough.

Wave task:
- start the backend-owned auth foundation for the future `Clerk` replacement path
- define the auth boundary in `apps/api`
- prepare session/token/profile resolution work without mixing in the full replacement yet

## Position in the Main Plan

Mapping:
- `Wave 5 / SOCKET_TRANSPORT_EXTRACTION` = Stage 3 transport completion
- `Wave 6 / AUTH_FOUNDATION` = start of `Stage 4`

## In Scope

- auth foundation inside `apps/api`
- initial auth module structure and contracts
- session/token/profile resolution groundwork if required by the segment

## Out of Scope

- full `Clerk` removal
- `UploadThing` replacement
- `Postgres` migration
- `LiveKit` replacement
- unrelated backend refactors outside the auth boundary

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Wave Result

Current state after this wave:
- backend auth foundation exists in `apps/api`
- backend controllers no longer read `x-profile-id` directly
- transitional auth context is centralized behind the auth boundary
- `/api/auth/session` returns a backend-owned session/profile snapshot
- current runtime is preserved and full `Clerk` replacement is intentionally deferred

## What Comes Next

This wave is enough to start the next auth-focused step.

Next step by plan:

1. continue `Stage 4` with auth context/profile integration
2. keep current runtime working while reducing direct `Clerk` coupling
3. do not mix this with storage, `Postgres`, or `LiveKit/media`
