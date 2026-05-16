# SEGMENT BRIEF 118. Gated Channel VIDEO SFU 5-User Load Offline Smoke

Branch:
- `wave/stage8-gated-channel-video-sfu-5user-load-offline-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-video-sfu-5user-load-offline-smoke`

## Goal

Capture the five-user gated channel `VIDEO` SFU load baseline and explicit offline/restore smoke without switching channel `VIDEO` to SFU by default.

## Scope Boundary

Changed:
- extended `tests/browser/channel-video-sfu-smoke.spec.ts` with `CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1`.
- increased the guarded channel `VIDEO` smoke timeout to cover five users plus restart, offline/restore, leave/rejoin, fallback assertions, and cleanup checks.

Preserved:
- channel `VIDEO` SFU remains non-production and full explicit-gated only.
- ordinary channel `VIDEO` without the full gate remains LiveKit.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- channel `AUDIO` SFU behavior remains unchanged.
- ordinary private `?video=true` remains LiveKit.
- private SFU behavior remains unchanged.
- LiveKit fallback/default was not removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime implementation was added.

## Smoke Env

Local services:
- Postgres: Docker `connect-postgres-validation` on `localhost:5433`.
- API: `http://localhost:4000/api`.
- Web: `http://localhost:3001`.

Local-only API env:
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=replace-with-random-local-secret`
- `LOCAL_TURN_TTL_SECONDS=600`

Direct/offline command:
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=5 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Regression commands:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

## Result

5-user direct channel `VIDEO` result:
- `pass`

Expected:
- `Remote producers: 8` per participant.
- four remote video tiles per participant.

Observed:
- five authenticated users joined the same channel `VIDEO` route through the full explicit SFU gate.
- all users reached `connected`.
- all users observed `Remote producers: 8`.
- all users rendered four remote video tiles.
- local fake-camera previews were visible.
- restart recovery returned all users to `connected`, `Remote producers: 8`, and four remote video tiles.
- explicit offline/restore forced one browser context offline for 6 seconds and then restored it.
- after restore, all users returned to `connected`, `Remote producers: 8`, and four remote video tiles.
- one participant left to the server general text channel.
- remaining users dropped to `Remote producers: 6` and three remote video tiles.
- the participant rejoined the gated channel route.
- all users returned to `Remote producers: 8` and four remote video tiles.
- no stale video tile or producer inflation was observed.
- ordinary channel `VIDEO` without the full gate remained off the SFU UI.
- ordinary channel `AUDIO` without the gate remained off the SFU UI.
- no-camera fallback remained connected audio-only.

TURN channel `VIDEO` result:
- `not rerun / previous proof retained`

Reason:
- five-user TURN was optional for this segment.
- Segment 117 remains the current relay proof: three-user channel `VIDEO` TURN passed through local Docker coturn with restart, leave/rejoin, producer count, and video tile assertions.

Regression results:
- channel `AUDIO` SFU regression: `pass`.
- private SFU regression: `pass`.

## Handoff

5-user result:
- `pass`

Offline/restore result:
- `pass`

Restart/leave-rejoin result:
- `pass`

Stale tile/producer cleanup result:
- `pass`
- no stale remote video tiles or inflated producer counts were observed after restart, offline/restore, or leave/rejoin.

LiveKit fallback result:
- `pass / preserved`
- ordinary channel `VIDEO` without full gate remains LiveKit.
- ordinary channel `AUDIO` without gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.

Remaining blockers:
- physical camera QA remains deferred on camera-equipped hardware.
- optional human-operated TURN signoff with real microphone/camera remains review-only.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- SFU screen-share remains deferred.
- no channel default switch should happen until a separate readiness/default-switch decision segment accepts those constraints.

Recommended next segment:
- `channel-video-sfu-physical-camera-turn-signoff`

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
- guarded five-user direct channel `VIDEO` smoke with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=5 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1`
- guarded channel `AUDIO` regression with `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- guarded private SFU regression with `PRIVATE_SFU_BROWSER_SMOKE=1`

Results:
- all verification commands passed.
- guarded browser scripts skipped safely without their smoke env flags.
- guarded five-user direct/offline channel `VIDEO` smoke passed.
- guarded channel `AUDIO` regression passed.
- guarded private SFU regression passed.
