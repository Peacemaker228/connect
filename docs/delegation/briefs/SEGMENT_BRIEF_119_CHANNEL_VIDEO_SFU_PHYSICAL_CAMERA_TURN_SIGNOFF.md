# SEGMENT BRIEF 119. Channel VIDEO SFU Physical Camera TURN Signoff

Branch:
- `wave/stage8-channel-video-sfu-physical-camera-turn-signoff`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-physical-camera-turn-signoff`

## Goal

Close the physical camera and optional TURN signoff for gated channel `VIDEO` SFU without switching channel `VIDEO` or channel `AUDIO` to SFU by default.

## Scope Boundary

Changed:
- documented physical camera and TURN signoff results.
- updated Wave 33 and Stage 8 status.

Preserved:
- channel `VIDEO` SFU remains non-production and full explicit-gated only.
- channel `AUDIO` SFU remains non-production and explicit-gated only.
- ordinary channel `VIDEO` without the full gate remains LiveKit.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.
- LiveKit fallback/default was not removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime implementation was added.
- no production/multi-process media scope was added.

## Smoke Env

Local services:
- Postgres: Docker `connect-postgres-validation` on `localhost:5433`.
- coturn: Docker `connect-coturn-local` on `127.0.0.1:3478`.
- API: `http://localhost:4000/api`.
- Web: `http://localhost:3001`.

Local-only API env:
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=replace-with-random-local-secret`
- `LOCAL_TURN_TTL_SECONDS=600`

Physical camera:
- Android 13 phone exposed to Windows through Phone Link / Windows Virtual Camera.
- headed Chromium required for physical camera automation; headless real-device mode previously failed with `Local media capture failed: Not supported`.

## Result

Physical camera channel `VIDEO` result:
- `pass`

Command:
- `PLAYWRIGHT_REAL_MEDIA=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd x playwright test tests/browser/channel-video-sfu-smoke.spec.ts --project=chromium --headed`

Observed:
- two authenticated users joined the same channel `VIDEO` route through the full explicit SFU gate.
- both users reached `connected`.
- both users observed `Remote producers: 2`.
- both users rendered one remote video tile.
- local physical-camera capture was available through Windows Virtual Camera.
- restart recovery passed.
- leave/rejoin cleanup passed.
- no stale video tile or producer inflation was observed.

Physical camera TURN channel `VIDEO` result:
- `pass`

Command:
- `PLAYWRIGHT_REAL_MEDIA=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd x playwright test tests/browser/channel-video-sfu-smoke.spec.ts --project=chromium --headed`

Observed:
- the same two-user headed physical-camera channel `VIDEO` smoke passed in relay mode.
- coturn logs showed authenticated `ALLOCATE`, `CREATE_PERMISSION`, `CHANNEL_BIND`, relay usage, and allocation cleanup for peer `10.8.1.13`.
- restart recovery and leave/rejoin cleanup remained pass.
- no stale video tile or producer inflation was observed.

Private 1:1 camera observation:
- `pass / operator-supported`

Operator observation:
- Android 13 phone can be exposed through Phone Link / Windows as a camera if the browser permission is granted.

Automated headed confirmation:
- `PLAYWRIGHT_REAL_MEDIA=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_CAPTURE=real PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd x playwright test tests/browser/private-sfu-two-user-smoke.spec.ts --project=chromium --headed`
- result: `pass`
- both private SFU users reached `connected`.
- `Remote producers: 2` matched real audio+video capture.
- microphone and camera controls remained enabled.
- leave redirect remained preserved.

LiveKit fallback/default:
- `pass / preserved`
- ordinary channel `VIDEO` without full gate remains LiveKit.
- ordinary channel `AUDIO` without gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.

## Handoff

Physical camera status:
- `pass`
- scoped to two-user headed Windows Virtual Camera / Android 13 path.
- five-user channel `VIDEO` load remains fake-device based from Segment 118.

TURN physical status:
- `pass`
- scoped to two-user headed channel `VIDEO` SFU with `sfuTransport=turn`.

LiveKit fallback/default preservation:
- `pass / preserved`

Remaining blockers before any default-switch readiness decision:
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- SFU screen-share remains deferred.
- human subjective audio/video quality signoff remains optional if required before a product-facing rollout.
- a separate default-switch readiness decision must decide whether the fake-device five-user load plus two-user physical TURN signoff is enough for the next controlled gate.

Recommended next segment:
- `channel-sfu-default-switch-readiness-decision`

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
- `bun.cmd run test:browser:channel-video-sfu`
- headed physical camera channel `VIDEO` direct smoke with `PLAYWRIGHT_REAL_MEDIA=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- headed physical camera channel `VIDEO` TURN smoke with `PLAYWRIGHT_REAL_MEDIA=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`
- headed private SFU real-camera regression with `PLAYWRIGHT_REAL_MEDIA=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_CAPTURE=real`

Results:
- all verification commands passed.
- guarded browser scripts skipped safely without their smoke env flags.
- headed physical camera channel `VIDEO` direct smoke passed.
- headed physical camera channel `VIDEO` TURN smoke passed.
- headed private SFU real-camera regression passed.
