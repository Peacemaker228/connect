# Wave 5. Socket Transport Extraction

## Goal

This wave continues `Stage 3` after both current domain slices already have backend ownership in `apps/api`.

Wave task:
- move socket transport ownership away from legacy `pages/api/socket/*`
- make the `Nest` realtime gateway the real transport owner
- keep existing runtime behavior as stable as possible during the transition

## Position in the Main Plan

Mapping:
- `Wave 3 / DOMAIN_EXTRACTION_SLICE_1` = invites/servers/channels/members
- `Wave 4 / DOMAIN_EXTRACTION_SLICE_2_MESSAGES` = messages/direct-messages
- `Wave 5 / SOCKET_TRANSPORT_EXTRACTION` = Stage 3 transport completion step

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

## Wave Result

Current state after this wave:
- socket transport ownership lives in `apps/api/src/modules/realtime/*`
- the `Nest` realtime gateway is the main transport owner
- browser clients connect directly to the backend realtime gateway
- legacy `src/pages/api/socket/*` remains only as transitional HTTP compatibility where it is still needed
- current runtime behavior stays aligned with the previous flow while ownership moves to the backend

## What Comes Next

This wave is enough to close the main `Stage 3` transport step.

Next step by plan:

1. start `Stage 4` with an `auth foundation` wave for the `Clerk` replacement path
2. keep the scope inside the auth boundary
3. do not mix this with `Postgres`, `UploadThing`, or `LiveKit/media` work
