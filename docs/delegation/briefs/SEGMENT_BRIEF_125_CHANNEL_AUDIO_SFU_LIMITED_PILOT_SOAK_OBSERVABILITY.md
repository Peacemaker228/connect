# SEGMENT BRIEF 125. Channel Audio SFU Limited Pilot Soak Observability

Branch:
- `wave/stage8-channel-audio-sfu-limited-pilot-soak-observability`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-audio-sfu-limited-pilot-soak-observability`

## Goal

Check whether the limited channel `AUDIO` SFU pilot is observable enough for soak review without adding a broader switch.

## Scope Boundary

Changed:
- inventoried current channel `AUDIO` SFU status/log surfaces.
- added non-production mediasoup lifecycle logs for local/dev review.
- added active mediasoup lifecycle counters to the authenticated prototype health snapshot.
- added a client-visible SFU transport status line: `Transport: direct` or `Transport: turn`.
- updated guarded channel `AUDIO` smoke to assert the direct/TURN transport status.
- repeated channel `AUDIO` pilot direct and TURN smoke.

Preserved:
- no channel `VIDEO` default change.
- no private default change.
- no production default change.
- LiveKit fallback/default remains available.
- no screen-share implementation.
- no production infra/env/nginx/firewall/deploy changes.
- no Stage 6/Postgres production track changes.

## Observability Inventory

Existing before this segment:
- client status: `idle`, `starting`, `waiting`, `connected`, `reconnecting`, `failed`.
- client detail text for signaling snapshot, remote producer consumption, capture fallback, and event-stream interruption.
- client identifiers: room id, participant session id, first producer id, first consumer id.
- client remote producer count through `private-sfu-remote-producer-count`.
- client capture mode and requested media summary.
- SSE signaling events: `producer.snapshot`, `producer.published`, `producer.closed`, `consumer.closed`.
- backend scoped room/session checks before transport, producer, consumer, close, and discovery access.
- coturn container logs for TURN allocation, peer traffic, channel bind, and cleanup during local relay tests.

Added in this segment:
- authenticated health counters: `activeTransportCount`, `activeProducerCount`, `activeConsumerCount`, `activeRoomCount`.
- non-production structured lifecycle logs from `MediasoupPrototypeService`:
  - `transport.created`
  - `transport.connected`
  - `transport.failed`
  - `transport.connect.failed`
  - `producer.published`
  - `producer.failed`
  - `producer.closed`
  - `consumer.created`
  - `consumer.failed`
  - `consumer.closed`
  - `session.closed`
- each lifecycle log includes room id, participant session id where available, relevant transport/producer/consumer ids, and active counts.
- client transport status line with `data-testid="private-sfu-transport-mode"`.

Note:
- the client transport line reflects the requested adapter mode (`direct` or forced relay `turn`), not low-level ICE selected-candidate telemetry.

## Soak Gaps

Status:
- `review`

Gaps:
- current counters are process-local and log-only; they are not metrics, alerts, retention, or production observability.
- `Transport: direct` is local UI mode visibility, not proof of the actual selected ICE candidate pair.
- local dev smoke showed raw process-local counts can persist across smoke rooms in the same API process after restart/browser-context cleanup. User-facing per-room discovery still dedupes latest producer by participant/kind and the browser smoke did not show stale remote producer inflation, but the raw counts are not clean enough to call long soak fully ready.
- explicit `Leave call` and leave/rejoin cleanup remain covered, but browser close/context disposal is not an awaitable cleanup guarantee.
- no heartbeat/TTL/sweeper exists for stale SFU sessions, producers, consumers, or transports.
- multi-process/distributed SFU state remains out of scope and still blocks production readiness.

Interpretation:
- limited channel `AUDIO` pilot remains valid for local/dev functional review.
- longer soak or any broader product default should first add a narrow stale-session cleanup/TTL/heartbeat pass or a bounded process-local sweeper.

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
- evidence: 5 authenticated channel `AUDIO` participants connected through the product-default pilot without per-URL SFU query, expected `Remote producers: 4`, `Transport: direct`, real capture mode, restart recovery, offline/restore, leave/rejoin, and rollback/default assertions.

TURN pilot:
- command shape: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:channel-audio-sfu`
- result: `pass`
- evidence: 3 authenticated channel `AUDIO` participants connected through the product-default pilot without per-URL SFU query, expected `Remote producers: 2`, `Transport: turn`, backend-issued local TURN credentials, local Docker coturn relay usage, restart, leave/rejoin, and cleanup.

Observability result:
- lifecycle logs appeared for transport create/connect, producer publish/close, consumer create/close, session close, and active counts.
- coturn logs showed authenticated allocations, peer traffic, and allocation cleanup.

## Handoff

Readiness:
- functional channel `AUDIO` pilot direct/TURN: `pass`
- observability for local/dev pilot review: `pass`
- long-soak/product-default readiness: `review`
- production readiness: `blocked`

What remains LiveKit/default:
- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default because the SFU path remains non-production gated.

Remaining blockers:
- raw process-local mediasoup object counts need bounded stale cleanup before long soak is treated as clean.
- process-local state remains a multi-process/production blocker.
- production media infra/runbook/monitoring/rollback remains separate.
- SFU screen-share remains deferred for channel `VIDEO` and private parity.

Recommended next segment:
- `channel-audio-sfu-stale-session-cleanup-soak-rerun`

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

Results:
- all required verification commands passed.
- smoke scripts skipped safely when env flags were not set.
- guarded channel `AUDIO` pilot direct and TURN smokes passed.
