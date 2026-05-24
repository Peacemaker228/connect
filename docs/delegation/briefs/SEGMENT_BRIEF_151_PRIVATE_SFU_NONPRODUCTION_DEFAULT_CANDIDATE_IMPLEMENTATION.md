# SEGMENT BRIEF 151. Private SFU Non-Production Default-Candidate Implementation

Branch:
- `wave/stage8-private-sfu-nonproduction-default-candidate-implementation`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-nonproduction-default-candidate-implementation`

## Goal

Enable ordinary private `?video=true` calls to use the SFU path only as a controlled non-production default-candidate, while preserving LiveKit fallback and rollback.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_150_CHANNEL_VIDEO_SFU_BROADER_NONPRODUCTION_DEFAULT_CANDIDATE_RUN_REPORT.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `src/lib/shared/features/media-room.tsx`
- `tests/browser/private-sfu-two-user-smoke.spec.ts`

## Scope

Implemented:
- added the non-production private SFU default-candidate env gate:
  - `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`
- ordinary private `?video=true` can enter the SFU path without `mediaProvider=sfu` only when:
  - the route scope is `conversation`
  - audio and video are requested
  - `NODE_ENV !== 'production'`
  - no explicit LiveKit rollback query is present
  - `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`
- default-candidate private SFU uses real capture mode by default, matching the product private video call path.
- explicit private SFU query path remains supported.
- LiveKit rollback remains explicit through:
  - `?mediaProvider=livekit`
  - `?livekit=true`
  - `?sfu=false`

Not changed:
- channel `AUDIO` behavior.
- channel `VIDEO` behavior.
- production default behavior.
- LiveKit fallback/removal.
- production TURN/SFU infra.
- Stage 6 production Postgres migration.

## Test Updates

- `tests/browser/private-sfu-two-user-smoke.spec.ts` now supports:
  - `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`
- in candidate mode, the smoke opens ordinary private `?video=true` without `mediaProvider=sfu`.
- rollback assertion uses `?video=true&mediaProvider=livekit` and verifies the SFU provider is not rendered.
- default candidate mode treats capture as real unless `PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera` is explicitly used.

## Classification

Implementation:
- `done`.

Private SFU non-production default-candidate:
- `pass`.

Guarded smoke:
- direct candidate with ordinary `?video=true`: `pass`.
- direct candidate with screen-share: `pass`.
- explicit private SFU regression: `pass`.
- LiveKit rollback assertion: `pass`.

Production default:
- `blocked`.

LiveKit fallback:
- `preserved`.

Channel defaults:
- `unchanged`.

## Verification Performed

Static/code verification:
- `pass`.

Performed:
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
- guarded private candidate smoke with:
  - `PRIVATE_SFU_BROWSER_SMOKE=1`
  - `PRIVATE_SFU_SMOKE_DEFAULT_CANDIDATE=1`
  - `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`
- guarded private candidate screen-share smoke with:
  - `PRIVATE_SFU_SMOKE_SCREEN_SHARE=1`
  - `PLAYWRIGHT_SCREEN_CAPTURE=1`
- guarded explicit private SFU regression smoke without the default-candidate env gate.

## Remaining Blockers

- production default remains blocked by process-local mediasoup/signaling state and missing production SFU/TURN infra/runbook/monitoring/rollback.
- LiveKit removal remains blocked.

## Recommended Next Segment

Recommended after successful verification:
- `private-sfu-nonproduction-default-candidate-run-report`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure changes.
