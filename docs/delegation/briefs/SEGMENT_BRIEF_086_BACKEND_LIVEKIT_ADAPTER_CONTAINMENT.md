# SEGMENT BRIEF 086. Backend LiveKit Adapter Containment

Branch:
- `wave/stage8-backend-livekit-adapter-containment`

Segment:
- `backend-livekit-adapter-containment`

## Goal

Move the current backend LiveKit token generation behind an adapter boundary while preserving `GET /api/media/livekit-token` behavior.

This segment keeps the current request query params `{ room, username }` and response `{ token }`. It does not remove LiveKit, does not change UI or SDK runtime flow, does not add media dependencies, env, infra, or production deploy changes, and does not fix the current microphone/media behavior.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_085_SDK_MEDIA_COMMAND_SURFACE.md`
- `apps/api/src/modules/media/media.controller.ts`

## Files Changed

Changed:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `apps/api/src/modules/media/media-provider.adapter.ts`
- `apps/api/src/modules/media/livekit-media-provider.adapter.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_086_BACKEND_LIVEKIT_ADAPTER_CONTAINMENT.md`

## Backend Boundary Added

New provider boundary:
- `MediaProviderAdapter`
- `MEDIA_PROVIDER_ADAPTER`
- `CreateMediaRoomAccessInput`
- `MediaRoomAccessResponse`

Current adapter implementation:
- `LiveKitMediaProviderAdapter`

Ownership after this segment:
- `MediaController` validates `room` and `username` query params and returns the adapter response.
- `LiveKitMediaProviderAdapter` reads current LiveKit env, constructs `AccessToken`, adds the same grants, and returns `{ token }`.
- `MediaModule` binds `MEDIA_PROVIDER_ADAPTER` to `LiveKitMediaProviderAdapter`.

## Compatibility Notes

Preserved endpoint:
- method: `GET`
- path: `/api/media/livekit-token`
- query params: `room`, `username`
- response shape: `{ token }`

Preserved behavior:
- missing `room` still returns `BadRequestException('Missing "room" query parameter')`
- missing `username` still returns `BadRequestException('Missing "username" query parameter')`
- missing LiveKit env still returns `InternalServerErrorException('Server misconfigured')`
- token identity remains the caller-provided `username`
- grants remain `roomJoin`, `canPublish`, and `canSubscribe`

No UI or SDK runtime flow changed:
- current `getLiveKitToken` keeps calling `/api/media/livekit-token`
- current `MediaRoom` token flow remains active

## Boundary Result

Pass:
- controller no longer imports `livekit-server-sdk`.
- controller no longer constructs `AccessToken` directly.
- LiveKit-specific backend code is isolated in `LiveKitMediaProviderAdapter`.
- endpoint request/response compatibility is preserved.
- no dependencies, env, infra, production deploy docs, UI, or SDK runtime flow changed.

Review:
- the adapter still represents the transitional caller-provided room/username model.
- later control-plane implementation must replace caller-provided identity/scope with backend-resolved room access and stable participant/session identity before provider access is created.

Block:
- client-side containment and parity smoke still need to prove no current media behavior regression before any runtime replacement.

Overall:
- `pass`

## Recommended Next Segment

Recommended next segment:
- `client-livekit-adapter-containment`

Reason:
- backend token construction is now contained; the next step is containing the current client LiveKit runtime imports/components behind a client adapter while preserving product behavior.

## Verification Performed

Verification performed:
- `git diff --check` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
- `rg -n "AccessToken|livekit-server-sdk" apps/api/src/modules/media` returns matches only in `apps/api/src/modules/media/livekit-media-provider.adapter.ts`.
