# SEGMENT BRIEF 105. Private SFU Manual Device Reconnect QA

Branch:
- `wave/stage8-private-sfu-manual-device-reconnect-qa`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-manual-device-reconnect-qa`

## Goal

Run or document manual QA for gated private SFU physical device behavior and reconnect/network interruption behavior before any small-room/channel replacement work.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- gated private SFU remains explicit and non-production only:
  - `?video=true&mediaProvider=sfu`
  - `?video=true&sfu=true`
- real capture remains explicit:
  - `sfuCapture=real`
- TURN relay remains explicit:
  - `sfuTransport=turn`
  - `sfuIce=relay`
- no production infra/env/nginx/firewall/deploy changes were made.

Not changed:
- no channel/small-room route was switched to SFU.
- no ordinary private call default was switched to SFU.
- no LiveKit fallback was removed or weakened.
- no Stage 6 production Postgres work was touched.

## Manual QA Status

Manual physical-device QA:
- status: `partial / synthetic pass / real capture blocked`
- operator result: two authenticated users joined the gated private SFU path without `sfuCapture=real`; both reached `connected`, each created a producer and consumer, and each observed `Remote producers: 1`.
- real capture result: `sfuCapture=real` failed with `Requested device not found` because the operator machine has no physical camera available.
- reason: this agent session cannot validate the user's real OS/browser permission dialogs, physical microphone/camera quality, device picker behavior, or real camera LED/device ownership.
- prior automated coverage: Segment 104 passed Chromium fake-device real-capture smoke with `sfuCapture=real`, two remote producers, and mic/camera toggle checks.

Permission/device UX:
- status: `review / camera-missing fallback needed`
- operator finding: when `audio on, video on` real capture cannot find a camera, the private SFU call fails before publishing any local track and the media controls remain disabled.
- expected manual checks:
  - open two authenticated browser contexts/users.
  - join a private conversation URL with `?video=true&mediaProvider=sfu&sfuCapture=real`.
  - accept or deny camera/microphone prompts.
  - confirm visible failure state if permission is denied.
  - confirm local video appears after permission is granted.
  - confirm remote user receives audio/video producers.
  - click mute/unmute and camera stop/start and verify local/remote behavior.

Network interruption reconnect/resume:
- status: `review / not manually executed`
- reason: no safe real network-disconnect action was performed from this agent session.
- prior automated coverage: Segment 104 passed user-triggered restart recovery, which proves local cleanup/recreate transport flow but not real network interruption recovery.
- expected manual checks:
  - join gated private SFU with two users.
  - temporarily disable one browser's network or block API/media traffic.
  - observe whether status changes to failed/waiting and whether remote producer state is cleaned up.
  - restore network.
  - verify whether automatic recovery happens; if not, click restart and verify recovery.

TURN manual QA:
- status: `review / not manually executed`
- prior automated coverage: Segment 104 passed local Docker coturn relay smoke with `PRIVATE_SFU_SMOKE_TRANSPORT=turn`.
- expected manual checks:
  - run local coturn profile.
  - join gated private SFU URL with `sfuTransport=turn&sfuCapture=real`.
  - verify real mic/camera still works under relay mode.
  - verify restart recovery under relay mode.

## Current Automated Baseline

Pass:
- direct synthetic private SFU browser smoke passed in Segment 104.
- direct real-capture fake-device private SFU browser smoke passed in Segment 104.
- TURN synthetic private SFU browser smoke passed in Segment 104.
- ordinary private `?video=true` remained LiveKit in browser smoke.
- private leave redirect remained `/servers/:serverId/conversations/:memberId`.
- operator manual synthetic private SFU smoke passed with two users connected, producer/consumer ids present on both sides, and `Remote producers: 1` on both sides.

Review:
- physical mic/camera quality and permission UX.
- real capture on a no-camera machine needs a graceful camera-missing fallback instead of failing the whole call.
- real network interruption reconnect/resume.
- manual TURN relay with physical devices.

Deferred:
- SFU screen-share lifecycle.

## Handoff

Manual device QA result:
- `partial / synthetic pass / real capture blocked by missing physical camera`

Reconnect/network interruption result:
- `review / not manually executed`

LiveKit fallback result:
- `pass / preserved`

Remaining blockers before small-room/channel replacement:
- add graceful real-capture fallback for missing camera hardware, so audio-only physical-device QA can proceed on machines without a camera.
- run physical-device manual QA on real microphone/camera hardware where available.
- run real network interruption reconnect/resume QA.
- decide whether SFU screen-share is implemented or explicitly deferred for MVP.
- define small-room/channel SFU room/session lifecycle and load-smoke criteria.
- keep process-local SFU prototype state out of production rollout decisions.

Recommended next segment:
- `private-sfu-real-capture-device-fallback`

Reason:
- manual QA found a concrete local UX blocker: missing camera hardware causes `sfuCapture=real` to fail the entire call even though an audio-only fallback should be possible.

## Verification Performed

This segment is report-only.

Commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
