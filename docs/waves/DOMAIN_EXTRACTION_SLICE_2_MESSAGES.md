# Domain Extraction Slice 2 Wave

## Goal

This wave continues `Stage 3` after the first server/member slice is stable enough.

Next backend-owned domain slice:
- messages
- direct messages

Wave task:
- move this slice into `apps/api`
- convert related `Next` entrypoints into a compatibility/proxy layer
- keep socket transport changes scoped to the same slice

## Position in the Main Plan

Mapping:
- `DOMAIN_EXTRACTION_SLICE_1` = invites/servers/channels/members
- `DOMAIN_EXTRACTION_SLICE_2_MESSAGES` = messages/direct-messages

## In Scope

- backend ownership for messages and direct messages in `apps/api`
- `src/app/api/messages/*` compatibility/proxy work
- `src/app/api/direct-messages/*` compatibility/proxy work
- related transitional socket transport work only where needed for this slice

## Out of Scope

- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- unrelated server/member/invite refactors outside targeted adjustments

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
