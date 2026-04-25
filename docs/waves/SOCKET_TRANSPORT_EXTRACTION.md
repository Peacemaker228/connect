# Socket Transport Extraction Wave

## Goal

This wave continues `Stage 3` after both current domain slices already have backend ownership in `apps/api`.

Wave task:
- move socket transport ownership away from legacy `pages/api/socket/*`
- make the `Nest` realtime gateway the real transport owner
- keep existing runtime behavior as stable as possible during the transition

## Position in the Main Plan

Mapping:
- `DOMAIN_EXTRACTION_SLICE_1` = invites/servers/channels/members
- `DOMAIN_EXTRACTION_SLICE_2_MESSAGES` = messages/direct-messages
- `SOCKET_TRANSPORT_EXTRACTION` = Stage 3 transport completion step

## In Scope

- transport ownership for current realtime flows
- migration path from legacy `pages/api/socket/*` toward `apps/api/src/modules/realtime/*`
- compatibility work required to keep current clients working during the transition

## Out of Scope

- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- unrelated refactors in older slices unless needed for transport extraction

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
