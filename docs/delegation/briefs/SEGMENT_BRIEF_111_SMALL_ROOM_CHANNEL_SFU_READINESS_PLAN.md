# SEGMENT BRIEF 111. Small-Room Channel SFU Readiness Plan

Branch:
- `wave/stage8-small-room-channel-sfu-readiness-plan`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `small-room-channel-sfu-readiness-plan`

## Goal

Define readiness for controlled small-room/channel SFU expansion without switching runtime defaults.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit by default.
- private SFU remains explicit-gated to non-production conversation routes only until a later implementation segment changes that gate.
- no broad small-room/channel replacement was started.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no runtime implementation code was written in this planning segment.

## Current Comparison

Private SFU path already proven:
- explicit non-production conversation gate.
- backend-resolved `roomId` and `participantSessionId`.
- authenticated mediasoup transport create/connect/produce/consume.
- SSE producer lifecycle discovery.
- producer/consumer cleanup on close/leave/restart.
- two-user direct smoke.
- local TURN relay smoke.
- no-camera audio-only fallback.
- browser offline/restore status recovery.

Channel requirements not yet implemented:
- channel gate must be separate from private call gate and remain non-production explicit-only.
- `AUDIO` channels must publish audio and reject/avoid camera publishing.
- `VIDEO` channels must publish audio+video where hardware exists, while no-camera behavior must remain graceful.
- channel rooms are persistent and can have more than two participants.
- remote rendering must handle N participants, not just the current private-call single remote video/audio presentation.
- leave behavior must preserve the current channel/server redirect semantics.
- channel permissions must keep TEXT channels excluded and respect membership/moderator boundaries.

## Readiness Decision

Readiness status:
- `ready-to-implement-gated-channel`

Scope qualifier:
- ready only for a controlled, non-production, explicit-gated channel SFU pilot.
- first implementation should be `AUDIO` channel first.
- channel `VIDEO` and small-room video layout/load should follow only after the audio pilot passes lifecycle and multi-participant smoke.

Why this is ready:
- backend media access already resolves `channel` scope and rejects TEXT channels.
- channel media entries already encode `AUDIO` versus `VIDEO` desired state.
- SFU transport, producer, consumer, lifecycle, no-camera fallback, TURN, restart, stale cleanup, and network interruption have local proof on the private path.
- LiveKit remains the default/fallback, so a gated channel pilot can be rolled back by removing the explicit query/env gate.

Why this is not ready for broad replacement:
- mediasoup prototype state remains process-local.
- channel multi-participant load is unproven.
- current SFU UI is private-call shaped and does not provide a production multi-user video grid.
- physical camera QA remains deferred on this machine.
- physical/human TURN audio signoff remains review-only.
- SFU screen-share is explicitly deferred for MVP.

## Proposed Gate Strategy

Future implementation gate:
- channel routes only.
- non-production only.
- explicit query required, for example:
  - `?mediaProvider=sfu&sfuChannel=true`
  - or `?sfu=true&sfuChannel=true`
- optional relay/capture controls should reuse the existing private SFU query style:
  - `sfuTransport=turn` or `sfuIce=relay`
  - `sfuCapture=real`
  - `sfuSimulateMissingCamera=true` for smoke only

Default behavior:
- ordinary channel `AUDIO` remains LiveKit.
- ordinary channel `VIDEO` remains LiveKit.
- ordinary private `?video=true` remains LiveKit.
- no channel route should enter SFU from `?video=true` alone.

Implementation shape:
- extract or introduce a reusable gated SFU room adapter instead of forcing channel behavior through `SfuPrivateCallAdapter`.
- keep room/session scope backend-resolved.
- keep producer/consumer cleanup and stale session cleanup.
- keep leave redirect behavior owned by `MediaRoom`.

## Prerequisites Before Implementation

