# SEGMENT BRIEF 104. Private SFU Device Controls Reconnect Parity

Branch:
- `wave/stage8-private-sfu-device-controls-reconnect-parity`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-device-controls-reconnect-parity`

## Goal

Close narrow gated private SFU parity gaps before any small-room/channel replacement work.

## What Changed

Private SFU capture and controls:
- added `sfuCapture=real` for the explicit non-production private SFU gate.
- synthetic audio remains the default capture mode for repeatable smoke.
- real capture mode uses `navigator.mediaDevices.getUserMedia` for requested audio/video.
- private SFU now produces all captured local tracks, so real audio+video capture can publish two producers.
- private SFU now renders local/remote video elements when video tracks exist.
- added basic gated private SFU controls:
  - microphone mute/unmute toggles local audio track `enabled`.
  - camera stop/start toggles local video track `enabled`.
  - existing restart button remains the local restart/reconnect control.

Browser smoke:
- `PRIVATE_SFU_SMOKE_CAPTURE=real` now opens the gated private SFU path with `sfuCapture=real`.
- real-capture smoke expects two remote producers per participant.
- browser smoke now exercises the restart button and verifies the remote producer count recovers.
- real-capture smoke toggles microphone and camera controls.
- Playwright Chromium now uses fake camera/microphone flags and permissions so the real-capture path can be tested without manual hardware prompts.

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only.
- TURN relay remains explicit through `sfuTransport=turn` / `sfuIce=relay`.
- no production infra/env/nginx/firewall/deploy changes were made.

## Smoke Env Used

Direct synthetic profile:
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_HOST=localhost`
- `PRIVATE_SFU_SMOKE_API_PORT=4000`
- `PRIVATE_SFU_SMOKE_WEB_PORT=3001`
- command: `bun.cmd run test:browser:private-sfu`

Direct real-capture profile:
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_HOST=localhost`
- `PRIVATE_SFU_SMOKE_API_PORT=4000`
- `PRIVATE_SFU_SMOKE_WEB_PORT=3001`
- `PRIVATE_SFU_SMOKE_CAPTURE=real`
- command: `bun.cmd run test:browser:private-sfu`

TURN synthetic profile:
- local coturn: `docker compose -f infra/coturn/docker-compose.local.yml up -d`
- API env:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-stage8-turn-secret`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- smoke env:
  - `PRIVATE_SFU_SMOKE_TRANSPORT=turn`
- command: `bun.cmd run test:browser:private-sfu`

## Results

Direct gated private SFU synthetic smoke:
- status: `pass`
- both authenticated participants reached `connected`.
- each participant observed one remote producer.
- restart control was clicked and the remote producer count recovered.
- ordinary private `?video=true` stayed off the SFU provider.
- private leave redirect remained `/servers/:serverId/conversations/:memberId`.

Direct gated private SFU real-capture smoke:
- status: `pass / browser fake-device profile`
- both authenticated participants reached `connected`.
- each participant observed two remote producers.
- microphone mute/unmute control toggled successfully.
- camera stop/start control toggled successfully.
- this proves the browser capture/control path with Chromium fake devices, not physical hardware quality.

TURN gated private SFU synthetic smoke:
- status: `pass`
- local Docker coturn was available.
- relay-only query mode passed.
- restart assertion also passed under TURN mode.

LiveKit fallback:
- status: `pass`
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit by route/provider boundary.
- backend media provider binding remains LiveKit.

## Parity Status

Device controls/capture:
- status: `pass / review`
- `pass` for automated Chromium fake-device capture and local audio/video controls in the gated private SFU path.
- `review` for physical microphone/camera device quality, OS permission UX, and device switching on real hardware.

Reconnect/restart:
- status: `pass / review`
- `pass` for local user-triggered private SFU restart: cleanup, recreate transports/producers/consumers, and remote producer recovery.
- `review` for network interruption reconnect/resume because that was not simulated in this segment.

Screen-share:
- status: `deferred`
- unchanged from Segment 103; LiveKit fallback still owns existing screen-share behavior.

Small-room/channel readiness:
- status: `hold`
- no broad replacement started.
- small-room/channel route lifecycle and load smoke still need their own scoped segment.

## Handoff

What changed:
- added explicit real-capture mode for gated private SFU.
- added basic private SFU mic/camera controls.
- extended browser smoke to cover restart and optional real capture controls.
- kept LiveKit default/fallback intact.

Direct result:
- `pass`

TURN result:
- `pass`

LiveKit fallback result:
- `pass`

Device controls/capture status:
- `pass / review`

Reconnect status:
- `pass / review`

Blockers before small-room/channel replacement:
- physical-device manual QA for microphone/camera permissions and quality.
- network interruption reconnect/resume smoke.
- screen-share SFU lifecycle or explicit MVP deferral decision.
- small-room/channel room/session/lifecycle design.
- small-room/channel load smoke.
- process-local prototype state remains a production rollout blocker.

Recommended next segment:
- `private-sfu-manual-device-reconnect-qa`

Reason:
- the automated fake-device path is now covered; the remaining parity risk is manual physical-device and network interruption behavior before broader replacement work.

## Verification Performed

Commands:
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:private-sfu`
- `git diff --check`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
