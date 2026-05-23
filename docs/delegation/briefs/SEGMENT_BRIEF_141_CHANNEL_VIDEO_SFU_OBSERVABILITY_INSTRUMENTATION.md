# SEGMENT BRIEF 141. Channel VIDEO SFU Observability Instrumentation

Branch:
- `wave/stage8-channel-video-sfu-observability-instrumentation`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-observability-instrumentation`

## Goal

Add local/dev-only observability instrumentation for the channel `VIDEO` SFU limited non-production pilot so the next long-soak run can be checked against counters and gauges, not only visual/manual observation.

This is not production monitoring, not production readiness, and not multi-process readiness.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_140_CHANNEL_VIDEO_SFU_LIMITED_PILOT_OBSERVABILITY_LONG_SOAK_PLAN.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- local/dev observability runtime changes.
- docs updates.
- extending the existing mediasoup prototype health response.
- SDK type updates for the extended health shape.

Out of scope:
- production/default rollout.
- LiveKit removal.
- env default changes.
- production TURN/SFU infrastructure.
- production monitoring or alerting claims.
- Stage 6 or Postgres production migration changes.
- broad private default switch.
- product behavior changes outside observability.

## Implementation

Extended existing endpoint:
- `GET /api/media/prototype/mediasoup/health`

Production guard:
- when `NODE_ENV === 'production'`, the endpoint still returns disabled local prototype status and does not expose the new process-local internals.

Implemented gauges:
- `activeRoomCount`
- `trackedSessionCount`
- `activeTransportCount`
- `activeProducerCount`
- `activeConsumerCount`
- `producerCountsBySource`
- `consumerCountsBySource`
- `transportModeCounts`
- `rooms[]`

Per-room breakdown:
- `roomId`
- `participantSessionCount`
- `transportCount`
- `producerCount`
- `consumerCount`
- `producerCountsBySource`
- `consumerCountsBySource`
- `transportModeCounts`

Implemented counters:
- `failedTransportCreateCount`
- `failedTransportConnectCount`
- `failedProduceCount`
- `failedConsumeCount`
- `failedConsumerResumeCount`
- `screenShareStartCount`
- `screenShareStopCount`
- `screenShareTakeoverCount`
- `olderScreenProducerClosedDueToTakeoverCount`
- `sessionCloseCount`
- `staleSweepCount`
- `staleSessionsClosedCount`
- `failedStateRejoinRecoveryCount`

Transport mode visibility:
- health now exposes requested prototype transport mode counts as `direct`, `turn`, and `unknown`.
- `turn` currently means the client requested local TURN credentials through the prototype transport path.

Failed-state rejoin visibility:
- `failedStateRejoinRecoveryCount` increments when the control-plane leave path is called with `reason: 'transport-failure'`, which is the current failed-state Restart recovery path.
- final recovery success still belongs in the long-soak run assertions.

## Deferred / Review

Deferred:
- actual ICE selected candidate pair / confirmed relay-vs-direct mode.
- client-visible SFU `failed` state count from browser UI.
- production monitoring/alerting.
- multi-process aggregation.

Reason:
- the current structure can expose process-local backend counters without broad media signaling/client refactor.
- actual selected transport path and client-visible failed state would need additional client or WebRTC stats plumbing and should be scoped separately if needed.

## Observability Coverage Classification

Local/dev process health counters:
- `pass`

Reason:
- the existing local mediasoup prototype health endpoint now exposes the required active resource gauges, source breakdowns, per-room breakdowns, and core lifecycle/failure/recovery counters.

Long-soak readiness:
- `review / ready to run`

Reason:
- the counters are available, but the bounded long-soak scenarios have not been executed in this segment.

Production monitoring:
- `blocked / out of scope`

Reason:
- process-local state remains non-production only and no production SFU/TURN monitoring, alerting, runbook, infra, or rollback exists.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

- `channel-video-sfu-limited-pilot-long-soak-run-report`

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
