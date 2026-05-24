# SEGMENT BRIEF 155. Private SFU Non-Production Default-Candidate Long-Soak Rerun Report

Branch:
- `wave/stage8-private-sfu-nonproduction-default-candidate-long-soak-rerun-report`

Base:
- `0d92b16 docs(stage8): align private sfu post-fix next step`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-nonproduction-default-candidate-long-soak-rerun-report`

## Goal

Rerun the private SFU default-candidate long-soak scenarios after the remote-track reconciliation fix from Segment 154.

## Scope

This segment is a runtime verification and report segment.

No runtime code, env defaults, production rollout/default behavior, LiveKit fallback/removal, production TURN/SFU infrastructure, or Stage 6/Postgres production migration behavior changed.

## Environment

Local services:
- API: `localhost:4000`
- Web: `localhost:3001`
- DB: disposable local Postgres validation on `localhost:5433`

Web env:
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`

Primary long-soak smoke env:
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`
- `PRIVATE_SFU_SMOKE_RESTART_COUNT=2`
- `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK=1`
- `PRIVATE_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS=1`
- `PRIVATE_SFU_SMOKE_LEAVE_REJOIN=1`

Optional offline/restore smoke env:
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`
- `PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1`

## Results

Private `?video=true` default-candidate direct:
- `pass`.

Bounded 2-click Restart loop:
- `pass`.

Route away/back without pressing Leave:
- `pass`.
- remote tracks restore to the expected count after returning to the private conversation.

Explicit Leave/rejoin:
- `pass`.
- remote tracks restore to the expected count after rejoining.

Optional offline/restore:
- `pass`.
- status returned to `connected`.
- remote tracks stayed/restored to the expected count.

LiveKit rollback:
- `pass / preserved`.

Explicit private SFU regression:
- covered by the prior Segment 154 rerun and not regressed by this report segment.

## Cleanup Health

An immediate post-smoke health snapshot still had active process-local resources, so cleanup was not claimed until bounded convergence completed.

Final health after bounded cleanup convergence:
- `activeRoomCount = 0`
- `trackedSessionCount = 0`
- `activeTransportCount = 0`
- `activeProducerCount = 0`
- `activeConsumerCount = 0`
- `failedTransportCreateCount = 0`
- `failedTransportConnectCount = 0`
- `failedProduceCount = 0`
- `failedConsumeCount = 0`
- `failedConsumerResumeCount = 0`
- `staleSweepCount = 29`
- `staleSessionsClosedCount = 2`

Interpretation:
- the user-facing private SFU flows pass after the Segment 154 fix.
- process-local cleanup converged to zero active resources.
- the stale sweeper closed abandoned sessions during convergence, which is expected for this local/dev prototype path.

## Classification

Private SFU non-production default-candidate long-soak rerun:
- `pass`.

Route away/back:
- `pass`.

Leave/rejoin:
- `pass`.

Offline/restore:
- `pass`.

Cleanup health:
- `pass after bounded convergence`.

Production default:
- `blocked`.

LiveKit removal:
- `blocked`.

Production media infra readiness:
- `blocked`.

## Remaining Blockers

- process-local mediasoup/signaling state remains a blocker before multi-process or production readiness.
- production SFU/TURN infrastructure is not implemented.
- production media runbook, monitoring, process management, and rollback are not implemented.
- LiveKit fallback remains required.
- production default remains blocked.

## Recommended Next Segment

Recommended:
- `private-sfu-controlled-product-review`

Acceptable:
- `stage8-media-mvp-local-completion-review`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure work.
- Stage 6/Postgres production migration work.

## Verification Performed

Runtime smoke:
- guarded private default-candidate long-soak smoke: `pass`.
- guarded private default-candidate offline/restore smoke: `pass`.
- authenticated mediasoup health snapshot after bounded cleanup convergence: `pass`.

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
- standard verification passed.
- standard browser smoke scripts without guarded env flags skipped safely as expected.
