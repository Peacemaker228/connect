# SEGMENT BRIEF 153. Private SFU Non-Production Default-Candidate Long-Soak Coverage

Branch:
- `wave/stage8-private-sfu-nonproduction-default-candidate-long-soak-coverage`

Base:
- `1a22408 docs(stage8): close private sfu default candidate`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-nonproduction-default-candidate-long-soak-coverage`

## Goal

Check the private SFU non-production default-candidate path in bounded long-soak scenarios.

## Scope

Allowed:
- scoped Playwright/helper updates.
- minimal runtime fix only if the long-soak found a real bug.
- docs report and status updates.

Changed:
- `tests/browser/private-sfu-two-user-smoke.spec.ts` now supports bounded private SFU long-soak flags:
  - `PRIVATE_SFU_SMOKE_RESTART_COUNT`, capped at `2`.
  - `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK=1`.
  - `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS`, capped at `2`.
  - `PRIVATE_SFU_SMOKE_LEAVE_REJOIN=1`.
- Restart loop attempts include a fixed 2s cooldown between explicit Restart clicks.
- The helper can assert route away/back without pressing Leave and explicit Leave plus rejoin.

Not changed:
- runtime code.
- env defaults.
- production rollout/default behavior.
- LiveKit fallback/removal.
- production TURN/SFU infrastructure.
- Stage 6/Postgres production migration docs.
- channel `AUDIO` or channel `VIDEO` behavior.

## Environment

Candidate env:
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`

Local services:
- API: `http://localhost:4000/api`
- web: `http://localhost:3001`
- local validation Postgres: `localhost:5433`

Local mediasoup cleanup env:
- `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS=20000`
- `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS=2000`

## Scenario Results

2-user private `?video=true` candidate direct:
- `pass`.
- ordinary private `?video=true` entered SFU only under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.

Screen-share start/stop:
- `pass`.
- candidate screen-share smoke passed with fake screen capture.

Restart loop:
- `pass with bounded cooldown`.
- two explicit Restart clicks passed when the helper waited 2 seconds between attempts.
- immediate back-to-back Restart attempts previously exposed a peer remote-track count drop to `Remote tracks: 1`, so the cooldown is part of the bounded operator-style smoke rather than an infinite retry.

Leave/rejoin:
- `fail / needs fix`.
- after explicit Leave and rejoin, the returning private participant reached `connected`, but the peer stayed at `Remote tracks: 1` instead of `Remote tracks: 2`.
- health showed backend producers/consumers present, so this points at client remote-track reconciliation after private rejoin/remount rather than a final backend leak.

Route away/back without Leave:
- `fail / needs fix`.
- after navigating one participant to the server `general` text channel and back to the private conversation, the peer stayed at `Remote tracks: 1` instead of restoring `Remote tracks: 2`.
- one combined run also observed `Remote tracks: 1` while expecting cleanup to `Remote tracks: 0` after route away.

Optional offline/restore:
- `review / fail finding`.
- the existing network interruption helper reproduced a peer remote-track count drop to `Remote tracks: 1` before/around Restart recovery.
- no unbounded retry loop was introduced.

LiveKit rollback through `?mediaProvider=livekit`:
- `pass`.
- candidate smoke kept the rollback assertion.

Explicit private SFU regression without candidate gate:
- `pass`.
- web was restarted without `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`, and explicit `?video=true&mediaProvider=sfu` smoke passed.
- ordinary private `?video=true` stayed LiveKit/default in that regression path.

Cleanup health:
- `pass`.
- final active rooms/sessions/transports/producers/consumers settled to `0` after stale cleanup convergence.

## Health Counter Snapshots

Baseline before long-soak:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": { "direct": 0, "turn": 0, "unknown": 0 },
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "screenShareStartCount": 0,
    "screenShareStopCount": 0,
    "staleSessionsClosedCount": 0,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

Representative fail finding after route/leave rejoin:

```json
{
  "activeRoomCount": 1,
  "trackedSessionCount": 2,
  "activeTransportCount": 6,
  "activeProducerCount": 4,
  "activeConsumerCount": 4,
  "producerCountsBySource": { "microphone": 2, "camera": 2, "screen": 0 },
  "consumerCountsBySource": { "microphone": 2, "camera": 2, "screen": 0 }
}
```

Final after cleanup convergence:

```json
{
  "activeRoomCount": 0,
  "trackedSessionCount": 0,
  "activeTransportCount": 0,
  "activeProducerCount": 0,
  "activeConsumerCount": 0,
  "transportModeCounts": { "direct": 0, "turn": 0, "unknown": 0 },
  "counters": {
    "failedTransportCreateCount": 0,
    "failedTransportConnectCount": 0,
    "failedProduceCount": 0,
    "failedConsumeCount": 0,
    "failedConsumerResumeCount": 0,
    "screenShareStartCount": 7,
    "screenShareStopCount": 7,
    "sessionCloseCount": 35,
    "staleSessionsClosedCount": 25,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

## Decision

Private SFU non-production default-candidate long-soak:
- `review with fail findings`.

Private SFU non-production default-candidate:
- remains `pass for controlled candidate smoke`.

Production default:
- remains `blocked`.

LiveKit removal:
- remains `blocked`.

LiveKit fallback:
- remains `preserved`.

## Bugs / Fixes

Bugs found:
- peer remote-track count can remain at `Remote tracks: 1` instead of `Remote tracks: 2` after private SFU route away/back, explicit leave/rejoin, and optional offline/restore paths.
- backend health can show the expected producers/consumers while the peer UI remains stale, pointing at client-side remote-track reconciliation after private rejoin/remount.

Fixes landed:
- no runtime fix landed in this segment.
- smoke helper coverage was expanded with bounded flags and fixed timeouts so the bug is reproducible without infinite loops.

## Remaining Blockers

- private SFU route away/back remote-track reconciliation needs a scoped fix.
- private SFU leave/rejoin remote-track reconciliation needs a scoped fix.
- optional offline/restore remains review because it can leave peer remote tracks incomplete.
- production default remains blocked.
- production media readiness remains blocked by process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- LiveKit removal remains blocked.

## Recommended Next Runtime Segment

- `private-sfu-remote-track-reconciliation-after-rejoin-fix`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure work.
- Stage 6/Postgres production migration work.

## Verification Performed

Guarded runtime smokes:
- candidate direct with ordinary `?video=true`: `pass`.
- candidate screen-share start/stop: `pass`.
- bounded 2-click Restart loop with 2s cooldown: `pass`.
- candidate route away/back: `fail / needs fix`.
- candidate leave/rejoin: `fail / needs fix`.
- optional network interruption: `review / fail finding`.
- explicit private SFU regression without candidate gate: `pass`.

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
- standard verification commands passed after this update.
- standard browser smoke scripts without guarded env flags skipped safely as expected.
