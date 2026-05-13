# SEGMENT BRIEF 089. Backend Media Control-Plane Implementation

Branch:
- `wave/stage8-backend-media-control-plane-implementation`

Segment:
- `backend-media-control-plane-implementation`

## Goal

Add the first backend media control-plane skeleton in `apps/api` without adding SFU/TURN dependencies, without removing LiveKit, and without switching the current UI runtime away from the existing LiveKit token flow.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_088_LIVEKIT_PARITY_SMOKE.md`
- `packages/app-core/src/contracts/media-provider.ts`
- `packages/sdk/src/actions/media.ts`
- `apps/api/src/modules/media/*`
- existing auth guard/decorator and channel/direct-message domain access patterns

## Files Changed

Added:
- `apps/api/src/modules/media/media-access.service.ts`
- `apps/api/src/modules/media/media-room.service.ts`
- `apps/api/src/modules/media/media-participant-session.service.ts`
- `apps/api/src/modules/media/media-permission.service.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_089_BACKEND_MEDIA_CONTROL_PLANE_IMPLEMENTATION.md`

Changed:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Implementation Summary

Current compatibility path preserved:
- `GET /api/media/livekit-token` still accepts query params `{ room, username }`.
- response shape remains `{ token }`.
- token creation still goes through the existing `MediaProviderAdapter` / `LiveKitMediaProviderAdapter`.
- `MediaRoom` and `getLiveKitToken` were not changed.

New control-plane skeleton:
- `POST /api/media/rooms/resolve`
- `POST /api/media/rooms/join`
- `POST /api/media/rooms/leave`
- `POST /api/media/rooms/close`
- `POST /api/media/commands` as a non-implemented signaling acknowledgement boundary

Backend ownership added:
- `MediaAccessService` resolves channel, conversation, and future meeting scopes from app-core media contracts.
- `MediaRoomService` owns current in-process room descriptor lifecycle for the skeleton.
- `MediaParticipantSessionService` creates backend-owned participant session ids and desired/published state snapshots.
- `MediaPermissionService` returns media permission, screen-share policy, and reconnect policy snapshots.

## Auth / Domain Model

New control-plane endpoints use `RequireAuthGuard` and `CurrentProfileId`.

Channel access:
- requires `serverId` and `channelId`
- validates the channel exists in the requested server
- validates the current profile is a server member
- rejects `TEXT` channels as not media-enabled
- resolves participant identity from backend-owned `profileId`, `memberId`, and profile display name

Conversation access:
- requires `serverId` and `conversationId`
- validates the current profile belongs to one of the conversation members on that server
- resolves participant identity from backend-owned `profileId`, `memberId`, and profile display name

Meeting access:
- remains a future scope skeleton
- validates `meetingId` and authenticated profile existence
- does not implement meeting membership policy yet

Close-room authorization:
- re-resolves the room scope and requires current moderator permission.
- channel moderator permission maps to current server member role `ADMIN` or `MODERATOR`.
- private conversation close semantics remain future work.

## Current Limitations

Review:
- room and participant sessions are in-process skeleton state only; they are not persisted.
- `/api/media/commands` returns a typed negative acknowledgement until signaling handlers are implemented.
- provider access on `joinRoom` is a transitional LiveKit bridge token, not a new media transport.
- meeting access policy is structural only and needs a future domain owner.
- live HTTP smoke requires a reachable local database and media env; the user-reported Prisma `ECONNREFUSED` is outside this segment.

Block:
- no SFU/TURN transport exists yet.
- client UI is not switched to the new control-plane endpoints.
- reconnect/resume and desired-state mutation commands are not implemented beyond contract/skeleton boundaries.

## Acceptance Result

Pass:
- existing `/api/media/livekit-token` compatibility endpoint shape is preserved.
- new resolve/join/leave/close endpoints compile and return app media envelope shapes.
- new endpoints are authenticated and domain access is implemented for current channel/conversation scopes.
- backend-resolved room scope, identity, and session ids are introduced before transitional provider token access.
- no UI runtime replacement was made.

Review:
- manual authenticated runtime smoke was not executed in this segment.
- in-process state is suitable only for skeleton/control-plane sequencing.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `client-media-controller-boundary`

Reason:
- backend resolve/join/leave/close surfaces now exist behind auth/domain checks, so the next safe step is client-side controller/boundary integration while keeping current LiveKit fallback active.

## Verification Performed

Verification performed:
- `bun.cmd run typecheck:api` passed during implementation.
- `git diff --check` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- `rg -n "mediasoup|coturn" apps packages src package.json bun.lock` returned no matches.
