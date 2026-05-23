# SEGMENT BRIEF 134. Channel VIDEO SFU Limited Non-Production Default Pilot

Branch:
- `wave/stage8-channel-video-sfu-limited-nonproduction-default-pilot`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-nonproduction-default-pilot`

## Goal

Add a limited, reversible, non-production product-default pilot for channel `VIDEO` SFU without a production/default switch, without changing private defaults, and without weakening LiveKit fallback.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_133_SFU_SCREEN_SHARE_READINESS_DECISION.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Implementation

Runtime gate:
- added `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`.

Gate behavior:
- channel `VIDEO` only.
- `NODE_ENV !== 'production'` only.
- off by default.
- opens channel `VIDEO` SFU without per-URL `mediaProvider=sfu`, `sfuChannel=true`, `sfuVideo=true`, or `sfuCapture=real` query params.
- uses real capture mode, matching the existing channel `VIDEO` candidate gate behavior.
- does not affect private calls.
- does not affect channel `AUDIO` pilot/gates.

Rollback overrides:
- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

These overrides suppress the product-default pilot and force the existing LiveKit path.

Test changes:
- `tests/browser/channel-video-sfu-smoke.spec.ts` now supports `CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1`.
- in pilot/candidate mode the smoke opens channel `VIDEO` without per-URL SFU query.
- smoke assertions cover rollback via all three rollback query forms.
- smoke assertions now include ordinary private `?video=true` LiveKit preservation.

## Smoke Environment

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

Web env:
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Direct pilot smoke env:
- `PLAYWRIGHT_SCREEN_CAPTURE=1`
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1`
- `CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000`

TURN pilot smoke env:
- same as direct, plus `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`

Channel `AUDIO` regression env:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_USERS=2`
- `CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000`

## Result

Channel `VIDEO` product-default pilot direct smoke:
- `pass`

Observed:
- channel `VIDEO` opened through SFU without per-URL SFU query.
- screen-share in pilot path passed.
- local screen preview and remote screen render passed.
- remote producer count grew by `+1` and recovered to baseline after Stop.
- Restart passed.
- Leave/rejoin cleanup passed.
- rollback to LiveKit via `?mediaProvider=livekit` passed.
- rollback to LiveKit via `?livekit=true` passed.
- rollback to LiveKit via `?sfu=false` passed.
- ordinary private `?video=true` remained LiveKit/default.

Channel `VIDEO` product-default pilot TURN smoke:
- `pass`

Observed:
- same pilot path passed with `sfuTransport=turn`.
- coturn/runtime setup from Segment 132 was still available.

Channel `AUDIO` regression:
- `pass`

Private default preservation:
- `pass`

Production/default preservation:
- production remains blocked by `NODE_ENV !== 'production'`.
- product-default pilot env is off by default.
- no production infra/env/nginx/firewall changes were made.
- LiveKit fallback/default was not removed or weakened.

## Handoff

Exact gate:
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Pilot result:
- direct: `pass`
- TURN: `pass`
- rollback: `pass`
- screen-share: `pass`

What remains LiveKit/default:
- production.
- channel `VIDEO` without the env gate.
- channel `AUDIO` unless its own scoped gates/pilot are enabled.
- ordinary private `?video=true`.
- explicit rollback URLs.

Remaining blockers:
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- production TURN/SFU infra, monitoring, runbook, and rollback remain out of scope.
- subjective product UX/operator review remains review before broader product-facing rollout.

Recommended next segment:
- `channel-video-sfu-limited-pilot-soak-product-review`

Suggested shape:
- repeat video pilot with product/operator review checklist.
- include direct/TURN, screen-share, restart, leave/rejoin, rollback, no-camera fallback, and subjective UX notes.
- keep production/default routes and LiveKit fallback unchanged.

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

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Results:
- all standard verification commands passed.
- standard browser smoke commands skipped safely without env flags.
- all guarded smoke commands passed.
