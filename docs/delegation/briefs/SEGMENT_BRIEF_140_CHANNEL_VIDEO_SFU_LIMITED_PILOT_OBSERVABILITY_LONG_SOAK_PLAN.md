# SEGMENT BRIEF 140. Channel VIDEO SFU Limited Pilot Observability / Long-Soak Plan

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-observability-long-soak-plan`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-observability-and-long-soak-plan`

## Goal

Define the minimum observability signals and bounded long-soak scenarios required before any broader/default decision for the channel `VIDEO` SFU limited non-production product-default pilot.

This is a plan-only segment. It does not implement instrumentation, run soak, change runtime behavior, change env defaults, change TURN/SFU infrastructure, enable production/default rollout, or remove LiveKit.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_139_CHANNEL_VIDEO_SFU_LIMITED_PILOT_READINESS_DECISION.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/roadmap/STAGE_STATUS.md`

## Current Decision Baseline

From Segment 139:
- channel `VIDEO` limited non-production product-default pilot is `pass for controlled local/product review`.
- broader product-facing default is `review / hold`.
- production default is `blocked`.
- private default is `hold`.
- LiveKit fallback and rollback are preserved.

Reason for this segment:
- the last real pilot bugs were lifecycle, cleanup, restart, remote media flow, and screen-share takeover issues.
- the next step must define soak and observability criteria before expanding rollout.

## Guardrails

Allowed:
- docs-only plan.
- define observability signals.
- define bounded local/dev long-soak scenarios.
- define pass/review/fail criteria.
- update stage and wave status.

Forbidden:
- runtime code changes.
- production/default rollout.
- LiveKit removal.
- env default changes.
- TURN/SFU infrastructure changes.
- Stage 6 or Postgres production migration changes.
- production readiness or multi-process readiness claims.

Compatibility requirements:
- channel `VIDEO` pilot remains gated by `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- ordinary channel `VIDEO` without the pilot gate remains LiveKit/default.
- ordinary private `?video=true` remains LiveKit/default.
- explicit rollback remains preserved through `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`.

## Minimum Observability Signals

The next instrumentation segment should expose local/dev-readable signals for the channel `VIDEO` SFU pilot. The first version can be process-local and non-production only; it must not claim production monitoring readiness.

Room and lifecycle gauges:
- active SFU room count.
- active participant session count.
- active send/receive transport count.
- active producer count by `kind` and `source`: `audio/microphone`, `video/camera`, `video/screen`.
- active consumer count by `kind` and `source`.
- per-room participant/session/transport/producer/consumer breakdown.

Cleanup signals:
- stale session cleanup sweep count.
- stale session cleanup closed session count.
- stale cleanup closed transport/producer/consumer counts.
- last stale cleanup timestamp.
- active counts before and after cleanup when available.

Failure/recovery counters:
- failed join count.
- failed transport create/connect count.
- failed produce count.
- failed consume count.
- failed backend consumer resume count.
- failed rejoin count.
- client-visible failed state count when the UI reports SFU `failed`.
- successful Restart recovery count.
- successful failed-state Restart -> control-plane rejoin recovery count.

Screen-share signals:
- screen-share start count.
- screen-share stop count.
- screen-share takeover count.
- older screen producer closed due to takeover count.
- local display track stopped because another participant took over count.
- current active screen presenter per room when a screen producer exists.

Transport mode visibility:
- selected or requested transport mode per run: `direct` or `turn`.
- TURN credential issuance enabled/disabled state for local/dev.
- room/session transport mode summary where available.

Remote track expectation visibility:
- per-room joined participant count.
- per-client or smoke-observed remote track breakdown: `audio`, `camera`, `screen`.
- expected remote track count for no screen-share: `(joinedParticipants - 1) audio` and `(joinedParticipants - 1) camera` per client.
- expected screen track count: at most one active room screen-share; a non-presenter sees one remote `screen` track, while the active presenter sees local screen preview and no duplicate remote copy of self.

## Bounded Long-Soak Scenarios

All mandatory scenarios are local/dev, non-production, and gated. They should use real capture where practical and fake devices only where explicitly called out.

