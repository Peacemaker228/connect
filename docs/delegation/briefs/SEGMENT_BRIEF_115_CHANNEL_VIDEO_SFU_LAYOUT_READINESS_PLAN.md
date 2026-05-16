# SEGMENT BRIEF 115. Channel VIDEO SFU Layout Readiness Plan

Branch:
- `wave/stage8-channel-video-sfu-layout-readiness-plan`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-layout-readiness-plan`

## Goal

Define readiness and the implementation plan for channel `VIDEO` SFU layout/rendering without enabling a runtime channel video SFU switch.

## Scope Boundary

Preserved:
- channel `VIDEO` SFU runtime was not enabled.
- ordinary channel `VIDEO` remains LiveKit.
- ordinary channel `AUDIO` remains LiveKit without the explicit channel SFU gate.
- gated channel `AUDIO` SFU behavior remains unchanged.
- ordinary private `?video=true` remains LiveKit.
- existing gated private SFU behavior remains unchanged.
- LiveKit fallback/default was not removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.

## Readiness Decision

Decision:
- `ready-to-implement-gated-channel-video`

Meaning:
- ready only for a narrow non-production explicit channel `VIDEO` SFU implementation segment.
- not ready for channel `VIDEO` default switch.
- not ready for broad small-room/channel replacement.
- not ready to claim screen-share parity on SFU.

Rationale:
- backend media access already resolves channel media rooms with scoped `roomId` and `participantSessionId`.
- channel `VIDEO` permissions allow `publishVideo`; channel `AUDIO` remains audio-only at the permission layer.
- mediasoup prototype router already includes VP8 video codec support.
- the browser SFU adapter can publish and consume both audio and video tracks.
- private SFU fake-device real capture proved audio+video publish/consume at the transport layer.
- channel `AUDIO` SFU has passed 2-user, 3-user, 5-user, TURN, restart, leave/rejoin, and offline/restore smoke under an explicit gate.

Current blockers to default or broad replacement:
- current SFU UI has only one remote video element and does not model a multi-participant video grid.
- producer discovery metadata is `participantSessionId + kind` only; it is enough for camera-only MVP but not source-aware enough for future screen-share.
- process-local mediasoup/signaling state remains a production and multi-process blocker.
- physical camera QA remains deferred until real camera hardware is available.
- SFU screen-share is intentionally deferred for MVP and remains covered by LiveKit fallback only.

## Current SFU Video Capability Inventory

Backend:
- `MediasoupPrototypeService` advertises `video/VP8`.
- producer and consumer endpoints accept `kind: video`.
- producer discovery snapshots include video producers.
- scoped room/session checks apply to transport connect, produce, consume, producer close, and consumer close.
- stale producer cleanup is tied to joined participant sessions.

Client:
- `SfuPrivateCallAdapter` can request real `getUserMedia({ audio, video })`.
- when real audio+video capture succeeds, all captured tracks are produced.
- when camera capture is missing and audio is available, the adapter can continue audio-only and report `Camera not found; continuing audio-only`.
- local preview supports one local video track.
- remote video rendering is currently one shared `remoteVideoRef` / `remoteVideoStreamRef`, which is not sufficient for a channel layout.
- remote consumer dedupe is currently keyed by `participantSessionId:kind`, which supports one camera video producer per participant but not multiple video sources per participant.

Channel gate today:
- channel `AUDIO` SFU opens only in non-production with explicit `?mediaProvider=sfu&sfuChannel=true` or `?sfu=true&sfuChannel=true`.
- channel `VIDEO` remains LiveKit even with `sfuChannel=true`.

## Proposed Channel VIDEO Gate

The implementation segment should use a stricter channel video gate than channel audio:
- route scope must be `channel`.
- channel route must request video.
- runtime must be non-production.
- provider must be explicit: `mediaProvider=sfu` or `sfu=true`.
- channel SFU must be explicit: `sfuChannel=true`.
- video pilot must be explicit: `sfuVideo=true`.

Recommended URLs:
- direct: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real`
- TURN relay: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real&sfuTransport=turn`

Required preservation:
- channel `AUDIO` SFU gate keeps its current behavior and does not require `sfuVideo=true`.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- ordinary channel `VIDEO` without the full video gate remains LiveKit.
- private calls keep their current private-only SFU gate and LiveKit default/fallback.

## Layout And Rendering Requirements

Participant media model:
- represent remote media by `participantSessionId`.
- maintain separate audio and video track state per remote participant.
- close and remove tracks when `producer.closed` is received.
- do not use a single global remote video stream for channel video.
- do not use `remoteProducerIds.length > 1` to decide whether remote video is active.

2 participants:
- local preview visible when a local camera track exists.
- one remote participant tile with remote camera video when available.
- if the remote participant is audio-only, show a stable audio-only placeholder.
- remote audio must remain audible.

3 participants:
- local preview plus two remote participant tiles.
- grid must keep stable aspect ratios and avoid layout shift as tracks arrive.
- tiles must survive restart and leave/rejoin without stale video or producer count inflation.

5 participants:
- local preview plus four remote participant tiles.
- responsive grid must fit desktop and smaller widths without text/control overlap.
- each participant should show one camera video tile or an audio-only placeholder.
- expected remote producer count for full audio+video capture is 8 per participant: four remote audio producers and four remote video producers.
- expected remote producer count for no-camera audio-only participants is 4 per participant.

Controls and status:
- microphone toggle remains enabled when an audio track exists.
- camera toggle is disabled when no local video track exists.
- restart should close old producers/consumers/transports before opening a new session path.
- leave should preserve the existing channel redirect behavior.

## Capture And No-Camera Behavior

Channel `VIDEO` SFU should use real capture for meaningful video smoke:
- `sfuCapture=real` is required for the initial channel video smoke.
- Chromium fake devices can be used for automated video smoke.
- synthetic capture remains useful for audio smoke but does not prove video rendering.

No-camera behavior:
- first request audio+video.
- if camera capture fails because the camera is missing and audio is requested, continue audio-only.
- show `Camera not found; continuing audio-only`.
- disable the camera control when no video track exists.
- still publish audio and consume remote producers.
- if neither microphone nor camera can be captured, show a clear failed reason and do not mark video QA pass.

## Smoke Matrix

Required before any channel `VIDEO` SFU pilot is marked pass:
- direct 2-user channel `VIDEO` with Chromium fake audio/video devices: pass.
- ordinary channel `VIDEO` without the full SFU video gate remains LiveKit: pass.
- ordinary channel `AUDIO` without the gate remains LiveKit: pass.
- gated channel `AUDIO` regression remains pass.
- gated private SFU regression remains pass.
- channel leave redirect remains the existing server/general text channel behavior: pass.

Required before considering broader channel video readiness:
- direct 3-user channel `VIDEO` fake-device smoke: pass.
- direct 5-user channel `VIDEO` fake-device baseline: pass or review with reason.
- leave/rejoin cleanup: no stale producer or tile inflation.
- restart recovery: producers/consumers recover to expected counts.
- offline/restore: pass, or manual restart recovery documented.
- no-camera real-capture fallback: audio-only continuation pass/review.

TURN matrix:
- 2-user TURN relay channel `VIDEO` fake-device smoke: pass/review if local coturn is available.
- 3-user TURN relay channel `VIDEO`: run after 2-user TURN is stable.
- if local coturn/env is unavailable, mark TURN as blocked with exact env reason.

Deferred:
- physical camera pass until camera hardware is available.
- human TURN listening signoff unless release confidence requires it.
- SFU screen-share, because Segment 110 deferred it for MVP.

## Risks And Blockers

Risks:
- autoplay: remote audio/video attachment must handle browser autoplay limits; audio controls or a user gesture recovery path may still be needed.
- video grid: current SFU adapter is private-call shaped and does not render one remote tile per participant.
- camera absence: many local QA machines may only prove audio-only fallback.
- source metadata: current producer metadata has no camera/screen source field; this is acceptable for camera-only MVP but blocks future screen-share parity.
- screen-share deferred: LiveKit fallback preserves screen-share only outside the explicit SFU gate.
- process-local state: current mediasoup/signaling state is not production/multi-process ready.
- load: 5-user video will raise CPU/browser resource pressure compared with audio-only smoke.

Blockers before any default switch:
- pass the gated channel `VIDEO` smoke matrix above.
- resolve or explicitly accept process-local state limits for the target environment.
- decide whether physical camera QA is required for the next release confidence gate.
- keep LiveKit fallback until channel video parity is proven and a later rollout segment explicitly changes defaults.

## Handoff

Readiness decision:
- `ready-to-implement-gated-channel-video`

Layout plan:
- implement a channel-capable SFU room adapter or extract reusable SFU room lifecycle from `SfuPrivateCallAdapter`.
- model remote participants by `participantSessionId`.
- render one remote video tile per participant, with audio-only placeholders.
- keep local preview and controls scoped to the local captured tracks.

Proposed gate strategy:
- non-production channel `VIDEO` only.
- explicit full gate: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true` or `?sfu=true&sfuChannel=true&sfuVideo=true`.
- use `sfuCapture=real` for video smoke and `sfuTransport=turn` for relay mode.

Recommended next segment:
- `gated-channel-video-sfu-layout-prototype`

Suggested next segment scope:
- add the explicit non-production channel `VIDEO` SFU gate.
- build or extract the participant-grid SFU rendering path.
- add guarded 2-user channel `VIDEO` browser smoke with fake audio/video capture.
- preserve channel `AUDIO` SFU behavior, ordinary LiveKit defaults, private SFU behavior, and leave redirects.

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
- `bun.cmd run test:browser:channel-audio-sfu`

Results:
- all verification commands passed.
- guarded browser scripts skipped safely without their smoke env flags.
