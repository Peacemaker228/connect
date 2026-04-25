# Domain Extraction Slice 1 Wave

## Goal

This wave corresponds to the start of `Stage 3`.

First real backend-owned domain slice:
- invites
- servers
- channels
- members

Wave task:
- move this slice into `apps/api`
- convert `Next` entrypoints into a compatibility/proxy layer
- keep `pages/api/socket` transitional, but without storing core domain logic there

## Position in the Main Plan

Mapping:
- `FIRST_MIGRATION` = `Stage 1`
- `NEST_FOUNDATION` = `Stage 2`
- `DOMAIN_EXTRACTION_SLICE_1` = start of `Stage 3`

## Scope of This Wave

### Included

- controllers/services for invites, servers, channels, members in `apps/api`
- `PrismaService` in the common backend layer
- thin proxy helper for calling `apps/api`
- `src/app/api/*` compatibility layer for the invite/server/channel/member slice
- `src/pages/api/socket/*` transitional proxy/socket emit layer for the same slice

### Out of Scope

- `messages`
- `direct-messages`
- full realtime extraction
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration

## Current Result

Current state inside this wave:
- the first Stage 3 slice already lives in `apps/api`
- `Next app/api` is no longer the main place that owns this slice's logic
- `pages/api/socket` is still transitional, but it is no longer a backend-owned domain layer
- transitional cleanup is complete: proxy responses are aligned and remaining channel validation was removed from the legacy socket layer
- realtime contract for this slice is now centralized and shared between legacy socket routes and client listeners

## Transitional Risks

- auth is still transitional through profile resolution in `Next`
- backend still receives `x-profile-id`
- legacy Socket.IO transport is not fully extracted yet
- full standalone smoke/e2e still requires a valid `DATABASE_URL` for `apps/api`

## What Comes Next

This wave is complete enough for the first Stage 3 slice.

Next step inside `Stage 3` is now:

1. move to the next domain slice: `messages/direct-messages`

Important:
- do not mix this with auth/media/database migrations
- keep socket transport changes scoped to the new slice

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md](../delegation/briefs/SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md)
- [SEGMENT_BRIEF_007_DOMAIN_SLICE_CLEANUP.md](../delegation/briefs/SEGMENT_BRIEF_007_DOMAIN_SLICE_CLEANUP.md)
- [SEGMENT_BRIEF_008_DOMAIN_SLICE_REALTIME.md](../delegation/briefs/SEGMENT_BRIEF_008_DOMAIN_SLICE_REALTIME.md)
