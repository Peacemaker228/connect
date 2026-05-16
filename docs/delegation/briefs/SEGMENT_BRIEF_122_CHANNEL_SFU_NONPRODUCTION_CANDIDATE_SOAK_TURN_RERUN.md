# SEGMENT BRIEF 122. Channel SFU Non-Production Candidate Soak and TURN Rerun

Branch:
- `wave/stage8-channel-sfu-nonproduction-candidate-soak-turn-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-sfu-nonproduction-candidate-soak-and-turn-rerun`

## Goal

Run channel SFU candidate-gate soak and TURN rerun without per-URL SFU query and without enabling product or production defaults.

## Scope Boundary

Changed:
- updated the channel `AUDIO` browser smoke rollback assertion so it can run while both channel candidate flags are enabled together.
- documented candidate direct/TURN soak results.
- updated Wave 33 and Stage 8 status.

Preserved:
- candidate gates remain non-production only.
- candidate gates remain off by default.
- no product-facing or production default switch was enabled.
- LiveKit fallback was not removed or weakened.
- ordinary private `?video=true` remains LiveKit by default.
- explicit private SFU gate remains query-controlled.
- no screen-share runtime implementation was added.
- no production infra/env/nginx/firewall/deploy changes were made.
- process-local mediasoup/signaling state was not changed.

## Smoke Environment

Local services:
- Postgres: existing `connect-postgres-validation` on `localhost:5433`.
- coturn: Docker `connect-coturn-local` from `infra/coturn/docker-compose.local.yml`.
- API: `http://localhost:4000/api`.
- Web: `http://localhost:3001`.

Runtime web candidate flags:
- `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE=1`
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`

API/media env:
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=<shell-only local secret>`
- `LOCAL_TURN_TTL_SECONDS=600`

Browser smoke profile:
- host: `localhost`
- API port: `4000`
- web port: `3001`
- Playwright default fake media devices were used; candidate `AUDIO` and `VIDEO` still use browser `getUserMedia` real-capture mode rather than synthetic oscillator capture.

## Results

Private SFU regression:
- `pass`
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- two authenticated private SFU participants connected through the explicit private SFU query gate.
- ordinary private default assertion remained LiveKit.

Channel `AUDIO` candidate direct:
- `pass`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_CANDIDATE_GATE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_USERS=5`
- `CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1`
- no per-URL `mediaProvider=sfu` or `sfuChannel=true` was used.
- all five participants reached `connected`.
- expected `Remote producers: 4` was observed per participant.
- `Capture mode: real` was asserted for candidate `AUDIO`.
- restart passed.
- offline/restore passed.
- leave/rejoin passed without stale producer inflation.
- rollback through `?mediaProvider=livekit` passed.

Channel `AUDIO` candidate TURN:
- `pass`
- `CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn`
- `CHANNEL_AUDIO_SFU_SMOKE_USERS=3`
- no per-URL SFU gate query was used.
- all three participants reached `connected`.
- expected `Remote producers: 2` was observed per participant.
- restart and leave/rejoin passed.
- coturn logs showed authenticated sessions, peer cleanup, and relay usage against peer `192.168.0.16`.

Channel `VIDEO` candidate direct:
- `pass`
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_CANDIDATE_GATE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=3`
- no per-URL `mediaProvider=sfu`, `sfuChannel=true`, `sfuVideo=true`, or `sfuCapture=real` was used.
- all three participants reached `connected`.
- expected `Remote producers: 4` was observed per participant.
- two remote video tiles were observed per participant.
- local fake-camera previews and remote video tracks were visible.
- restart and leave/rejoin passed.
- no-camera fallback assertion passed.
- rollback through `?mediaProvider=livekit` passed.

Channel `VIDEO` candidate TURN:
- `pass`
- `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=3`
- no per-URL SFU gate query was used.
- all three participants reached `connected`.
- expected `Remote producers: 4` and two remote video tiles were observed per participant.
- restart and leave/rejoin passed.
- no-camera fallback assertion passed.
- coturn logs showed authenticated TURN sessions, relay traffic counters, peer cleanup, and allocation count returning to zero.

## Handoff

Direct/TURN candidate status:
- direct candidate: `pass`
- TURN candidate: `pass`

Rollback status:
- `pass`
- `?mediaProvider=livekit` rollback assertions passed while both candidate flags were enabled.

LiveKit fallback/default preservation:
- preserved.
- candidate flags remain off by default.
- production remains blocked by the non-production render gate.
- ordinary private `?video=true` remains LiveKit.

Remaining blockers before product/prod default:
- process-local mediasoup/signaling state.
- deferred SFU screen-share.
- production TURN/SFU infra, runbook, firewall, monitoring, process management, and rollback procedure.
- product-facing default still needs a separate readiness decision.
- optional human subjective audio/video quality signoff remains useful before product-facing rollout.

Recommended next segment:
- `channel-sfu-product-default-readiness-decision`

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
- guarded channel `AUDIO` candidate direct smoke
- guarded channel `AUDIO` candidate TURN smoke
- guarded channel `VIDEO` candidate direct smoke
- guarded channel `VIDEO` candidate TURN smoke
- guarded private SFU regression smoke

Results:
- all required verification commands passed.
- guarded browser scripts skipped safely without smoke env flags.
- guarded private SFU regression smoke passed.
- guarded channel `AUDIO` direct and TURN candidate smokes passed.
- guarded channel `VIDEO` direct and TURN candidate smokes passed.
