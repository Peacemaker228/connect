# SEGMENT BRIEF 106. Private SFU Real Capture Device Fallback

Branch:
- `wave/stage8-private-sfu-real-capture-device-fallback`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-real-capture-device-fallback`

## Goal

Make gated private SFU real capture degrade gracefully when a camera is missing, so audio-only QA can continue on no-camera machines.

## What Changed

Private SFU real capture:
- `sfuCapture=real` still first attempts requested audio+video capture.
- missing-video-device capture errors are now classified as camera-missing conditions.
- when video capture fails because the camera is missing and `audio=true`, the private SFU path retries `getUserMedia` as audio-only.
- when audio-only fallback succeeds, the call continues and publishes the audio track.
- the UI shows `Camera not found; continuing audio-only`.
- the camera control remains disabled when no video track is created.
- if neither requested capture nor audio-only fallback succeeds, the failure detail is explicit.

Browser smoke:
- added `PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera`.
- the smoke opens `?video=true&mediaProvider=sfu&sfuCapture=real&sfuSimulateMissingCamera=true`.
- the fallback smoke expects one remote producer, the audio toggle to work, and the camera control to remain disabled.

Preserved:
- synthetic capture remains the default.
- real audio+video capture remains compatible.
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- no broad replacement started.
- no production infra/env/nginx/firewall/deploy changes were made.

## Smoke Results

Direct synthetic private SFU:
- status: `pass`
- result: `1 passed`
- confirms synthetic default did not regress.

Direct real audio+video private SFU:
- status: `pass`
- result: `1 passed`
- confirms the fake-device real audio+video path still produces two remote producers per participant.

Direct no-camera fallback private SFU:
- status: `pass / simulated missing-camera`
- result: `1 passed`
- simulated missing camera degraded to audio-only.
- both authenticated participants reached `connected`.
- each participant observed one remote producer.
- capture notice was shown.
- microphone toggle worked.
- camera control was disabled.

LiveKit fallback:
- status: `pass / preserved`
- ordinary private `?video=true` remains LiveKit.
- channel audio/video routes remain LiveKit.

## Parity Status

No-camera fallback:
- status: `pass / simulated`
- expected to unblock physical no-camera audio-only QA.
- still needs one operator rerun on the actual no-camera machine to record physical result.

No mic and no camera:
- status: `clear fail`
- if audio-only fallback also fails, the UI reports that camera was not found and audio-only fallback failed.

Real audio+video:
- status: `pass / fake-device`
- no regression observed in automated fake-device smoke.

## Handoff

What changed:
- added graceful audio-only fallback for missing-camera real capture.
- added browser smoke coverage for simulated missing-camera fallback.
- kept synthetic default and LiveKit fallback intact.

No-camera fallback result:
- `pass / simulated missing-camera`

Synthetic result:
- `pass`

LiveKit fallback result:
- `pass / preserved`

Remaining manual QA blockers:
- rerun physical no-camera `sfuCapture=real` QA and confirm audio-only fallback on the operator machine.
- run physical microphone/camera permission UX QA where real devices exist.
- run network interruption reconnect/resume QA.
- decide whether SFU screen-share is implemented or explicitly deferred for MVP.

Recommended next segment:
- `private-sfu-operator-no-camera-fallback-rerun`

Reason:
- the code fallback is in place and automated simulated fallback passes; the next useful step is an operator rerun on the actual no-camera machine that exposed the blocker.

## Verification Performed

Commands:
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
- `git diff --check`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
