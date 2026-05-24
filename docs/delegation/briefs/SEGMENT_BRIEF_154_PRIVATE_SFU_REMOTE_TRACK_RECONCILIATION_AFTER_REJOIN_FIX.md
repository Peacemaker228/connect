# SEGMENT BRIEF 154. Private SFU Remote-Track Reconciliation After Rejoin Fix

Branch:
- `wave/stage8-private-sfu-remote-track-reconciliation-after-rejoin-fix`

Base:
- `a276472 docs(stage8): align private sfu next fix segment`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-remote-track-reconciliation-after-rejoin-fix`

## Goal

Fix private SFU remote-track reconciliation after rejoin/remount scenarios found in Segment 153.

## Scope

Changed:
- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
- `tests/browser/private-sfu-two-user-smoke.spec.ts`

Added:
- this run report.

Not changed:
- production rollout/default behavior.
- LiveKit fallback/removal.
- production TURN/SFU infrastructure.
- Stage 6/Postgres production migration docs.
- channel `AUDIO` or channel `VIDEO` behavior.
- env defaults.

## Root Cause

Segment 153 showed backend producers/consumers present while the peer UI stayed at `Remote tracks: 1`.

The private SFU client had two reconciliation gaps:
- the authoritative producer sync removed stale consumed producer IDs, but did not consume newly discovered backend producers when a `producer.published` event or replacement snapshot was missed.
- the single-video layout did not keep remote video tracks keyed by `producerId`, so stale camera tracks were less precisely cleaned than audio tracks and participant-grid video tracks.

This made route away/back and explicit leave/rejoin vulnerable to an incomplete local consumed-producer state after a new participant session published microphone plus camera again.

## Fix

Client reconciliation:
- single-video remote camera tracks are now tracked by `producerId`.
- removing a single-video producer now removes and stops the exact video track, clears the video element only when no video tracks remain, and keeps the single-video flag aligned with actual tracked video state.
- periodic producer state sync now uses the backend producer discovery list as an authoritative repair path:
  - stale consumed producer IDs still get removed.
  - discovered remote producers that are not yet consumed are consumed through the existing `consumeRemoteProducer` path.

Retry behavior:
- no new retry loop was added.
- the existing bounded 1s producer state sync remains the only repair cadence.
- Restart smoke remains capped by `PRIVATE_SFU_SMOKE_RESTART_COUNT`, currently max `2`.
- route away/back iterations remain capped by `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS`, currently max `2`.

Smoke coverage:
- route away/back and leave/rejoin now assert remote-track restoration on both participants after reconnect, not only on the peer that previously failed.

## Scenario Results

2-user private `?video=true` candidate direct:
- `pass`.
- ordinary private `?video=true` entered SFU only under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.

Restart loop:
- `pass`.
- guarded candidate smoke used `PRIVATE_SFU_SMOKE_RESTART_COUNT=2`.

Route away/back without Leave:
- `pass`.
- one participant navigated to the server `general` route without pressing Leave, then returned to the private conversation.
- remote tracks restored to `Remote tracks: 2`.

Explicit Leave/rejoin:
- `pass`.
- after Leave and rejoin, both participants returned to `connected`.
- remote tracks restored to `Remote tracks: 2`.

Screen-share regression:
- `pass`.
- explicit private SFU screen-share start/stop smoke passed.

LiveKit rollback:
- `pass / preserved`.
- smoke retained the assertion that explicit LiveKit rollback does not render the private SFU provider.

Explicit private SFU regression without candidate gate:
- `pass`.
- web was restarted without `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`, and explicit `?video=true&mediaProvider=sfu` smoke passed.
- ordinary private `?video=true` stayed LiveKit/default in that regression path.

Optional offline/restore:
- `review`.
- this segment did not make offline/restore the primary acceptance path; the client reconciliation fix is expected to help the same missed-producer symptom, but a focused offline rerun remains a separate decision.

## Health Counter Snapshots

Baseline before guarded candidate smoke:

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
    "staleSessionsClosedCount": 0,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

After guarded candidate route/rejoin smoke cleanup convergence:

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
    "sessionCloseCount": 5,
    "staleSessionsClosedCount": 1,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

After explicit SFU and screen-share regression cleanup convergence:

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
    "screenShareStartCount": 1,
    "screenShareStopCount": 1,
    "sessionCloseCount": 9,
    "staleSessionsClosedCount": 3,
    "failedStateRejoinRecoveryCount": 0
  }
}
```

## Decision

Private SFU remote-track reconciliation after rejoin/remount:
- `pass`.

Private SFU non-production default-candidate long-soak status:
- moves from `review with fail findings` to `review with route/rejoin fix landed`.

Production default:
- remains `blocked`.

LiveKit removal:
- remains `blocked`.

LiveKit fallback:
- remains `preserved`.

## Remaining Blockers

- optional offline/restore remains review pending a focused rerun.
- production default remains blocked.
- production media readiness remains blocked by process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- LiveKit removal remains blocked.

## Recommended Next Runtime Segment

- `private-sfu-nonproduction-default-candidate-long-soak-rerun-report`

Acceptable alternative:
- `private-sfu-offline-restore-reconciliation-rerun`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure work.
- Stage 6/Postgres production migration work.

## Verification Performed

Guarded smoke:
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`
- `PRIVATE_SFU_SMOKE_RESTART_COUNT=2`
- `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK=1`
- `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS=1`
- `PRIVATE_SFU_SMOKE_LEAVE_REJOIN=1`
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`
- result: `pass`.

Explicit private SFU regression without candidate gate:
- result: `pass`.

Explicit private SFU screen-share regression:
- result: `pass`.

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
- standard verification commands passed.
- standard browser smoke scripts without guarded env flags skipped safely as expected.
