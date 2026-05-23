# SEGMENT BRIEF 146. Channel VIDEO SFU Route Away/Back Loop Coverage

Branch:
- `wave/stage8-channel-video-sfu-route-away-back-loop-coverage`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-route-away-back-loop-coverage`

## Goal

Close channel `VIDEO` SFU route away/back coverage: leave the SFU video channel by navigating to another route without pressing Leave, then return to the same video channel.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_143_CHANNEL_VIDEO_SFU_LIMITED_PILOT_LONG_SOAK_ENV_UNBLOCK_RERUN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_144_CHANNEL_VIDEO_SFU_MULTI_USER_SCREEN_SHARE_REJOIN_CLEANUP_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_145_CHANNEL_VIDEO_SFU_FAILED_RESTART_RECOVERY_SOAK_COVERAGE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- scoped Playwright/helper updates.
- scoped runtime cleanup fix only if route change leaves stale media state.
- docs report and status updates.

Out of scope:
- production rollout/default switch.
- LiveKit removal.
- production infra/env changes.
- broad private default switch.
- broader/default readiness decision in this segment.

## Implementation

Changed `tests/browser/channel-video-sfu-smoke.spec.ts`:
- added guarded `CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK=1` coverage.
- added `CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS`, capped at `2`; default guarded count is `1`.
- the route-away/back path selects one participant, navigates that tab to the server `general` text channel without clicking `Leave call`, verifies remaining participants' remote track/video tile counts decrease, navigates the tab back to the SFU video channel, and verifies all participants return to `connected` with restored remote track/video tile counts.
- the loop is a fixed `for` loop; there is no retry recursion, auto reconnect loop, or unbounded wait.

Runtime fix needed:
- no runtime cleanup fix was needed.
- existing `useMediaRoomController` cleanup already closes the participant session on MediaRoom unmount, and `SfuPrivateCallAdapter` cleanup already clears local adapter/media state.

No production/default rollout, env default, production infra, broad private default, or LiveKit fallback/removal changed.

## Route Path Tested

Focused guarded 3-user product-default pilot smoke:
- all three users opened the channel `VIDEO` SFU product-default pilot and reached `connected`.
- route-away participant: user 2.
- away route: `/servers/:serverId/channels/:generalTextChannelId`.
- away action: direct navigation with `page.goto(...)`; no `Leave call` button click.
- remaining participants observed remote tracks decrease from `Remote tracks: 4` to `Remote tracks: 2`.
- remaining participants observed remote video tiles decrease from `2` to `1`.
- user 2 navigated back to `/servers/:serverId/channels/:videoChannelId`.
- all three users returned to `connected`.
- remote tracks restored to `Remote tracks: 4`.
- remote video tiles restored to `2`.
- LiveKit rollback/default assertions passed in the same smoke.

## Health Counter Snapshots

Before focused route-away/back smoke:

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

Immediately after focused route-away/back smoke:

```json
{
  "activeRoomCount": 1,
  "trackedSessionCount": 2,
  "activeTransportCount": 6,
  "activeProducerCount": 2,
  "activeConsumerCount": 2,
  "producerCountsBySource": { "microphone": 2, "camera": 0, "screen": 0 },
  "consumerCountsBySource": { "microphone": 2, "camera": 0, "screen": 0 },
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "sessionCloseCount": 7,
    "staleSweepCount": 17,
    "staleSessionsClosedCount": 0,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

After route-away/back and 3-user screen-share regression cleanup convergence:

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
    "sessionCloseCount": 18,
    "staleSweepCount": 38,
    "staleSessionsClosedCount": 4,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

## Smoke Results

3-user channel `VIDEO` product-default pilot route away/back:
- `pass`
- one participant left the video channel route without pressing Leave.
- remaining participants' remote tracks and remote video tiles decreased as expected.
- the participant returned to the video channel.
- all participants returned to `connected`.
- remote tracks and remote video tiles restored correctly.
- no stale remote audio/video/screen tile assertion failed.
- final active resources settled to zero after stale cleanup convergence.
- LiveKit rollback/default assertions passed in the same smoke.

3-user channel `VIDEO` product-default pilot screen-share takeover plus leave/rejoin:
- `pass`
- Segment 144 cleanup did not regress.
- expected remote track counts stabilized.
- `failedConsumeCount` remained `0`.

Failed Restart recovery:
- standard path remains unchanged and safe-skips without guarded env.
- Segment 145 guarded failed Restart recovery remains the latest passing evidence for that path.

## Bounded Loop Proof

- route away/back runs only when `CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK=1`.
- `CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS` defaults to `1` and is capped at `2`.
- each assertion uses Playwright bounded timeouts.
- no automatic retry/reconnect recursion or unbounded polling was added.
- if route-away counts or reconnect counts do not converge before timeout, the smoke fails.

## Decision

Route away/back coverage:
- `pass for bounded local guarded smoke`.

Channel `VIDEO` limited non-production pilot:
- remains `pass for controlled local/product review`.

Broader product-facing default:
- remains `review / hold`; no broader/default readiness decision was made in this segment.

Production default:
- remains `blocked`.

Private default:
- remains `hold`.

LiveKit fallback:
- remains `preserved`.

## Remaining Blockers Before Broader Product Default

- optional local TURN rerun was not run in this segment.
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-limited-pilot-broader-default-readiness-review`

Acceptable alternative:
- `channel-video-sfu-optional-local-turn-rerun`

Not recommended next:
- production rollout.
- LiveKit removal.
- broader/default switch without an explicit readiness review.

## Verification Performed

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=0 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=0 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=0 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK=1 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu` - passed.
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
