# SEGMENT BRIEF 144. Channel VIDEO SFU Multi-User Screen-Share Rejoin Cleanup Fix

Branch:
- `wave/stage8-channel-video-sfu-multi-user-screen-share-rejoin-cleanup-fix`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-multi-user-screen-share-rejoin-cleanup-fix`

## Goal

Fix the stale/duplicated remote track count observed in the channel `VIDEO` SFU multi-user screen-share takeover plus leave/rejoin path.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_143_CHANNEL_VIDEO_SFU_LIMITED_PILOT_LONG_SOAK_ENV_UNBLOCK_RERUN.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- scoped runtime fix in SFU client/backend lifecycle.
- smoke/test updates if needed for 3-user screen-share takeover plus leave/rejoin.
- docs report and status updates.

Out of scope:
- production rollout/default switch.
- LiveKit removal.
- production infra/env/PM2/Nginx/Docker changes.
- broad private default switch.
- broad media engine rewrite.
- offline/failed Restart recovery fix.

## Root Cause

The observed failure was a client-side stale remote producer reconciliation gap, not a final backend resource leak:
- Segment 143 final health settled to zero active backend resources.
- `producer.closed`/snapshot handling could remove stale producers when events arrived, but the periodic producer discovery loop only refreshed paused state.
- If a `producer.closed` event or snapshot reconciliation was missed around screen-share takeover, Restart, or participant leave/rejoin, `remoteProducerIds` and participant grid state could keep a producer that was no longer present in the backend authoritative producer list.
- cleanup also cleared refs and remote screen-share state, but did not consistently reset all remote UI state such as `remoteProducerIds`, `consumerIds`, participant grid state, and single-video flags.
- camera/video tracks removed from the participant grid were detached from state but were not explicitly stopped on producer removal.

The `failedConsumeCount=1` from Segment 143 is consistent with a race where a producer disappeared while a client was trying to consume it. In this rerun after reconciliation cleanup, `failedConsumeCount` stayed `0`.

## Implementation

Changed `src/lib/shared/features/media/sfu-private-call-adapter.tsx`:
- `cleanup()` now clears producer/consumer/remote producer state, participant grid state, remote track counts, and single-video state.
- `cleanup()` now stops participant-grid video tracks when clearing remote participants.
- removed camera/video producers now explicitly stop their remote video track.
- periodic producer discovery now reconciles consumed producer ids against the backend authoritative producer list and removes local remote producer state for producers that no longer exist.
- existing paused-state sync remains preserved.

No backend runtime behavior, env defaults, production infra, rollout gates, LiveKit fallback, or private default behavior changed.

## Health Counter Snapshots

Before guarded rerun:

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

During the 3-user screen-share takeover plus leave/rejoin run:

```json
{
  "activeRoomCount": 1,
  "trackedSessionCount": 2,
  "activeTransportCount": 8,
  "activeProducerCount": 4,
  "activeConsumerCount": 4,
  "producerCountsBySource": { "microphone": 2, "camera": 2, "screen": 0 },
  "consumerCountsBySource": { "microphone": 2, "camera": 2, "screen": 0 },
  "counters": {
    "failedConsumeCount": 0,
    "screenShareStartCount": 2,
    "screenShareStopCount": 2,
    "screenShareTakeoverCount": 1,
    "olderScreenProducerClosedDueToTakeoverCount": 1
  }
}
```

After all guarded regression runs and cleanup convergence:

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
    "screenShareStartCount": 4,
    "screenShareStopCount": 4,
    "screenShareTakeoverCount": 2,
    "olderScreenProducerClosedDueToTakeoverCount": 2,
    "sessionCloseCount": 37,
    "staleSweepCount": 133,
    "staleSessionsClosedCount": 8,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

## Smoke Results

Guarded channel `VIDEO` 3-user product-default pilot with screen-share takeover plus leave/rejoin:
- `pass`
- the previously failing `Remote tracks: 3` after leave/rejoin no longer reproduced.
- expected remote track counts stabilized.
- no duplicate/stale remote screen/camera/audio tiles were observed by the smoke assertions.

Guarded channel `VIDEO` 2-user product-default pilot with screen-share takeover:
- `pass`

Guarded channel `VIDEO` 3-user product-default pilot without screen-share:
- `pass`

Guarded channel `VIDEO` 5-user fake-device product-default pilot without screen-share:
- `pass`

LiveKit rollback/default preservation:
- `pass` through the guarded channel `VIDEO` smoke assertions.

Failed/offline Restart recovery:
- unchanged / out of scope for this segment.
- `failedStateRejoinRecoveryCount` stayed `0` in this rerun because the failed-state recovery path was not exercised.

## Decision

Multi-user screen-share/rejoin cleanup:
- `pass for bounded local guarded smoke`

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

- failed/offline Restart recovery remains `review / not proven` in long-soak.
- route away/back loop is not covered by the current channel `VIDEO` smoke helper.
- optional local TURN rerun was not run in this segment.
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-failed-restart-recovery-soak-coverage`

Acceptable alternative:
- `channel-video-sfu-route-away-back-loop-coverage`

Not recommended next:
- production rollout.
- LiveKit removal.
- broader/default switch.

## Verification Performed

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu` - passed.
- same guarded command with `CHANNEL_VIDEO_SFU_SMOKE_USERS=2` and `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1` - passed.
- same guarded command with `CHANNEL_VIDEO_SFU_SMOKE_USERS=3` and `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=0` - passed.
- same guarded command with `CHANNEL_VIDEO_SFU_SMOKE_USERS=5` and `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=0` - passed.

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
