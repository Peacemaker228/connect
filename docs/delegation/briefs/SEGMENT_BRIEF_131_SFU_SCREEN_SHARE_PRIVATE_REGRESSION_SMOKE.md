# SEGMENT BRIEF 131. SFU Screen-Share Private Regression Smoke

Branch:
- `wave/stage8-sfu-screen-share-private-regression-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-screen-share-private-regression-smoke`

## Goal

Verify that the shared SFU screen-share path did not regress the explicit private SFU path, while keeping ordinary private calls, channel defaults, production defaults, and LiveKit fallback unchanged.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_129_SFU_SCREEN_SHARE_PARITY_PROTOTYPE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_130_SFU_SCREEN_SHARE_GUARDED_BROWSER_SMOKE_RERUN.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Implementation

Test-only change:
- added guarded `PRIVATE_SFU_SMOKE_SCREEN_SHARE=1` assertions to `tests/browser/private-sfu-two-user-smoke.spec.ts`.

The default private SFU smoke remains unchanged unless the new flag is set.

New guarded assertions cover:
- user A starts screen share.
- user A sees local screen-share preview.
- user B sees remote screen-share render/video.
- user B remote producer count grows by `+1`.
- stopping screen share removes user B remote screen render.
- remote producer count returns to baseline.
- existing Restart and Leave redirect assertions remain in the same smoke.
- ordinary private `?video=true` remains LiveKit/default.

## Smoke Environment

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

Private screen-share smoke env:
- `PLAYWRIGHT_SCREEN_CAPTURE=1`
- `PRIVATE_SFU_BROWSER_SMOKE=1`
- `PRIVATE_SFU_SMOKE_SCREEN_SHARE=1`
- `PRIVATE_SFU_SMOKE_WEB_PORT=3001`
- `PRIVATE_SFU_SMOKE_API_PORT=4000`

Regression smoke env:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_USERS=2`
- `CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000`
- `PLAYWRIGHT_SCREEN_CAPTURE=1`
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000`

## Result

Private SFU direct screen-share smoke:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_SCREEN_SHARE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Observed:
- two authenticated explicit private SFU users connected.
- user A started screen share and saw local screen preview.
- user B saw remote screen-share render/video.
- user B remote producer count grew by `+1` while user A shared.
- Stop screen share removed the remote screen render.
- remote producer count returned to baseline.
- Restart remained pass.
- Leave redirect remained `/servers/:serverId/conversations/:memberId`.
- ordinary private `?video=true` remained LiveKit/default.

Channel `AUDIO` pilot regression:
- `pass`

Command:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Channel `VIDEO` screen-share regression:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

TURN:
- `deferred`

Reason:
- this segment intentionally verifies direct private regression only.
- before any broader/default relay-dependent decision, screen-share over TURN still needs a `pass` or explicit `review`.

## Handoff

Private screen-share result:
- `pass`

Cleanup behavior:
- Stop screen share removes remote render and restores producer count.
- Restart and Leave redirect remained pass in the guarded private smoke.

Regression status:
- channel `AUDIO` pilot regression: `pass`.
- channel `VIDEO` screen-share regression: `pass`.
- ordinary private `?video=true`: LiveKit/default preserved.
- LiveKit fallback/default preservation: `pass` through existing guarded assertions.

Remaining blockers before broader/default decisions:
- TURN screen-share relay smoke remains deferred.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- production TURN/SFU infra, monitoring, runbook, and rollback remain out of scope.
- broader subjective screen-share UX review may still be required before product-facing video/private default decisions.

Recommended next segment:
- `sfu-screen-share-turn-relay-smoke`

Suggested shape:
- run direct regression only as needed, then verify screen-share over local TURN relay for channel `VIDEO` and/or private SFU.
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

Guarded smoke commands:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_SCREEN_SHARE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Results:
- all standard verification commands passed.
- standard browser smoke commands skipped safely without env flags.
- all three guarded smoke commands passed.
