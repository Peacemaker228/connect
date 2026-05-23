# SEGMENT BRIEF 143. Channel VIDEO SFU Limited Pilot Long-Soak Env Unblock / Rerun

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-long-soak-env-unblock-and-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-long-soak-env-unblock-and-rerun`

## Goal

Restore the local DB-backed smoke environment and rerun the bounded channel `VIDEO` SFU limited non-production pilot long-soak with observability snapshots.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_140_CHANNEL_VIDEO_SFU_LIMITED_PILOT_OBSERVABILITY_LONG_SOAK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_141_CHANNEL_VIDEO_SFU_OBSERVABILITY_INSTRUMENTATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_142_CHANNEL_VIDEO_SFU_LIMITED_PILOT_LONG_SOAK_RUN_REPORT.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `infra/postgres/README.md`

## Scope

Allowed:
- local-only Docker/Postgres checks.
- local-only active Prisma schema sync against `localhost:5433/connect_validation`.
- local API/web/browser smoke with the non-production channel `VIDEO` pilot gate.
- local/dev mediasoup prototype health snapshots.
- docs report and status updates.

Out of scope:
- production DB/env/infra changes.
- Stage 6 production migration work.
- production media rollout or default switch.
- LiveKit removal.
- broad default/private switch.

## Environment Unblock

The Segment 142 blocker was cleared in this shell:
- Docker daemon was available.
- `connect-postgres-validation` was running and healthy.
- `localhost:5433` accepted TCP connections.
- active local `DATABASE_URL` pointed at `postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public`.
- local-only `bun.cmd x prisma db push` reported the database was already in sync with the active Prisma schema.

API/web were started locally with:
- API: `http://localhost:4000/api`
- web: `http://localhost:3001`
- `DATABASE_URL=postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public`
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`
- `LOCAL_MEDIASOUP_LISTEN_IP=127.0.0.1`
- `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS=20000`
- `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS=2000`

Optional local coturn rerun:
- not run.
- no local listener was found on `3478`.
- no running Docker container matched coturn/TURN.

## Health Counter Snapshots

Before rerun:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": { "direct": 0, "turn": 0, "unknown": 0 },
  "producerCountsBySource": { "microphone": 0, "camera": 0, "screen": 0 },
  "consumerCountsBySource": { "microphone": 0, "camera": 0, "screen": 0 },
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "screenShareStartCount": 0,
    "screenShareStopCount": 0,
    "screenShareTakeoverCount": 0,
    "olderScreenProducerClosedDueToTakeoverCount": 0,
    "sessionCloseCount": 0,
    "staleSweepCount": 1,
    "staleSessionsClosedCount": 0,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

During 5-user fake-device run:

```json
{
  "activeRoomCount": 1,
  "trackedSessionCount": 5,
  "activeTransportCount": 17,
  "activeProducerCount": 10,
  "activeConsumerCount": 33,
  "producerCountsBySource": { "microphone": 5, "camera": 5, "screen": 0 },
  "consumerCountsBySource": { "microphone": 17, "camera": 16, "screen": 0 },
  "transportModeCounts": { "direct": 0, "turn": 17, "unknown": 0 }
}
```

After final cleanup convergence:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": { "direct": 0, "turn": 0, "unknown": 0 },
  "producerCountsBySource": { "microphone": 0, "camera": 0, "screen": 0 },
  "consumerCountsBySource": { "microphone": 0, "camera": 0, "screen": 0 },
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 1,
    "failedConsumerResumeCount": 0,
    "screenShareStartCount": 4,
    "screenShareStopCount": 4,
    "screenShareTakeoverCount": 2,
    "olderScreenProducerClosedDueToTakeoverCount": 2,
    "sessionCloseCount": 35,
    "staleSweepCount": 364,
    "staleSessionsClosedCount": 12,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

Interpretation:
- active backend media resources settled to zero after context close and stale cleanup convergence.
- screen-share takeover counters incremented as expected in the screen-share runs.
- `failedConsumeCount=1` is a review finding because it did not block the passing runs but indicates at least one failed consume attempt during the soak set.
- `failedStateRejoinRecoveryCount=0` because the failed-state Restart recovery path was not reached in a passing run.
- the backend requested transport mode gauge reports `turn` because the current SFU adapter requests TURN credential metadata for transports by default; the UI policy for these runs was direct unless `sfuTransport=turn` was explicitly present. Actual selected ICE path remains deferred observability.

## Scenario Classification

2-user channel `VIDEO` direct pilot:
- `pass`
- guarded smoke passed with product-default pilot gate, remote audio/video, Restart, leave/rejoin, screen-share takeover A -> B, no-camera fallback, ordinary private `?video=true` LiveKit/default preservation, and rollback assertions for `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`.

3-user channel `VIDEO` direct pilot without screen-share:
- `pass`
- guarded smoke passed with remote audio/video, one Restart, leave/rejoin, rollback/default assertions, and cleanup convergence.

3-user channel `VIDEO` with screen-share takeover:
- `fail / needs fix`
- guarded smoke failed after leave/rejoin because one page expected `Remote tracks: 2` but remained at `Remote tracks: 3`.
- this is a stale or duplicated remote track/product-count finding in a multi-user screen-share/rejoin path.
- backend active resources still settled to zero after context close.

5-user fake-device channel `VIDEO` direct pilot:
- `pass`
- guarded smoke passed with five users, fake media devices, one Restart, leave/rejoin, no screen-share, rollback/default assertions, and cleanup convergence.

Screen-share takeover A -> B:
- `pass` for 2-user bounded takeover.
- `fail / review` for 3-user takeover combined with leave/rejoin because stale remote track count was observed after convergence expected by the smoke.

Restart loop:
- `review / partial`
- multiple guarded runs each covered one Restart, and those passing runs recovered.
- a same-room repeated Restart loop was not implemented in the current helper.

Leave/rejoin loop:
- `pass` for no-screen 2-user, 3-user, and 5-user guarded runs.
- `fail / needs fix` for the 3-user screen-share takeover plus leave/rejoin path due stale `Remote tracks` count.

Route away/back loop:
- `review / not covered`
- the current channel `VIDEO` helper covers explicit Leave and rejoin, not a separate route-change away/back loop.

Failed -> Restart rejoin recovery:
- `review / not reproduced in a passing run`
- a 2-user offline/restore helper run reached `failed` instead of returning to `connected`, but the helper stopped at that assertion before exercising Restart.
- a temporary focused Restart-recovery attempt did not reproduce `failed`; the page stayed `connected`.
- `failedStateRejoinRecoveryCount` remained `0`.

Optional TURN rerun:
- `review / not run`
- local coturn was not already available on port `3478`.

LiveKit fallback/default preservation:
- `pass`
- guarded channel `VIDEO` smoke assertions confirmed rollback/default paths still do not render the SFU provider, and ordinary private `?video=true` remains LiveKit/default.

## Decision

Long-soak rerun result:
- `review with fail findings`

Channel `VIDEO` limited non-production pilot:
- remains `pass for controlled local/product review`.

Broader product-facing default:
- remains `review / hold`.

Production default:
- remains `blocked`.

Private default:
- remains `hold`.

LiveKit fallback:
- remains `preserved`.

## Remaining Blockers Before Broader Product Default

- 3-user screen-share takeover plus leave/rejoin can leave a stale/duplicated remote track count.
- failed/offline restore did not provide a passing failed -> Restart rejoin recovery proof in this run.
- `failedConsumeCount=1` needs triage or explanation before using counters as pass-only evidence.
- route away/back loop is not covered by the current channel `VIDEO` smoke helper.
- optional local TURN rerun was not run because coturn was unavailable.
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-multi-user-screen-share-rejoin-cleanup-fix`

Acceptable alternative:
- `channel-video-sfu-failed-restart-recovery-soak-coverage`

Not recommended next:
- production rollout.
- LiveKit removal.
- broader/default switch.

## Verification Performed

Env/setup:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`
- `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
- `docker compose -f infra/postgres/docker-compose.validation.yml ps`
- `Test-NetConnection -ComputerName localhost -Port 5433`
- local-only `bun.cmd x prisma db push`

Guarded soak commands:
- 2-user direct/product-default pilot with screen-share: `pass`
- 3-user direct/product-default pilot with screen-share: `fail`
- 3-user direct/product-default pilot without screen-share: `pass`
- 5-user direct/product-default pilot without screen-share: `pass`
- 2-user offline/restore: `fail`
- focused failed-state Restart attempt: `review / failed state not reproduced`

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
- all standard verification commands passed.
- standard browser smoke scripts without guarded env flags skipped safely.
