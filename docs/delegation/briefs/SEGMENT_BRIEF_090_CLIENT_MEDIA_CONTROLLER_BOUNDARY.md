# SEGMENT BRIEF 090. Client Media Controller Boundary

Branch:
- `wave/stage8-client-media-controller-boundary`

Segment:
- `client-media-controller-boundary`

## Goal

Add the client media controller/hook and route entry mapping around the backend media control-plane while preserving the current LiveKit fallback runtime.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `rules/rules.md`
- `rules/realtime-media.md`
- `rules/sdk-client-access.md`
- `rules/backend-api.md`
- `rules/architecture-docs.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_089_BACKEND_MEDIA_CONTROL_PLANE_IMPLEMENTATION.md`
- `packages/app-core/src/contracts/media-provider.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/livekit-client-adapter.tsx`
- channel media entry page
- direct conversation media entry page

## Files Changed

Added:
- `src/lib/shared/features/media/media-room-entry.ts`
- `src/lib/shared/features/media/use-media-room-controller.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_090_CLIENT_MEDIA_CONTROLLER_BOUNDARY.md`

Changed:
- `src/lib/shared/features/media-room.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Implementation Summary

Entry mapping:
- channel media entries now map to app-core `MediaRoomScope` with `{ kind: 'channel', serverId, channelId }`
- private call entries now map to app-core `MediaRoomScope` with `{ kind: 'conversation', serverId, conversationId }`
- channel mode is `persistent-channel`
- private call mode is `private-call`
- desired state preserves current entry behavior:
  - channel `AUDIO`: audio desired, video not desired
  - channel `VIDEO`: audio and video desired
  - private video: audio and video desired

Controller/hook:
- `useMediaRoomController` attempts backend `joinRoom` with scope, mode, and desired state.
- current `getLiveKitToken` remains the active token path for `LiveKitClientAdapter`.
- if backend control-plane join fails, the hook logs the failure and keeps the LiveKit fallback path active.
- if the old LiveKit token request fails but the transitional backend join returned provider access, the hook can use that provider token as a last-resort transitional token.
- `leaveRoom` is called on LiveKit leave when a backend participant session exists, without blocking the existing redirect behavior.

Compatibility:
- `LiveKitClientAdapter` remains the active provider UI.
- current route leave redirects are unchanged.
- no media stack dependencies, infra, env, backend API, or removing LiveKit changes were made.

## Acceptance Result

Pass:
- channel/private scopes are built at the client route boundary.
- backend control-plane `joinRoom` and `leaveRoom` can be invoked through the client controller boundary.
- current `getLiveKitToken` fallback remains compatible and is still the primary token source for the active LiveKit UI path.
- route leave behavior remains unchanged and control-plane leave is fire-and-forget.

Review:
- authenticated browser/device runtime smoke was not executed in this segment.
- the controller currently calls `joinRoom` opportunistically while continuing to depend on LiveKit for the rendered provider path.
- backend control-plane session state remains the in-process skeleton from Segment 089.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `local-mediasoup-dependency-prototype`

Reason:
- the client can now map route entries to vendor-neutral media scopes and can invoke backend control-plane commands while preserving LiveKit fallback, so the next planned step is the first local-only provider prototype behind the established boundaries.

## Verification Performed

Verification performed:
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- `bun.cmd run typecheck:api` passed.
- `git diff --check` passed.
- `rg -n "mediasoup|coturn" apps packages src package.json bun.lock` returned no matches.
