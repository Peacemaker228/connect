# SEGMENT BRIEF 145. Channel VIDEO SFU Failed Restart Recovery Soak Coverage

Branch:
- `wave/stage8-channel-video-sfu-failed-restart-recovery-soak-coverage`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-failed-restart-recovery-soak-coverage`

## Goal

Close failed/offline Restart recovery coverage for the channel `VIDEO` SFU limited non-production pilot.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_143_CHANNEL_VIDEO_SFU_LIMITED_PILOT_LONG_SOAK_ENV_UNBLOCK_RERUN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_144_CHANNEL_VIDEO_SFU_MULTI_USER_SCREEN_SHARE_REJOIN_CLEANUP_FIX.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- scoped Playwright/helper updates.
- scoped runtime fix only if Restart recovery is unreliable.
- non-production/test-only knobs only where needed to reproduce the failed path deterministically.
- docs report and status updates.

Out of scope:
- production rollout/default switch.
- LiveKit removal.
- production infra/env changes.
- broad private default switch.
- unbounded reconnect/retry loops.
- route-away/back loop as the primary task.

## Implementation

Changed `src/lib/shared/features/media/sfu-private-call-adapter.tsx`:
- added `simulateFailedStateAfterOfflineRestore`, a non-production/test-only adapter prop.
- when enabled, the adapter can move a single browser tab into terminal `failed` after an offline/online restore signal.
- the simulation closes the current local SFU adapter/media state and leaves recovery to the existing explicit Restart button path.
- the simulation is one-shot per adapter mount and does not start any retry, reconnect recursion, or recovery loop.

Changed `src/lib/shared/features/media-room.tsx`:
- wires the test-only simulation only when `NODE_ENV !== 'production'` and `sfuSimulateFailedAfterOfflineRestore=true` is present in the URL.
- no production/default rollout gates or env defaults changed.

Changed `tests/browser/channel-video-sfu-smoke.spec.ts`:
- added guarded `CHANNEL_VIDEO_SFU_SMOKE_FAILED_RESTART_RECOVERY=1` coverage.
- only one participant receives `sfuSimulateFailedAfterOfflineRestore=true`.
- the smoke performs a real bounded offline/online interruption first.
- after the interruption, the smoke dispatches the non-production simulation event for that one participant, waits for `failed`, clicks `Restart SFU channel video` exactly once, and then requires all participants to return to `connected`.
- `waitForSfuStatus()` uses an explicit 45s deadline and 500ms polling interval; there is no unbounded wait or retry recursion.

No backend runtime behavior, production env/defaults, production infra, broad private default switch, or LiveKit fallback/removal changed.

## Recovery Path Observed

Focused 2-user channel `VIDEO` product-default pilot run:
- participants joined the channel `VIDEO` SFU product-default pilot.
- one participant went offline for 6 seconds and came back online.
- the guarded non-production simulation forced that participant into client `failed` after the offline/online path.
- the smoke clicked `Restart SFU channel video` once.
- the existing `failed` Restart path called `rejoinControlPlane()`, closed the active participant session with `reason: 'transport-failure'`, and created a fresh backend join.
- both participants returned to `connected`.
- LiveKit rollback/default assertions in the same smoke passed.

Code fix needed:
- no backend recovery fix was needed.
- the implementation adds deterministic local/dev coverage for the already-existing failed-state Restart recovery path.

## Health Counter Snapshots

Before focused failed recovery smoke:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
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

After focused failed recovery smoke and stale cleanup convergence:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "sessionCloseCount": 10,
    "staleSweepCount": 29,
    "staleSessionsClosedCount": 4,
    "failedStateRejoinRecoveryCount": 1
  }
}
```

After 3-user screen-share takeover plus leave/rejoin regression and stale cleanup convergence:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "screenShareStartCount": 2,
    "screenShareStopCount": 2,
    "screenShareTakeoverCount": 1,
    "olderScreenProducerClosedDueToTakeoverCount": 1,
    "sessionCloseCount": 19,
    "staleSweepCount": 53,
    "staleSessionsClosedCount": 6,
    "failedStateRejoinRecoveryCount": 1
  }
}
```

## Smoke Results

2-user channel `VIDEO` product-default pilot failed/offline Restart recovery:
- `pass`
- offline/online path reached the guarded `failed` state.
- one explicit Restart click launched fresh backend rejoin and returned both users to `connected`.
- `failedStateRejoinRecoveryCount` incremented from `0` to `1`.
- final active resources settled to zero after stale cleanup convergence.
- LiveKit rollback/default assertions passed in the same smoke.

3-user channel `VIDEO` product-default pilot screen-share takeover plus leave/rejoin:
- `pass`
- the Segment 144 cleanup did not regress.
- expected remote track counts stabilized.
- no stale duplicate remote track assertion failed.
- `failedConsumeCount` remained `0` in this segment's rerun.

## Bounded Retry Proof

- the adapter simulation is one-shot per mount.
- the smoke waits for `failed` or `connected` through a helper with a fixed 45s deadline and 500ms polling.
- when `CHANNEL_VIDEO_SFU_SMOKE_FAILED_RESTART_RECOVERY=1`, the smoke clicks Restart exactly once.
- there is no automatic recovery attempt, retry recursion, unbounded interval, or infinite wait.
- if the expected status is not reached before timeout, the smoke fails instead of looping.

## Decision

Failed/offline Restart recovery coverage:
- `pass for bounded local guarded smoke`.

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

- route away/back loop is not covered by the current channel `VIDEO` smoke helper.
- optional local TURN rerun was not run in this segment.
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-route-away-back-loop-coverage`

Acceptable alternative:
- `channel-video-sfu-limited-pilot-broader-default-readiness-review`

Not recommended next:
- production rollout.
- LiveKit removal.
- broader/default switch without the remaining route-away/back and long-soak review.

## Verification Performed

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=0 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=0 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_VIDEO_SFU_SMOKE_FAILED_RESTART_RECOVERY=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu` - passed.
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=0 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu` - passed.

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
