# SEGMENT BRIEF 107. Private SFU Operator No-Camera Fallback Rerun

Branch:
- `wave/stage8-private-sfu-operator-no-camera-fallback-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-operator-no-camera-fallback-rerun`

## Goal

Record the operator rerun on a real no-camera machine after adding the gated private SFU audio-only fallback.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only.
- no broad small-room/channel replacement was started.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.

## Operator Rerun Status

No-camera physical fallback:
- status: `pass / physical no-camera audio-only fallback confirmed`
- evidence: operator reran two authenticated private SFU clients with `sfuCapture=real` on the no-camera machine and confirmed real voice audio in both directions.
- both clients used the real-capture path; the earlier one-sided hum was explained by one client still using synthetic capture, which intentionally produces a generated test tone.
- the no-camera fallback continued the call audio-only instead of failing the whole SFU session.

## Follow-up From Operator Observation

Operator observation:
- `Remote producers` inflated to values such as `3`, `4`, and `9`.
- one participant could hear another participant from a stale SFU producer even when the current visible controls did not explain it.
- the same conversation showed a mix of `synthetic` and `real` capture sessions.

Fix applied in this segment:
- a new media join now marks older joined sessions for the same room identity as `left`.
- mediasoup producer discovery now ignores and cleans producer state for sessions that are no longer joined.
- leaving a media room now closes scoped mediasoup producers, consumers, and transports for that participant session.

Verification:
- two consecutive private SFU browser smoke runs passed on the same API process without inflated remote producer counts.
- a subsequent `real-missing-camera` smoke also passed on the same API process.
- this addresses stale producer subscription/random audio caused by prior sessions in the same conversation room.

Expected operator evidence:
- two authenticated browser users opened a private SFU conversation route with:
  - `?video=true&mediaProvider=sfu&sfuCapture=real`
- both users reached `connected`.
- both users saw the camera-missing audio-only fallback status.
- both users heard real microphone audio from the other participant after both clients were set to `sfuCapture=real`.
- producer and consumer ids were present on both users.
- ordinary private `?video=true` remained LiveKit.
- channel `AUDIO` and `VIDEO` remained LiveKit.

Control notes:
- Segment 106 automated simulated no-camera smoke already covered microphone toggle behavior and disabled camera control.
- this physical rerun confirms the operator-critical part that could not be automated on the no-camera machine: real audio-only capture and bidirectional remote playback.

Current automated baseline:
- Segment 106 direct synthetic smoke: `pass`.
- Segment 106 direct real audio+video fake-device smoke: `pass`.
- Segment 106 direct simulated no-camera fallback smoke: `pass`.
- Segment 106 LiveKit fallback/default: `pass / preserved`.
- Segment 107 stale producer lifecycle rerun: `pass`.

## Result

No-camera physical fallback result:
- `pass / physical no-camera audio-only fallback confirmed`

LiveKit fallback result:
- `pass / preserved`

Remaining blockers:
- network interruption reconnect/resume QA.
- physical camera QA on a machine with real camera hardware.
- manual TURN relay with physical devices, if required for release signoff.
- SFU screen-share implementation or explicit MVP deferral decision.

## Handoff

Manual no-camera result:
- `pass / two real-capture no-camera clients reached audio-only SFU voice in both directions`

LiveKit fallback result:
- `pass / preserved`

Recommended next segment:
- `private-sfu-network-interruption-reconnect-qa`

Reason:
- no-camera audio-only fallback is now confirmed by the operator; the next highest-risk parity gap is real network interruption reconnect/resume before any small-room/channel replacement.

## Verification Performed

This segment includes the operator rerun report plus a scoped backend lifecycle fix for stale mediasoup prototype state found during that rerun.

Commands:
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
