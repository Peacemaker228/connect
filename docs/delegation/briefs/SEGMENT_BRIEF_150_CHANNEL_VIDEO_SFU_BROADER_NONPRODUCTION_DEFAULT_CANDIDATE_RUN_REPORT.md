# SEGMENT BRIEF 150. Channel VIDEO SFU Broader Non-Production Default-Candidate Run Report

Branch:
- `wave/stage8-channel-video-sfu-broader-nonproduction-default-candidate-run-report`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-broader-nonproduction-default-candidate-run-report`

## Goal

Close the final run report for the channel `VIDEO` SFU broader non-production default-candidate path.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_147_CHANNEL_VIDEO_SFU_LIMITED_PILOT_BROADER_DEFAULT_READINESS_REVIEW.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_148_CHANNEL_VIDEO_SFU_BROADER_NONPRODUCTION_DEFAULT_CANDIDATE_IMPLEMENTATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_149_CHANNEL_VIDEO_SFU_OPTIONAL_LOCAL_TURN_RERUN.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

This is a docs-only closeout report.

No runtime code, environment defaults, production TURN/SFU infrastructure, production rollout/default behavior, LiveKit fallback, or private default behavior changed.

## Evidence Summary

Segment 147 readiness review:
- channel `VIDEO` limited non-production pilot passed broader non-production default-candidate review.
- post-fix evidence included 2-user screen-share takeover, 3-user no-screen, 5-user fake-device no-screen, fixed 3-user screen-share takeover plus leave/rejoin, bounded failed/offline Restart recovery, bounded route away/back, cleanup convergence to zero active media resources, and preserved LiveKit rollback/default behavior.

Segment 148 implementation:
- broader non-production default-candidate path was implemented using the existing gate:
  - `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- no new env flag was added.
- channel `VIDEO` SFU can open without SFU query params only in non-production under the candidate gate.
- `NODE_ENV=production` remains blocked.
- explicit LiveKit rollback remains preserved through:
  - `?mediaProvider=livekit`
  - `?livekit=true`
  - `?sfu=false`
- ordinary private `?video=true` remains LiveKit/default.
- guarded direct local smoke passed without SFU query params.

Segment 149 optional local TURN rerun:
- local Docker coturn started and `127.0.0.1:3478` became reachable.
- guarded channel `VIDEO` broader candidate TURN smoke passed with 3 users and `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`.
- local/dev health observed `transportModeCounts.turn=6` during the smoke.
- app-level SFU failure counters stayed `0`.
- final active rooms/sessions/transports/producers/consumers settled back to `0`.
- coturn logs showed authenticated TURN sessions and cleanup back to zero allocations.
- transient local `508 Cannot create socket` entries were observed from the small default relay port range, so the local TURN result carries a relay-range review note.

## Final Classification

Channel `VIDEO` broader non-production default-candidate:
- `pass`.

Direct local smoke:
- `pass`.

Local TURN smoke:
- `pass with relay-range review note`.

Screen-share:
- `pass`.

Route away/back:
- `pass`.

Failed Restart recovery:
- `pass`.

Cleanup health:
- `pass`; active rooms/sessions/transports/producers/consumers settle to `0` after cleanup convergence.

Rollback to LiveKit:
- `preserved`.

Ordinary private `?video=true`:
- remains LiveKit/default.

Production default:
- `blocked`.

Production media infra readiness:
- `blocked`.

Multi-process readiness:
- `blocked` because mediasoup/signaling state is process-local.

LiveKit removal:
- `blocked`.

Private default:
- `hold`.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like soak.
- latest TURN evidence is local Docker coturn only, not production TURN evidence.
- local coturn relay range should be widened before heavier local TURN stress.
- private default is not decided.
- LiveKit fallback remains required.

## Closeout Decision

The channel `VIDEO` SFU broader non-production default-candidate track is closed as:
- `pass for non-production default-candidate`.

This closeout does not authorize:
- production rollout.
- production default.
- LiveKit removal.
- private SFU default.
- production TURN/SFU infrastructure changes.
- multi-process readiness claims.

## Recommended Next Segment

Recommended:
- `private-sfu-nonproduction-default-candidate-implementation`

Note:
- keep the next segment code/runtime-focused.
- begin with an upfront private-SFU evidence check, but do not turn it into a standalone docs-only readiness loop.
- if the evidence check finds a blocker, stop and report it instead of enabling the candidate gate.

Acceptable:
- another scoped Stage 8 media track.

Not recommended next:
- production rollout.
- LiveKit removal.
- ungated private default switch.
- production TURN/SFU infrastructure work inside the local MVP verification track.

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
- standard verification commands passed after this docs-only update.
- standard browser smoke scripts without guarded env flags skipped safely as expected.
