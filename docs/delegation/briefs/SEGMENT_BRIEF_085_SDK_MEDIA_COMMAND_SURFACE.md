# SEGMENT BRIEF 085. SDK Media Command Surface

Branch:
- `wave/stage8-sdk-media-command-surface`

Segment:
- `sdk-media-command-surface`

## Goal

Add a future SDK media command surface on top of the Stage 8 app-core media contracts without switching the current runtime away from `getLiveKitToken`.

This segment changes only SDK action types/functions and roadmap docs. It does not change web/runtime usage, `apps/api`, app-core contracts, dependencies, env, infra, or the current microphone/media behavior.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_084_APP_CORE_MEDIA_CONTRACTS_CODE.md`
- `packages/app-core/src/contracts/media-provider.ts`
- `packages/sdk/src/actions/media.ts`
- `packages/sdk/src/actions/index.ts` (not present)
- `packages/sdk/src/index.ts` (not present)

## Files Changed

Changed:
- `packages/sdk/src/actions/media.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_085_SDK_MEDIA_COMMAND_SURFACE.md`

No SDK barrel files were changed because the repo currently imports SDK actions through direct module paths such as `@sdk/actions/media`, and `packages/sdk/src/actions/index.ts` / `packages/sdk/src/index.ts` are not present.

## SDK Exports Added

Future REST command actions:
- `resolveRoomAccess`
- `joinRoom`
- `leaveRoom`
- `closeRoom`

Future signaling/control command actions:
- `updateDesiredMediaState`
- `publishTrack`
- `unpublishTrack`
- `startScreenShare`
- `stopScreenShare`
- `subscribeToTrack`
- `unsubscribeFromTrack`
- `beginReconnect`
- `resumeSession`

Response and envelope types:
- `ResolveRoomAccessResponse`
- `JoinRoomResponse`
- `LeaveRoomResponse`
- `CloseRoomResponse`
- `MediaCommandAcknowledgement`
- `MediaStateCommandResponse`
- `MediaTrackCommandResponse`
- `MediaReconnectCommandResponse`
- `MediaSignalingCommandName`
- `MediaSignalingCommandPayloadMap`
- `MediaSignalingCommandResponseMap`
- `MediaSignalingCommandEnvelope`

Error normalization:
- `MediaActionError.mediaError`
- `normalizeMediaError`

## Compatibility Notes

Current runtime compatibility:
- `getLiveKitToken` is still exported from `packages/sdk/src/actions/media.ts`.
- `getLiveKitToken` still calls `GET /api/media/livekit-token`.
- `LiveKitTokenRequest` remains `{ room, username }`.
- `LiveKitTokenResponse` remains `{ token }`.
- current `MediaRoom` imports are unchanged.
- no UI code was connected to the new command surface.

Future control-plane status:
- the new command actions are typed SDK surface for future backend ownership.
- REST command paths are provisional until `backend-livekit-adapter-containment` and later media control-plane implementation decide exact route names.
- signaling-style commands currently use a typed command envelope and are not wired to a realtime client yet.

## Boundary Result

Pass:
- SDK now exposes typed future media commands for resolve, join, leave, close, desired state, publish/unpublish, screen share, subscribe/unsubscribe, reconnect, and resume.
- command payloads use app-core media contract types where available.
- media errors normalize into a `MediaError`-compatible shape while preserving the existing `MediaActionError` behavior.
- the active token path and product behavior are unchanged.

Review:
- backend adapter containment should decide how the current token endpoint maps into provider access metadata.
- later control-plane implementation should confirm exact REST route names and whether signaling commands stay HTTP-envelope based or move to a realtime client wrapper.

Block:
- new command actions should not be wired into UI until backend control-plane endpoints/gateway exist.
- runtime replacement still requires backend and client adapter containment plus parity smoke.

Overall:
- `pass`

## Recommended Next Segment

Recommended next segment:
- `backend-livekit-adapter-containment`

Reason:
- SDK now has a typed future command surface, so the next step is containing the current backend token generation behind an adapter while preserving `/api/media/livekit-token`.

## Verification Performed

Verification performed:
- `git diff --check` passed.
- `rg -n "mediasoup|coturn" packages/sdk packages/app-core src apps package.json bun.lock` returned no matches.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
