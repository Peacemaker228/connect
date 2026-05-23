# SEGMENT BRIEF 142. Channel VIDEO SFU Limited Pilot Long-Soak Run Report

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-long-soak-run-report`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-long-soak-run-report`

## Goal

Execute the bounded long-soak for the channel `VIDEO` SFU limited non-production pilot and capture a run report with health counter snapshots.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_140_CHANNEL_VIDEO_SFU_LIMITED_PILOT_OBSERVABILITY_LONG_SOAK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_141_CHANNEL_VIDEO_SFU_OBSERVABILITY_INSTRUMENTATION.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- local/dev API/web/browser smoke.
- local/dev mediasoup prototype health endpoint.
- non-production pilot gates only.
- docs report and status updates.

Out of scope:
- production rollout/default switch.
- LiveKit removal.
- production env/infra/PM2/Nginx/Docker changes.
- Stage 6/Postgres production work.
- broad private default switch.

## Local Environment Attempted

API:
- `http://localhost:4000/api`
- started with local/dev mediasoup cleanup env:
  - `LOCAL_MEDIASOUP_LISTEN_IP=127.0.0.1`
  - `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS=20000`
  - `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS=2000`

Web:
- `http://localhost:3001`
- started with:
  - `NEXT_PUBLIC_API_PORT=4000`
  - `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Database:
- expected local active `DATABASE_URL`: `postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public`
- local Postgres was not reachable on `localhost:5433`.
- Docker daemon was not available, so `infra/postgres/docker-compose.validation.yml` could not be started in this shell.

TURN:
- optional local coturn rerun was not attempted.
- no listener was found on local TURN port `3478`, and Docker daemon was unavailable.

## Health Counter Snapshots

Health was read through `GET /api/media/prototype/mediasoup/health` with transitional local `x-profile-id` auth because DB-backed auth registration was unavailable.

Before guarded smoke attempt:

```json
{
  "status": "ready",
  "enabled": true,
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": {
    "direct": 0,
    "turn": 0,
    "unknown": 0
  },
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

After blocked guarded smoke attempt:

```json
{
  "status": "ready",
  "enabled": true,
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": {
    "direct": 0,
    "turn": 0,
    "unknown": 0
  },
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
    "staleSweepCount": 10,
    "staleSessionsClosedCount": 0,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

Interpretation:
- mediasoup prototype health endpoint was reachable and reported clean zero active resources.
- no media room/session/transport/producer/consumer was created because guarded browser smoke failed before media join.
- `staleSweepCount` increased due health/sweeper activity; no stale sessions were closed.

## Run Attempt

Command:

```text
PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu
```

Result:
- `blocked`

Failure point:
- `/api/auth/register/password` returned non-success.
- API log showed Prisma `ECONNREFUSED` while calling `AuthIdentity.findUnique`, consistent with local Postgres on `localhost:5433` being unavailable.

This is a local environment precondition failure, not a channel `VIDEO` SFU media pass/fail.

## Scenario Classification

2-user channel `VIDEO` direct pilot:
- `blocked`
- reason: local DB unavailable; smoke failed during auth registration before media join.

3-user channel `VIDEO` direct pilot:
- `blocked / not run`
- reason: same DB precondition blocks authenticated browser smoke setup.

5-user fake-device direct pilot:
- `blocked / not run`
- reason: same DB precondition blocks authenticated browser smoke setup.

Screen-share takeover A -> B:
- `blocked / not run`
- reason: media room was never reached.

Restart loop:
- `blocked / not run`
- reason: media room was never reached.

Leave/rejoin loop:
- `blocked / not run`
- reason: media room was never reached.

Route away/back loop:
- `blocked / not run`
- reason: media room was never reached.

Failed -> Restart rejoin recovery:
- `blocked / not run`
- reason: failed-state path was not reached; `failedStateRejoinRecoveryCount` stayed `0`.

Optional TURN rerun:
- `review / not run`
- reason: local coturn was not already available; Docker daemon was unavailable.

LiveKit rollback/default preservation:
- `blocked / not run`
- reason: guarded browser smoke did not get past auth/server setup.

## Decision

Long-soak result:
- `blocked by local DB precondition`

Channel `VIDEO` limited non-production pilot readiness from Segment 139:
- unchanged: `pass for controlled local/product review`

Broader product-facing default:
- unchanged: `review / hold`

Production default:
- unchanged: `blocked`

Private default:
- unchanged: `hold`

LiveKit fallback:
- unchanged: `preserved`

## Remaining Blockers Before Broader Product Default

- long-soak has not run successfully.
- local DB-backed smoke environment must be restored before the bounded long-soak can execute.
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-limited-pilot-long-soak-env-unblock-and-rerun`

Not recommended next:
- production rollout.
- LiveKit removal.

## Verification Performed

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
- standard browser smoke commands without guarded env flags skipped safely.
