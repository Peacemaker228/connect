# SEGMENT BRIEF 087. Client LiveKit Adapter Containment

Branch:
- `wave/stage8-client-livekit-adapter-containment`

Segment:
- `client-livekit-adapter-containment`

## Goal

Isolate current client-side LiveKit imports, components, styles, runtime objects, and device handling behind a client adapter boundary while preserving `MediaRoom` behavior.

This segment keeps the current `getLiveKitToken` flow and does not remove LiveKit, change backend/API/SDK contracts, add media dependencies, change env/infra/routes, replace runtime behavior, or fix the current microphone/media symptom.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_086_BACKEND_LIVEKIT_ADAPTER_CONTAINMENT.md`
- `src/lib/shared/features/media-room.tsx`

## Files Changed

Changed:
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/livekit-client-adapter.tsx`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_087_CLIENT_LIVEKIT_ADAPTER_CONTAINMENT.md`

## Client Boundary Added

New client adapter:
- `LiveKitClientAdapter`

Adapter-owned LiveKit surface:
- `@livekit/components-react`
- `@livekit/components-styles`
- `livekit-client`
- `LiveKitRoom`
- `VideoConference`
- `Room`
- `MediaDeviceFailure`
- `.lk-disconnect-button` leave detection
- preferred microphone/camera device fallback
- media device failure toast mapping
- LiveKit room connection, disconnection, and media device callbacks

`MediaRoom` now owns only the feature-level entry concerns:
- profile lookup
- server/general text channel lookup
- current `getLiveKitToken({ room: chatId, username })` fetch
- loading state while token is absent
- route leave redirect callback
- passing requested audio/video intent into the adapter

## Compatibility Notes

Preserved current behavior:
- channel `AUDIO` still requests microphone only.
- channel `VIDEO` still requests microphone and camera.
- private video mode still passes audio and video intent.
- current `getLiveKitToken` path remains active.
- `NEXT_PUBLIC_LIVEKIT_URL` is still used by the LiveKit runtime path.
- preferred device fallback is preserved.
- user-visible device error toasts are preserved.
- explicit disconnect button leave redirect is preserved.
- LiveKit fallback remains active.

No behavior changes:
- no backend code changed.
- no SDK contract changed.
- no route changed.
- no dependency/env/infra/deploy change was made.
- no media runtime replacement was introduced.

## Boundary Result

Pass:
- feature-level `MediaRoom` no longer imports LiveKit components, styles, `Room`, or `MediaDeviceFailure` directly.
- LiveKit-specific client runtime details are isolated in `LiveKitClientAdapter`.
- current token flow and leave redirect behavior are preserved.
- no runtime replacement occurred.

Review:
- `MediaRoom` still calls `getLiveKitToken` because the current compatibility token flow remains active until later control-plane/client-controller segments.
- `LiveKitClientAdapter` is still the active fallback/runtime path and should be covered by parity smoke before deeper client refactors.

Block:
- no UI should switch to the new SDK media command surface until backend control-plane endpoints/gateway exist.
- no removing LiveKit should happen before parity smoke passes.

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `livekit-parity-smoke`

Reason:
- backend and client LiveKit containment are now in place; the next step is verifying that current channel/private media behavior still works before control-plane implementation continues.

## Verification Performed

Verification performed:
- `git diff --check` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- `rg -n "livekit|LiveKit|@livekit" src packages apps --glob "*.ts" --glob "*.tsx"` shows active LiveKit references contained in the SDK token action, backend adapter, and new client adapter, with `MediaRoom` still retaining the transitional `getLiveKitToken` call.
