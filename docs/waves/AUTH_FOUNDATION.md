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
