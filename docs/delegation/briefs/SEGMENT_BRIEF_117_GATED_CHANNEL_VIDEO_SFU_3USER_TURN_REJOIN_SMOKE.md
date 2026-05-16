# SEGMENT BRIEF 117. Gated Channel VIDEO SFU 3-User TURN Rejoin Smoke

Branch:
- `wave/stage8-gated-channel-video-sfu-3user-turn-rejoin-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-video-sfu-3user-turn-rejoin-smoke`

## Goal

Extend gated channel `VIDEO` SFU smoke to three users, restart recovery, leave/rejoin cleanup, and TURN relay without switching channel `VIDEO` to SFU by default.

## Scope Boundary

Changed:
- extended `tests/browser/channel-video-sfu-smoke.spec.ts` with `CHANNEL_VIDEO_SFU_SMOKE_USERS`.
- added restart assertions for channel `VIDEO` SFU.
- added leave/rejoin assertions for channel `VIDEO` SFU.
- kept `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn` support for relay mode.

Preserved:
- channel `VIDEO` SFU remains non-production and full explicit-gated only.
- ordinary channel `VIDEO` without the full gate remains LiveKit.
- channel `AUDIO` SFU behavior remains unchanged.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.
- LiveKit fallback/default was not removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime implementation was added.

## Smoke Env

Local services:
- Postgres: Docker `connect-postgres-validation` on `localhost:5433`.
- coturn: Docker `connect-coturn-local` on `127.0.0.1:3478`.
- API: `http://localhost:4000/api`.
- Web: `http://localhost:3001`.

Local-only API env used for TURN:
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=replace-with-random-local-secret`
- `LOCAL_TURN_TTL_SECONDS=600`
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`

Direct command:
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

TURN command:
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

## Result

3-user direct channel `VIDEO` result:
- `pass`

Expected:
- `Remote producers: 4` per participant.
- two remote video tiles per participant.

Observed:
- three authenticated users joined the same channel `VIDEO` route through the full explicit SFU gate.
- all users reached `connected`.
- all users observed `Remote producers: 4`.
- all users rendered two remote video tiles.
- restart recovery returned all users to `connected`, `Remote producers: 4`, and two remote video tiles.
- one participant left to the server general text channel.
- remaining users dropped to `Remote producers: 2` and one remote video tile.
- the participant rejoined the gated channel route.
- all users returned to `Remote producers: 4` and two remote video tiles.
- no stale video tile or producer inflation was observed.
- ordinary channel `VIDEO` without the full gate remained off the SFU UI.
- ordinary channel `AUDIO` without the gate remained off the SFU UI.
- no-camera fallback remained connected audio-only.

TURN channel `VIDEO` result:
- `pass`

Observed:
- the same three-user channel `VIDEO` smoke passed with `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`.
- relay mode preserved restart recovery, leave/rejoin cleanup, remote producer counts, and remote video tile counts.

Regression results:
- channel `AUDIO` SFU regression: `pass`.
- private SFU regression: `pass`.

## Handoff

3-user direct result:
- `pass`

TURN result:
- `pass`

Restart result:
- `pass`

Leave/rejoin result:
- `pass`

Stale tile/producer cleanup result:
- `pass`
- no stale remote video tiles or inflated producer counts were observed after restart or leave/rejoin.

LiveKit fallback result:
- `pass / preserved`
- ordinary channel `VIDEO` without full gate remains LiveKit.
- ordinary channel `AUDIO` without gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.

Remaining blockers:
- run 5-user channel `VIDEO` load baseline.
- run explicit offline/restore channel `VIDEO` smoke.
- physical camera QA remains deferred on camera-equipped hardware.
- optional human-operated TURN signoff remains review-only.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- SFU screen-share remains deferred.

Recommended next segment:
- `gated-channel-video-sfu-5user-load-offline-smoke`

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
- guarded direct channel `VIDEO` smoke with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1`
- guarded TURN channel `VIDEO` smoke with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`
- guarded channel `AUDIO` regression with `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- guarded private SFU regression with `PRIVATE_SFU_BROWSER_SMOKE=1`

Results:
- all verification commands passed.
- guarded browser scripts skipped safely without their smoke env flags.
- guarded direct channel `VIDEO` smoke passed with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1`.
- guarded TURN channel `VIDEO` smoke passed with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`.
- guarded channel `AUDIO` regression passed with `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`.
- guarded private SFU regression passed with `PRIVATE_SFU_BROWSER_SMOKE=1`.
