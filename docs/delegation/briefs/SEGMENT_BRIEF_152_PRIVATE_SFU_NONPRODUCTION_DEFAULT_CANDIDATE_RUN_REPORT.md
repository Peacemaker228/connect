# SEGMENT BRIEF 152. Private SFU Non-Production Default-Candidate Run Report

Branch:
- `wave/stage8-private-sfu-nonproduction-default-candidate-run-report`

Base:
- `8c3513a feat(stage8): add private sfu default candidate`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-nonproduction-default-candidate-run-report`

## Goal

Close the run report for the already implemented private SFU non-production default-candidate path.

## Scope

This is a docs-only closeout report for Segment 151.

No runtime code, environment defaults, production rollout/default behavior, LiveKit fallback/removal, production TURN/SFU infrastructure, or Stage 6/Postgres production migration docs were changed.

## Evidence

Segment 151 added the private SFU default-candidate env gate:
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`

Ordinary private `?video=true` can enter the SFU path only when all are true:
- route scope is private/conversation.
- audio and video are requested.
- runtime is non-production.
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.
- no explicit LiveKit rollback query is present.

Rollback remains preserved:
- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

## Final Classification

Private SFU non-production default-candidate:
- `pass`.

Candidate direct smoke:
- `pass`.

Candidate screen-share smoke:
- `pass`.

Explicit private SFU regression:
- `pass`.

LiveKit rollback:
- `preserved`.

Ordinary private `?video=true`:
- enters SFU only in non-production and only under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.

Channel `AUDIO`:
- unchanged.

Channel `VIDEO`:
- unchanged.

Production default:
- `blocked`.

LiveKit removal:
- `blocked`.

Stage 6/Postgres production migration:
- untouched.

## Remaining Blockers

- production default remains blocked.
- production media readiness remains blocked by process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- LiveKit removal remains blocked.

## Recommended Next Runtime Segment

- `private-sfu-nonproduction-default-candidate-long-soak-coverage`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure work.
- Stage 6/Postgres production migration work.

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
