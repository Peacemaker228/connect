# Wave 4. Domain Extraction Slice 2 Messages

## Goal

This wave continues `Stage 3` after the first server/member slice is stable enough.

Next backend-owned domain slice:
- messages
- direct messages

Wave task:
- move this slice into `apps/api`
- convert related `Next` entrypoints into a compatibility/proxy layer
- keep any transport adjustments minimal and do not turn this wave into a transport rewrite

## Position in the Main Plan

Mapping:
- `Wave 3 / DOMAIN_EXTRACTION_SLICE_1` = invites/servers/channels/members
- `Wave 4 / DOMAIN_EXTRACTION_SLICE_2_MESSAGES` = messages/direct-messages
- `Wave 5 / SOCKET_TRANSPORT_EXTRACTION` = dedicated transport extraction step after this slice

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
- [SEGMENT_BRIEF_009_MESSAGES_DOMAIN_SLICE.md](../delegation/briefs/SEGMENT_BRIEF_009_MESSAGES_DOMAIN_SLICE.md)

## Wave Result

This section reflects the state at the end of `Wave 4`.
Later `Wave 5` moved socket transport ownership into the backend realtime gateway.

Current state inside this wave:
- backend ownership for `messages/direct-messages` is moved into `apps/api`
- `src/app/api/messages/*` and `src/app/api/direct-messages/*` are now thin proxy/compatibility layers
- legacy `pages/api/socket/*` for this slice is reduced to transitional auth/proxy compatibility behavior
- realtime keys for the message slice are centralized in a shared contract

## What Comes Next

This wave is far enough along for the next Stage 3 step.

Next step:

1. move to `Wave 5`: extract the socket transport itself into the `Nest` realtime gateway

Important:
- do not mix this with `Clerk` replacement
- do not mix this with `Postgres` migration
- do not mix this with `LiveKit/media` work
