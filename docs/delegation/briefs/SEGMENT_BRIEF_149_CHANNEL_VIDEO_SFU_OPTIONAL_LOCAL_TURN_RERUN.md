# SEGMENT BRIEF 149. Channel VIDEO SFU Optional Local TURN Rerun

Branch:
- `wave/stage8-channel-video-sfu-optional-local-turn-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-optional-local-turn-rerun`

## Goal

Close the optional latest local TURN rerun for the channel `VIDEO` SFU broader non-production default-candidate path.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_148_CHANNEL_VIDEO_SFU_BROADER_NONPRODUCTION_DEFAULT_CANDIDATE_IMPLEMENTATION.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `infra/coturn/README.md`

## Scope

This segment was a local verification and documentation segment.

No runtime code, environment defaults, production TURN/SFU infrastructure, production rollout/default behavior, LiveKit fallback, or private default behavior changed.

## Local TURN Setup

Started the local Docker coturn service from:
- `infra/coturn/docker-compose.local.yml`

Local environment used for the rerun:
- `LOCAL_TURN_STATIC_AUTH_SECRET=connect-local-turn-secret-stage8-149`
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_TTL_SECONDS=600`
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`

Reachability:
- before start: `127.0.0.1:3478` TCP was not reachable.
- after start: `127.0.0.1:3478` TCP was reachable.
- Docker published `127.0.0.1:3478` for TCP and UDP, plus the local UDP relay range.

## TURN Smoke Result

Guarded channel `VIDEO` broader non-production default-candidate TURN smoke:
- result: `pass`
- users: `3`
- gate: `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- SFU query params: not required for the candidate path.
- transport request: `sfuTransport=turn`
- covered screen-share takeover A -> B, Restart, route away/back with one bounded iteration, leave/rejoin, no-camera fallback, LiveKit rollback/default assertions, ordinary private `?video=true` LiveKit/default preservation, and channel `AUDIO` non-regression assertion inside the channel `VIDEO` smoke.

Screen-share over TURN:
- `pass`
- `screenShareStartCount=2`
- `screenShareStopCount=2`
- `screenShareTakeoverCount=1`
- `olderScreenProducerClosedDueToTakeoverCount=1`

Route away/back:
- `pass`
- one bounded iteration.

Restart:
- `pass`
- no failed/offline recovery path was requested in this TURN rerun.

LiveKit rollback/default:
- `pass / preserved`
- explicit rollback assertions remained covered by the smoke.

## Health Snapshots

Before smoke:
- `activeRoomCount=0`
- `trackedSessionCount=0`
- `activeTransportCount=0`
- `activeProducerCount=0`
- `activeConsumerCount=0`
- `transportModeCounts={ direct: 0, turn: 0, unknown: 0 }`
- failure counters were `0`

During/immediately after smoke:
- `activeRoomCount=1`
- `trackedSessionCount=2`
- `activeTransportCount=6`
- `activeProducerCount=2`
- `activeConsumerCount=2`
- `transportModeCounts={ direct: 0, turn: 6, unknown: 0 }`
- `failedTransportCreateCount=0`
- `failedTransportConnectCount=0`
- `failedProduceCount=0`
- `failedConsumeCount=0`
- `failedConsumerResumeCount=0`

After stale cleanup convergence:
- `activeRoomCount=0`
- `trackedSessionCount=0`
- `activeTransportCount=0`
- `activeProducerCount=0`
- `activeConsumerCount=0`
- `transportModeCounts={ direct: 0, turn: 0, unknown: 0 }`
- `staleSessionsClosedCount=2`
- `lastCleanup.reason=stale-sweep`
- `lastCleanup.closedTransportCount=6`
- `lastCleanup.closedProducerCount=2`
- `lastCleanup.closedConsumerCount=1`
- failure counters remained `0`

## Coturn Log Summary

coturn startup logs showed local TCP and UDP listeners on `127.0.0.1:3478`.

During the smoke, coturn logged authenticated TURN activity:
- successful `CREATE_PERMISSION` processing.
- TCP TURN sessions with usage records.
- sessions closed by the client after the smoke.
- global TURN allocation count returned to `0`.

Expected TURN REST/auth challenge noise appeared as unauthenticated `401` entries before authenticated requests.

Review note:
- coturn also logged transient `508 Cannot create socket` entries when the small local relay port range was exhausted during candidate probing.
- the guarded app smoke still passed, all observed app-level SFU failure counters remained `0`, and final health converged to zero active resources.
- before larger local TURN stress, widen the local-only relay range through compose environment overrides rather than treating this as production readiness.

## Decision

Channel `VIDEO` broader non-production default-candidate local TURN rerun:
- `pass with local relay-range review note`.

Screen-share over local TURN:
- `pass`.

Route away/back and Restart regression:
- `pass`.

LiveKit fallback:
- `preserved`.

Production default:
- remains `blocked`.

Production media infra readiness:
- remains `blocked`.

Multi-process readiness:
- remains `blocked` because mediasoup/signaling state is process-local.

LiveKit removal:
- remains `blocked`.

Private default:
- remains `hold`.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like soak.
- the latest TURN rerun used local Docker coturn only; it is not production TURN evidence.
- local coturn relay range should be widened before heavier local TURN stress.
- private default is not decided.
- LiveKit fallback remains required.

## Recommended Next Segment

- `channel-video-sfu-broader-nonproduction-default-candidate-run-report`

Not recommended next:
- production rollout.
- LiveKit removal.
- private default switch.
- production TURN/SFU infrastructure work inside the MVP local verification track.

## Verification Performed

Guarded TURN smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_CANDIDATE_GATE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=0 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK=1 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS=1 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=0 CHANNEL_VIDEO_SFU_SMOKE_FAILED_RESTART_RECOVERY=0 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 CHANNEL_VIDEO_SFU_SMOKE_HOST=localhost bun.cmd run test:browser:channel-video-sfu` - passed.

Standard commands:
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

Results:
- standard verification commands passed after this segment's changes.
- standard browser smoke scripts without guarded env flags skipped safely where expected.
