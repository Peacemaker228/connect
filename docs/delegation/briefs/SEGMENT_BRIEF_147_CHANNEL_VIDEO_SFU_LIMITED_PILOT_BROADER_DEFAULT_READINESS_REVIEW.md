# SEGMENT BRIEF 147. Channel VIDEO SFU Limited Pilot Broader Default Readiness Review

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-broader-default-readiness-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-broader-default-readiness-review`

## Goal

Make a bounded readiness decision for the channel `VIDEO` SFU limited non-production pilot after the long-soak fixes and coverage segments.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_143_CHANNEL_VIDEO_SFU_LIMITED_PILOT_LONG_SOAK_ENV_UNBLOCK_RERUN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_144_CHANNEL_VIDEO_SFU_MULTI_USER_SCREEN_SHARE_REJOIN_CLEANUP_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_145_CHANNEL_VIDEO_SFU_FAILED_RESTART_RECOVERY_SOAK_COVERAGE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_146_CHANNEL_VIDEO_SFU_ROUTE_AWAY_BACK_LOOP_COVERAGE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- docs-only readiness decision.
- update `MEDIA_MVP_IMPLEMENTATION_PLAN.md` and `STAGE_STATUS.md`.

Out of scope:
- production rollout/default switch.
- LiveKit removal.
- production infra/env changes.
- broad private default switch.
- enabling any broader default without a separate explicit implementation segment.

## Evidence Reviewed

Passing evidence after fixes:
- 2-user channel `VIDEO` product-default pilot with screen-share takeover: `pass`.
- 3-user channel `VIDEO` without screen-share: `pass`.
- 5-user fake-device channel `VIDEO` without screen-share: `pass`.
- 3-user screen-share takeover plus leave/rejoin: fixed in Segment 144 and rerun as `pass`.
- failed/offline Restart recovery: bounded `pass` in Segment 145 with `failedStateRejoinRecoveryCount` incrementing from `0` to `1`.
- route away/back without pressing Leave: bounded `pass` in Segment 146.
- health counters settled to zero active rooms/sessions/transports/producers/consumers after cleanup convergence in the post-fix runs.
- `failedConsumeCount` stayed `0` in the Segment 144-146 post-fix reruns.
- LiveKit fallback/default preservation remained `pass` through guarded channel `VIDEO` smoke assertions.
- ordinary private `?video=true` remained LiveKit/default; private default was not changed.

TURN evidence:
- the latest optional TURN rerun was not performed because local coturn was not available in the Segment 143 environment.
- earlier channel `VIDEO` TURN and channel `VIDEO` screen-share TURN checks passed through local Docker coturn.
- this is enough for the next non-production default-candidate implementation segment, but not enough for production TURN/SFU readiness claims.

## Decision

Channel `VIDEO` limited non-production pilot:
- `pass for broader non-production default-candidate review`.

Broader product-facing default:
- moves from `review / hold` to `ready for a separate non-production default-candidate implementation segment`.
- no broader/default switch is made in this segment.

Optional local TURN rerun:
- `not required before the next non-production default-candidate implementation segment`.
- remains recommended before any TURN-sensitive expansion claim.
- remains required before any production media readiness claim.

Production default:
- `blocked`.

Production media infra readiness:
- `blocked`.

Multi-process readiness:
- `blocked` because mediasoup/signaling state is still process-local.

LiveKit removal:
- `blocked`.

Private default:
- `hold`.

LiveKit fallback:
- `preserved`.

## Non-Goals / Blocked Items

This decision does not:
- enable production default.
- enable a broader default in runtime code.
- remove LiveKit.
- change env defaults.
- change production TURN/SFU infrastructure.
- claim production media readiness.
- claim multi-process readiness.
- decide or enable private SFU default.

## Remaining Blockers Before Production Or Multi-Process

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook.
- no production monitoring/alerting.
- no production process management plan.
- no production rollback plan.
- no production-like soak.
- no current production TURN rerun/evidence.
- LiveKit fallback remains required.

## Recommended Next Segment

- `channel-video-sfu-broader-nonproduction-default-candidate-implementation`

Acceptable alternative:
- `channel-video-sfu-optional-local-turn-rerun`

Not recommended next:
- production rollout.
- LiveKit removal.
- private default switch.
- broader/default switch without the explicit implementation segment above.

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
- standard verification commands passed after this docs-only segment.
- standard browser smoke scripts without guarded env flags skipped safely where expected.
