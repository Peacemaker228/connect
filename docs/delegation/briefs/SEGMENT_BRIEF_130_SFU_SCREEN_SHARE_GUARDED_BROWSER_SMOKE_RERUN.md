# SEGMENT BRIEF 130. SFU Screen-Share Guarded Browser Smoke Rerun

Branch:
- `wave/stage8-sfu-screen-share-guarded-browser-smoke-rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-screen-share-guarded-browser-smoke-rerun`

## Goal

Close the direct SFU screen-share proof as pass/review/blocked through a guarded local browser smoke, without a production/default switch and without weakening LiveKit fallback.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_129_SFU_SCREEN_SHARE_PARITY_PROTOTYPE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Smoke Environment

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

API process:
- restarted on the current branch before the rerun so source-aware producer metadata and screen-share backend behavior were active.
- local mediasoup direct profile used `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0` and `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=127.0.0.1`.

Screen-share smoke env:
- `PLAYWRIGHT_SCREEN_CAPTURE=1`
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000`

Regression smoke env:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_AUDIO_SFU_SMOKE_USERS=2`
- `CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001`
- `CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000`

## Result

Direct channel `VIDEO` SFU screen-share smoke:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Observed by guarded assertions:
- user A starts screen share.
- user A sees local screen-share preview.
- user B sees remote screen-share render area/video.
- user B remote producer count grows by `+1`.
- stopping screen share removes user B remote screen render.
- remote producer count returns to baseline.
- Restart recovery still passes.
- Leave/rejoin cleanup still passes.
- ordinary channel `VIDEO` without the full SFU gate remains LiveKit/default.
- channel `AUDIO` without the channel video gate remains LiveKit/default.

Channel `AUDIO` SFU regression:
- `pass`

Command:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Observed:
- two authenticated channel `AUDIO` SFU users connected.
- expected remote producer count was preserved.
- route-change/rejoin and leave behavior remained covered by the existing guarded smoke.
- LiveKit rollback/default assertions remained covered by the smoke.

TURN:
- `not required / deferred`

Reason:
- this segment intentionally closes direct screen-share proof only.
- TURN screen-share should be a later narrow smoke after direct remains stable.

## Handoff

Screen-share direct result:
- `pass`

Cleanup behavior:
- manual Stop screen share removes remote screen render and restores producer count.
- Restart and Leave/rejoin remained pass in the guarded channel `VIDEO` smoke.

Regression status:
- channel `AUDIO` pilot regression: `pass`.
- channel `VIDEO` existing explicit gate: `pass`.
- LiveKit fallback/default preservation: `pass` through existing guarded assertions.
- private default remains LiveKit; private SFU screen-share was not separately smoked in this segment.

Remaining blockers before video/private/default decisions:
- TURN screen-share relay smoke remains deferred.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- production TURN/SFU infra, monitoring, runbook, and rollback remain out of scope.
- broader subjective screen-share UX review may still be required before product-facing default decisions.

Recommended next segment:
- `sfu-screen-share-private-regression-smoke`

Suggested shape:
- run a guarded private SFU direct screen-share regression because the screen-share control now lives in the shared SFU adapter.
- keep TURN screen-share deferred until broader channel `VIDEO` or private default readiness requires relay proof.
- keep production/default routes and LiveKit fallback unchanged.

## Verification Performed

Commands:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Results:
- both guarded smoke commands passed.