Required before channel SFU pilot implementation:
- define a channel-specific SFU gate in `MediaRoom` without changing default channel behavior.
- reuse or extract SFU room lifecycle from private adapter with no private-route assumptions in status text, test ids, or leave behavior.
- enforce channel `AUDIO` desired state as audio-only.
- ensure `VIDEO` channel behavior is not enabled until remote video layout/rendering expectations are defined.
- add channel browser smoke setup for multiple authenticated users joining the same server/channel.
- keep LiveKit fallback assertions in every smoke.

Required before broad small-room/channel replacement:
- pass direct and TURN channel `AUDIO` multi-user smoke.
- pass leave/rejoin/restart/stale cleanup with at least three authenticated participants.
- pass network interruption/restore or restart recovery in a channel room.
- define and pass channel `VIDEO` rendering expectations.
- decide whether physical camera QA and human TURN signoff are release blockers or accepted review items.
- keep SFU screen-share deferred with LiveKit fallback, or implement screen-share in a separate segment before any default switch that requires parity.
- decide how process-local prototype state is handled before production or multi-process deployment.

## Smoke And Load Matrix

Channel `AUDIO` pilot:
- Direct, two users, synthetic capture: pass required.
- Direct, three users, synthetic capture: pass required.
- Direct, no-camera `sfuCapture=real` audio-only: pass/review required where hardware allows.
- TURN relay, two users: pass required if local coturn env is available, otherwise explicit blocked/review.
- Leave/rejoin one participant twice: no stale producers, no inflated remote counts.
- Restart one participant: all remaining participants recover expected remote producer counts.
- Browser offline/restore one participant: connected or restart recovery documented.
- Ordinary channel `AUDIO` without gate: LiveKit assertion required.

Channel `VIDEO` follow-up:
- Direct, two users, fake-device real capture: pass required before any video pilot claim.
- Direct, three users, fake-device real capture: review/pass after remote video layout exists.
- No-camera real capture: audio-only fallback must remain pass/review.
- TURN relay video: pass/review after audio TURN pilot is stable.
- Ordinary channel `VIDEO` without gate: LiveKit assertion required.

Load/readiness baseline:
- start with 3 participants.
- expand to 5 participants only after 3-participant direct and TURN cases are stable.
- record producer/consumer counts per participant.
- verify cleanup after all participants leave.

## Risks

Known risks:
- process-local mediasoup/signaling state is acceptable for local MVP, but not production-safe or multi-process-safe.
- multi-user audio mixing/rendering can expose autoplay, gain, and cleanup issues that two-user private smoke will not catch.
- channel `VIDEO` requires remote layout decisions that the private adapter does not solve.
- stale sessions can be more visible in persistent rooms; leave/rejoin cleanup must be part of the first channel pilot.
- permission behavior must keep TEXT channels excluded and prevent AUDIO channels from publishing camera tracks.
- screen-share remains deferred and depends on LiveKit fallback until a future SFU screen-share segment.
- physical camera QA remains deferred on machines without camera hardware.
- physical/human TURN signoff remains review unless explicitly rerun by an operator.

## Handoff

Readiness decision:
- `ready-to-implement-gated-channel`

Proposed first implementation segment:
- `gated-channel-audio-sfu-pilot`

Reason:
- channel audio is the narrowest safe expansion from private SFU: no video grid requirement, no screen-share requirement, and a clear multi-user lifecycle/load matrix.

Do not implement yet:
- channel `VIDEO` SFU default.
- ordinary private SFU default.
- broad small-room/channel replacement.
- production media infra.

LiveKit fallback/default:
- `pass / preserved`

Remaining blockers before broad replacement:
- gated channel `AUDIO` implementation and smoke.
- channel `VIDEO` remote layout/rendering and smoke.
- physical camera QA on camera-equipped hardware.
- optional human-operated TURN signoff with real microphone capture.
- process-local state production/multi-process decision.
- SFU screen-share remains deferred unless later parity/default-switch scope requires it.

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
