# SEGMENT BRIEF 110. Private SFU Screen Share MVP Decision

Branch:
- `wave/stage8-private-sfu-screen-share-mvp-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-screen-share-mvp-decision`

## Goal

Make the MVP decision for SFU screen-share: implement now or explicitly defer while preserving LiveKit fallback/default behavior.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only.
- no broad small-room/channel replacement was started.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime code was written in this decision segment.

## Current Inventory

LiveKit path:
- `LiveKitClientAdapter` renders `LiveKitRoom` with `VideoConference`.
- `VideoConference` remains the current owner of vendor-provided call controls, including screen-share UI/runtime where the LiveKit component supports it.
- ordinary private `?video=true` calls and all channel audio/video routes continue to use LiveKit by default, so the existing screen-share fallback/default remains available there.

Gated private SFU path:
- `SfuPrivateCallAdapter` has explicit controls only for microphone, camera, restart, and leave.
- SFU capture currently uses synthetic audio or `navigator.mediaDevices.getUserMedia(...)`.
- SFU capture does not call `navigator.mediaDevices.getDisplayMedia(...)`.
- SFU producer discovery/consume dedupes by `participantSessionId + kind`, not by track source, which is insufficient for camera video plus screen video from the same participant.
- backend/media contracts and SDK already contain screen-share vocabulary, but the active mediasoup prototype producer lifecycle does not yet model screen source, single active presenter policy, or screen-share start/stop events.

## Decision

Screen-share status:
- `defer-for-MVP`

Rationale:
- the current controlled SFU path is still gated to private conversations and is proving audio/video, lifecycle cleanup, reconnect, no-camera fallback, and TURN behavior.
- implementing SFU screen-share now would be broader than a decision segment and would require new runtime behavior across client capture, backend producer metadata, signaling events, rendering, controls, cleanup, and browser smoke.
- LiveKit remains the default/fallback for ordinary private calls and channel audio/video routes, preserving the existing screen-share path for users who do not opt into the non-production SFU gate.
- deferring screen-share keeps the next work focused on small-room/channel readiness without weakening rollback.

## Minimum Future SFU Screen-Share Scope

A later implementation segment should include:
- client `getDisplayMedia` capture under the explicit private SFU gate.
- separate screen producer metadata using track source, not only track kind.
- backend producer discovery and SSE events that carry source `screen` versus `camera`.
- single active share policy using the existing app-core `MediaScreenSharePolicy` vocabulary.
- screen-share stop cleanup on browser track `ended`, manual stop, restart, leave, and stale session cleanup.
- remote screen rendering distinct from camera video.
- direct and TURN browser smoke for start/stop, remote render, cleanup, restart, and leave.
- preservation of LiveKit fallback/default until SFU screen-share passes parity.

## Handoff

Decision:
- `defer-for-MVP`

LiveKit fallback impact:
- `pass / preserved`
- ordinary private calls and channel audio/video routes remain LiveKit and continue to keep LiveKit `VideoConference` screen-share behavior available.

SFU impact:
- gated private SFU remains audio/video only for MVP.
- screen-share is explicitly not a requirement for the current gated private SFU MVP decision.

Remaining blockers before small-room/channel replacement:
- physical camera QA on camera-equipped hardware remains deferred until hardware is available.
- optional human-operated TURN audio signoff with real microphone capture remains review-only if release confidence requires it.
- broader small-room/channel load/readiness remains unstarted.
- future SFU screen-share parity is deferred until after MVP readiness or before any later default switch that requires screen-share parity.

Recommended next segment:
- `small-room-channel-sfu-readiness-plan`

Reason:
- screen-share is now explicitly deferred with LiveKit fallback preserved; the next decision gate is whether the current private SFU proof is sufficient to plan small-room/channel readiness without switching default routes.

## Verification Performed

Commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Results:
- all required verification commands passed.
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
