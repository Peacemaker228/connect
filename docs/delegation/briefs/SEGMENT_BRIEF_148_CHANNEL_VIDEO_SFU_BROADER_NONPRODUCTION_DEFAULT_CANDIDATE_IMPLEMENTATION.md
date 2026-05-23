# SEGMENT BRIEF 148. Channel VIDEO SFU Broader Non-Production Default-Candidate Implementation

Branch:
- `wave/stage8-channel-video-sfu-broader-nonproduction-default-candidate-implementation`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-broader-nonproduction-default-candidate-implementation`

## Goal

Implement the broader non-production default-candidate path for channel `VIDEO` SFU in a strictly reversible and production-blocked way.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_147_CHANNEL_VIDEO_SFU_LIMITED_PILOT_BROADER_DEFAULT_READINESS_REVIEW.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `src/lib/shared/features/media-room.tsx`
- `tests/browser/channel-video-sfu-smoke.spec.ts`

## Implementation

No new environment flag was added.

The existing gate already implements the required broader non-production default-candidate behavior:
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`

Changed `src/lib/shared/features/media-room.tsx`:
- renamed the local channel `VIDEO` default-candidate boolean to `isChannelVideoSfuBroaderDefaultCandidateRequested`.
- preserved the existing env gate and runtime behavior.
- kept the existing production block through `process.env.NODE_ENV !== 'production'`.
- kept explicit LiveKit rollback precedence through `isLiveKitProviderRequested`.

Changed docs:
- recorded this implementation and the exact gate semantics.
- kept production/default rollout and LiveKit removal blocked.

No production behavior switch, LiveKit removal, private default switch, production infra/env change, channel `AUDIO` behavior change, or retry/loop behavior changed.

## Exact Gate Behavior

Channel `VIDEO` SFU can open without SFU query params when all are true:
- `mediaEntry.scope.kind === 'channel'`
- `audio === true`
- `video === true`
- `NODE_ENV !== 'production'`
- no explicit LiveKit rollback query is present
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`

The limited pilot gate remains available and unchanged:
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Explicit query SFU access remains unchanged for non-production testing:
- `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real`

## Rollback Behavior

Explicit rollback still forces LiveKit/default and wins over both candidate and pilot gates:
- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

LiveKit fallback/default is preserved.

## Production Block Proof

The default-candidate path is blocked by the existing `isNonProductionRuntime` guard:
- `const isNonProductionRuntime = process.env.NODE_ENV !== 'production'`

The channel `VIDEO` broader default-candidate boolean includes that guard before checking:
- `process.env.NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE === '1'`

`isSfuGateOpen` also requires:
- `isSfuGateRequested && isNonProductionRuntime`

Therefore `NODE_ENV=production` does not open the channel `VIDEO` SFU default-candidate path even if the public env is accidentally set.

## Regression Boundaries

Unchanged:
- ordinary channel `VIDEO` without candidate/pilot gate remains LiveKit/default.
- ordinary private `?video=true` remains LiveKit/default.
- channel `AUDIO` behavior is unchanged.
- LiveKit rollback queries remain preserved.
- product-default pilot gate remains unchanged.

## Smoke Results

Guarded broader default-candidate channel `VIDEO` smoke:
- `pass`
- ran with `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- ran without SFU query params.
- covered screen-share takeover, Restart, route away/back, leave/rejoin, no-camera fallback, LiveKit rollback/default assertions, ordinary private `?video=true` LiveKit/default preservation, and channel `AUDIO` non-regression assertion inside the channel `VIDEO` smoke.
- final local/dev health settled to zero active rooms/sessions/transports/producers/consumers after stale cleanup convergence.

Failed Restart recovery:
- Segment 145 remains the latest targeted pass.
- the helper path and runtime logic were not changed in this segment.

## Decision

Broader channel `VIDEO` non-production default-candidate path:
- `implemented / pass for guarded local smoke`.

Production default:
- remains `blocked`.

Production media infra readiness:
- remains `blocked`.

Multi-process readiness:
- remains `blocked` because mediasoup/signaling state is process-local.

LiveKit removal:
- remains `blocked`.

Private default:
- remains `hold`.

LiveKit fallback:
- remains `preserved`.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- no production-like soak.
- optional latest local TURN rerun was not performed in this segment.
- private default is not decided.
- LiveKit fallback remains required.

## Recommended Next Segment

- `channel-video-sfu-broader-nonproduction-default-candidate-run-report`

Acceptable alternative:
- `channel-video-sfu-optional-local-turn-rerun`

Not recommended next:
- production rollout.
- LiveKit removal.
- private default switch.

## Verification Performed

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_CANDIDATE_GATE=1 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK=1 CHANNEL_VIDEO_SFU_SMOKE_ROUTE_AWAY_BACK_ITERATIONS=1 CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=0 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu` - passed.

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