1. 2-user channel `VIDEO` direct soak
- enable `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- join two users without per-URL SFU query.
- verify remote audio/video, no screen-share, restart once, leave/rejoin once, and rollback URLs.
- expected remote tracks per client: `audio=1`, `camera=1`, `screen=0`.

2. 3-user channel `VIDEO` direct soak
- join three users without per-URL SFU query.
- verify all clients receive remote audio/video from the other two participants.
- expected remote tracks per client before screen-share: `audio=2`, `camera=2`, `screen=0`.

3. 5-user fake-device channel `VIDEO` direct soak
- use fake media devices for load/lifecycle confidence.
- verify joins settle, remote track counts do not inflate across participants, and cleanup settles after context close.
- expected remote tracks per client before screen-share: `audio=4`, `camera=4`, `screen=0`.

4. Screen-share takeover A -> B
- user A starts screen-share.
- user B sees one remote screen-share.
- user B starts screen-share.
- user A's local screen-share UI and display track stop.
- user A sees user B's remote screen-share.
- latest-wins remains true and the room never has two active screen producers after convergence.

5. Restart loop
- repeatedly press Restart on one participant while another participant remains in the room.
- verify remote audio/video and screen-share recover.
- verify producers/consumers do not monotonically increase after each restart.

6. Leave/rejoin loop
- repeatedly leave and rejoin the same channel `VIDEO` room.
- verify old sessions/resources close and counts settle after each iteration.
- verify remote tracks do not duplicate.

7. Route change away/back loop
- navigate away from the channel route and back without relying only on explicit Leave.
- verify cleanup and rejoin behavior.
- verify no stale remote tracks or audible leaked media remain after route changes.

8. Failed -> Restart rejoin recovery
- reproduce or simulate the bounded failed-state path where possible.
- verify Restart triggers a fresh control-plane rejoin and reaches working remote audio/video.
- verify no failed state remains unrecoverable through Restart/rejoin.

9. Optional TURN rerun when local coturn is available
- rerun 2-user channel `VIDEO` pilot with `sfuTransport=turn`.
- include screen-share takeover if the relay path is stable.
- classify as `review / not run` if coturn is unavailable; do not block the direct-only long-soak plan on absent local TURN.

## Pass / Review / Fail Criteria

Pass:
- all mandatory direct scenarios complete without unrecoverable SFU failed state.
- remote audio/video stay working after joins, restarts, leave/rejoin, and route changes.
- no stale remote tracks remain after cleanup convergence.
- active room/session/transport/producer/consumer counts settle after leave/rejoin and browser context close.
- screen-share latest-wins remains true; at most one active room screen producer exists after takeover convergence.
- per-room remote track count expectations match participant count and screen-share state.
- failed state, if encountered, recovers through Restart -> control-plane rejoin.
- LiveKit fallback and rollback URLs still work.

Review:
- optional TURN rerun is not run because local coturn is unavailable.
- a rare failure is recovered but lacks enough repetitions for confidence.
- counts settle eventually but need wider timeout or better instrumentation to explain delay.
- product UX/audio/video quality needs human signoff even though lifecycle checks pass.
- observability is incomplete but enough to classify the current local run.

Fail:
- remote audio/video breaks and does not recover through Restart/rejoin.
- screen-share latest-wins is violated after convergence.
- stale remote tracks remain visible or audible after cleanup.
- room/session/transport/producer/consumer counts grow monotonically across restart or rejoin loops.
- a failed state cannot recover through Restart/rejoin.
- rollback via `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false` regresses.
- ordinary channel `VIDEO` without the pilot gate or ordinary private `?video=true` stops using LiveKit/default.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like long-soak.
- private default is not decided.

## Recommended Next Segment

Preferred implementation segment:
- `channel-video-sfu-limited-pilot-observability-instrumentation`

Alternative execution/report segment:
- `channel-video-sfu-limited-pilot-long-soak-run-report`

Not recommended next:
- production rollout.
- LiveKit removal.

## Acceptance Criteria

- observability signal list is documented.
- bounded long-soak scenarios are documented.
- pass/review/fail criteria are documented.
- plan-only scope and no-runtime-change guardrail are explicit.
- remaining blockers are explicit.
- recommended next segment avoids production rollout and LiveKit removal.

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
