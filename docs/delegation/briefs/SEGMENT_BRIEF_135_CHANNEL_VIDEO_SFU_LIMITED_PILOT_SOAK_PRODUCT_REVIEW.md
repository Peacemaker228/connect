# SEGMENT BRIEF 135. Channel VIDEO SFU Limited Pilot Soak Product Review

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-soak-product-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-soak-product-review`

## Goal

Review the channel `VIDEO` SFU product-default pilot as a controlled non-production pilot, without production/default rollout, broad default switch, private default switch, production infra changes, or LiveKit removal.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_134_CHANNEL_VIDEO_SFU_LIMITED_NONPRODUCTION_DEFAULT_PILOT.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Environment

Web env:
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

TURN:
- local `connect-coturn-local` from prior TURN segments remained available.
- API TURN env from prior TURN segments remained available.

## Automated Review Result

Channel `VIDEO` product-default pilot direct, 2 users:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Channel `VIDEO` product-default pilot direct, 3 users:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Channel `VIDEO` product-default pilot TURN, 2 users:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Channel `AUDIO` regression:
- `pass`

Command:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Covered by automated channel `VIDEO` smoke:
- channel `VIDEO` opens SFU without query when the pilot env is enabled.
- screen-share start/stop.
- local screen preview.
- remote screen render.
- producer count `+1` and recovery to baseline.
- restart.
- leave/rejoin.
- rollback via `?mediaProvider=livekit`.
- rollback via `?livekit=true`.
- rollback via `?sfu=false`.
- ordinary private `?video=true` remains LiveKit/default.
- no-camera fallback remains audio-only.
- ordinary channel `AUDIO` remains outside the channel `VIDEO` pilot.

## Product / Manual Review

Manual product review:
- `review / requires operator`

Reason:
- no honest subjective pass is claimed without a human/operator reviewing real perceived video/audio quality, layout readability, screen-share UX, controls clarity, and post-leave/rejoin/restart feel.
- automated browser smoke proves functional lifecycle but does not replace product judgment.

Checklist for operator follow-up:
- video quality: pass/review/fail.
- audio quality: pass/review/fail.
- screen-share UX: pass/review/fail.
- layout readability: pass/review/fail.
- controls clarity: pass/review/fail.
- no strange hang after leave/rejoin/restart: pass/review/fail.
- rollback links return LiveKit: pass/review/fail.

## Decision

Channel `VIDEO` limited non-production product-default pilot:
- `pass for automated controlled review`
- `review for subjective product/manual signoff`

Production readiness:
- `blocked`

Reason:
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- production TURN/SFU infra, firewall, monitoring, runbook, process management, and rollback remain out of scope.

Defaults/fallback:
- production remains LiveKit/default.
- ordinary private `?video=true` remains LiveKit/default.
- channel `AUDIO` pilot/gates remain unchanged.
- LiveKit fallback/default remains preserved.

## Handoff

What changed:
- docs/report only.

Automated result:
- 2-user direct: `pass`.
- 3-user direct: `pass`.
- 2-user TURN: `pass`.
- channel `AUDIO` regression: `pass`.
- private default LiveKit preservation: `pass`.

Product/manual result:
- `review / requires operator`.

Remaining blockers:
- subjective product/operator signoff before broader product-facing rollout.
- process-local media/signaling state.
- production media infra/runbook/monitoring/rollback.

Recommended next segment:
- `channel-video-sfu-limited-pilot-operator-review-rerun`

Alternative if operator review is deferred:
- `channel-video-sfu-product-default-readiness-decision`

## Verification Performed

Guarded smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=3 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=2 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Results:
- all guarded smoke commands passed.
