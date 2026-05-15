# SEGMENT BRIEF 109. Private SFU Physical Camera TURN QA

Branch:
- `wave/stage8-private-sfu-physical-camera-turn-qa`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-physical-camera-turn-qa`

## Goal

Close or honestly defer the remaining physical device and TURN QA before deciding on SFU screen-share and broader small-room/channel readiness.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only.
- no broad small-room/channel replacement was started.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.

## Hardware Check

Physical camera QA:
- status: `deferred / no camera hardware available`
- local Windows device checks did not find an active camera device:
  - `Get-PnpDevice -Class Camera -Status OK`
  - `Get-PnpDevice -Class Media -Status OK | Where-Object { $_.FriendlyName -match 'camera|webcam|video|integrated|usb' }`
- physical camera pass is intentionally not marked because this segment did not have real camera hardware.

No-camera audio-only fallback:
- status: `pass / preserved`
- the no-camera path remains the current physical-device fallback for this machine.

## TURN QA

Local TURN runtime:
- local-only Docker coturn was started from `infra/coturn/docker-compose.local.yml`.
- local TURN secret was shell-only and not written to repo:
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-dev-turn-secret-109`
- API was restarted locally with:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-dev-turn-secret-109`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`
- web was started locally on port `3001`.

TURN audio-only result:
- status: `review / local TURN relay audio-only smoke passed; physical operator audio signoff not separately executed`
- command used:
  - `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera PRIVATE_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:private-sfu`
- result:
  - passed with two authenticated private SFU participants.
  - relay mode used `sfuTransport=turn`.
  - simulated missing-camera fallback stayed audio-only.
  - both participants reached the expected guarded smoke assertions.
- caveat:
  - this is not marked as full physical operator TURN signoff because the segment did not include a human listening check over TURN with real microphone capture.

Direct no-camera fallback rerun:
- status: `pass`
- command used:
  - `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
- result:
  - passed.

## Handoff

Physical camera result:
- `deferred / no camera hardware available`

TURN physical/audio-only result:
- `review / local TURN relay audio-only smoke passed; physical operator audio signoff not separately executed`

No-camera fallback result:
- `pass / preserved`

LiveKit fallback/default:
- `pass / preserved`

Remaining blockers before small-room/channel replacement:
- physical camera QA on a machine with real camera hardware.
- optional human-operated TURN audio signoff with real microphone capture if release confidence requires it.
- SFU screen-share implementation or explicit MVP deferral decision.
- broader small-room/channel load readiness remains unstarted.

Recommended next segment:
- `private-sfu-screen-share-mvp-decision`

Reason:
- no-camera fallback, reconnect/restart, and local TURN relay smoke are now covered; the next decision gate is whether SFU screen-share is implemented for MVP or explicitly deferred while LiveKit remains fallback/default.

## Verification Performed

Commands:
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera PRIVATE_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
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
