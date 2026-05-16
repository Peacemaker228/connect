# SEGMENT BRIEF 124. Channel Audio SFU Limited Non-Production Default Pilot

Branch:
- `wave/stage8-channel-audio-sfu-limited-nonproduction-default-pilot`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-audio-sfu-limited-nonproduction-default-pilot`

## Goal

Implement a constrained non-production product-default pilot for channel `AUDIO` SFU without changing production/product defaults for channel `VIDEO`, private calls, or LiveKit fallback.

## Scope Boundary

Changed:
- added a separate channel `AUDIO` pilot env gate: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- the pilot gate is channel `AUDIO` only, non-production only, off by default, and opens SFU without per-URL `mediaProvider=sfu&sfuChannel=true`.
- kept explicit LiveKit rollback overrides: `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`.
- kept existing explicit channel/private SFU gates and existing channel `AUDIO`/`VIDEO` default-candidate gates.
- updated guarded channel `AUDIO` browser smoke so `CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1` verifies the pilot path without SFU query parameters.
- added smoke assertions that channel `VIDEO` without the full video SFU gate stays out of the SFU adapter during the channel `AUDIO` pilot smoke.

Preserved:
- no production SFU default.
- no channel `VIDEO` default switch.
- no private default switch; ordinary private `?video=true` remains LiveKit.
- LiveKit fallback/default remains available and is not weakened.
- no screen-share implementation.
- no Stage 6/Postgres production migration changes.
- no production infra/env/nginx/firewall/deploy changes.

## Gate

New pilot env:
- `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`

Operational note:
- because this is a `NEXT_PUBLIC_*` browser flag, enabling or disabling the pilot requires restarting the local web dev server or rebuilding the web bundle.

Runtime boundary:
- applies only when `NODE_ENV !== 'production'`.
- applies only to channel scope with `audio=true` and `video=false`.
- does not apply when an explicit LiveKit rollback is present.
- uses real capture mode, matching the prior channel `AUDIO` candidate behavior.

Rollback:
- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

Existing gates remain supported:
- explicit channel `AUDIO`: `?mediaProvider=sfu&sfuChannel=true`
- channel `AUDIO` candidate: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE=1`
- explicit channel `VIDEO`: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real`
- channel `VIDEO` candidate: `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- explicit private SFU: `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`

## Smoke Results

Environment:
- API: `http://localhost:4000/api`
- web: `http://localhost:3001`
- database: `connect-postgres-validation` on `localhost:5433`
- pilot web env: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`
- TURN env: `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- TURN secret: local-only shell value, not committed

Direct pilot:
- command shape: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=5 CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 bun.cmd run test:browser:channel-audio-sfu`
- result: `pass`
- evidence: 5 authenticated channel `AUDIO` participants connected through SFU without per-URL SFU query, expected `Remote producers: 4`, real capture mode, restart recovery, offline/restore, leave/rejoin, and no stale producer inflation.

TURN pilot:
- command shape: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:channel-audio-sfu`
- result: `pass`
- evidence: 3 authenticated channel `AUDIO` participants connected through SFU without per-URL SFU query using relay policy; coturn logs showed authenticated allocations, peer traffic, and cleanup.

Rollback/default assertions:
- explicit `?mediaProvider=livekit` rollback on channel `AUDIO`: `pass`
- channel `VIDEO` without full video SFU gate remains outside SFU adapter: `pass`
- private SFU regression with audio pilot env enabled: `pass`
- ordinary private default remains LiveKit by smoke assertion: `pass`
- production default remains blocked by `NODE_ENV !== 'production'` guard and no production pilot env is introduced.

## Handoff

Direct result:
- `pass`

TURN result:
- `pass`

Rollback result:
- `pass`

LiveKit/default preservation:
- channel `AUDIO` remains LiveKit by default unless the non-production pilot env, candidate env, or explicit SFU query is active.
- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default because the SFU render gate is still production-blocked.

Remaining blockers before broader product/production default:
- process-local mediasoup/signaling state.
- production TURN/SFU infra, runbook, monitoring, firewall/process management, and rollback procedure.
- SFU screen-share remains deferred, blocking broad channel `VIDEO` and private default parity.
- broader subjective quality signoff may still be required before product rollout.

Recommended next segment:
- `channel-audio-sfu-limited-pilot-soak-observability`

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
- guarded channel `AUDIO` pilot direct smoke with `CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1`
- guarded channel `AUDIO` pilot TURN smoke with `CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1` and `CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn`
- private SFU regression smoke with channel `AUDIO` pilot env enabled

Results:
- all required verification commands passed.
- smoke scripts skipped safely when env flags were not set.
- guarded channel `AUDIO` pilot direct and TURN smokes passed.
