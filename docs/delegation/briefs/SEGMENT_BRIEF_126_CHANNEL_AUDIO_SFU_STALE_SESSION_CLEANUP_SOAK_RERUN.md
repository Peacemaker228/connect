# SEGMENT BRIEF 126. Channel Audio SFU Stale Session Cleanup Soak Rerun

Branch:
- `wave/stage8-channel-audio-sfu-stale-session-cleanup-soak-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-audio-sfu-stale-session-cleanup-soak-rerun`

## Goal

Add bounded process-local cleanup for stale local SFU sessions/resources and rerun the limited channel `AUDIO` pilot soak.

## Scope Boundary

Changed:
- added a non-production process-local mediasoup session heartbeat endpoint.
- added client heartbeat while the SFU adapter is active.
- added a process-local stale-session TTL/sweeper for transports, producers, consumers, and tracked sessions.
- added cleanup result visibility in health/logs.
- expanded guarded channel `AUDIO` smoke to close browser contexts and assert health counters settle.
- reran channel `AUDIO` pilot direct and TURN soak.

Preserved:
- no production readiness claim.
- no Redis/distributed state.
- no channel `VIDEO` default switch.
- no private default switch.
- no LiveKit removal.
- no screen-share work.
- no production infra/env/nginx/firewall/deploy changes.

## Root Cause

The Segment 125 observability counters exposed raw process-local resource persistence after smoke/restart/browser cleanup.

The cause was not user-facing producer discovery inflation. Per-room producer discovery still deduped latest producer by participant/kind and browser assertions stayed clean.

The raw resource persistence came from:
- React/Next dev and restart flows can create replacement SFU adapter instances.
- the backend had no explicit transport close command.
- client cleanup closed producer/consumer resources with fire-and-forget requests, which is not guaranteed during browser context close.
- the backend had no heartbeat/TTL signal to distinguish active sessions from abandoned sessions after browser close or network loss.

## Cleanup Implementation

Backend:
- added `POST /api/media/prototype/mediasoup/sessions/heartbeat`.
- tracks `lastSeenAt` per `roomId + participantSessionId`.
- marks sessions active on heartbeat, transport create/connect, produce, consume, and producer discovery.
- starts a local-only stale-session sweeper in non-production.
- closes stale session consumers, producers, transports, and tracked session state.
- closing a stale producer also closes consumers attached to that producer.
- health now exposes:
  - `activeTransportCount`
  - `activeProducerCount`
  - `activeConsumerCount`
  - `activeRoomCount`
  - `trackedSessionCount`
  - `staleSessionTtlMs`
  - `staleSessionSweepIntervalMs`
  - `lastCleanup`
- logs now include `stale-sweep.completed` and cleanup counts.

Local-only env:
- `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS`
- `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS`

Client:
- `SfuClientAdapter.heartbeatSession(...)` calls the backend heartbeat endpoint.
- `SfuPrivateCallAdapter` sends heartbeat while the SFU path is active and stops heartbeat during cleanup.

Smoke:
- `CHANNEL_AUDIO_SFU_SMOKE_ASSERT_CLEANUP=1` enables context-close + health settle assertions.
- `CHANNEL_AUDIO_SFU_SMOKE_CLEANUP_SETTLE_MS` controls cleanup wait budget.
- smoke asserts active transport/producer/consumer/room/session counters settle to zero.

## Smoke Results

Environment:
- API: `http://localhost:4000/api`
- web: `http://localhost:3001`
- database: `connect-postgres-validation` on `localhost:5433`
- pilot web env: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`
- cleanup env: `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS=20000`, `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS=2000`
- smoke cleanup env: `CHANNEL_AUDIO_SFU_SMOKE_ASSERT_CLEANUP=1`, `CHANNEL_AUDIO_SFU_SMOKE_CLEANUP_SETTLE_MS=45000`
- TURN env: `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- TURN secret: local-only shell value, not committed

Direct pilot soak:
- command shape: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=5 CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_ASSERT_CLEANUP=1 bun.cmd run test:browser:channel-audio-sfu`
- result: `pass`
- evidence: 5 authenticated channel `AUDIO` participants connected through the product-default pilot without per-URL SFU query, expected `Remote producers: 4`, `Transport: direct`, restart, offline/restore, leave/rejoin, browser context close, and health counters settled to zero.

TURN pilot soak:
- command shape: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn CHANNEL_AUDIO_SFU_SMOKE_ASSERT_CLEANUP=1 bun.cmd run test:browser:channel-audio-sfu`
- result: `pass`
- evidence: 3 authenticated channel `AUDIO` participants connected through the product-default pilot without per-URL SFU query, expected `Remote producers: 2`, `Transport: turn`, local Docker coturn relay usage, browser context close, and health counters settled to zero.

Cleanup evidence:
- API logs showed `stale-sweep.completed`.
- final cleanup logs showed `activeTransportCount: 0`, `activeProducerCount: 0`, `activeConsumerCount: 0`, `activeRoomCount: 0`, and `trackedSessionCount: 0`.
- coturn logs showed relay allocation usage and allocation cleanup.

Private SFU regression:
- command shape: `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_API_URL=http://localhost:4000/api PRIVATE_SFU_SMOKE_WEB_URL=http://localhost:3001 bun.cmd run test:browser:private-sfu`
- result: `pass`
- evidence: two authenticated private SFU participants connected through the explicit non-production conversation gate, observed the expected remote producer count, restart recovery passed, ordinary private `?video=true` stayed outside the SFU adapter, and private leave redirect was preserved.

## Handoff

Readiness:
- functional channel `AUDIO` pilot direct/TURN: `pass`
- bounded process-local stale cleanup: `pass`
- limited non-production channel `AUDIO` pilot soak: `pass`
- production readiness: `blocked`

What remains LiveKit/default:
- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default because the SFU path remains non-production gated.

Remaining blockers:
- process-local state remains a multi-process/production blocker.
- production media infra/runbook/monitoring/rollback remains separate.
- SFU screen-share remains deferred for channel `VIDEO` and private parity.
- this is not a production soak or distributed-state proof.

Recommended next segment:
- `channel-audio-sfu-limited-pilot-readiness-decision`

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
- guarded channel `AUDIO` pilot direct soak with cleanup assertion
- guarded channel `AUDIO` pilot TURN soak with cleanup assertion
- guarded private SFU direct regression with `PRIVATE_SFU_BROWSER_SMOKE=1`

Results:
- all required verification commands passed.
- smoke scripts skipped safely when env flags were not set.
- guarded channel `AUDIO` pilot direct and TURN soak reruns passed.
- guarded private SFU direct regression passed after the shared SFU heartbeat/lifecycle changes.
