# SEGMENT BRIEF 116. Gated Channel VIDEO SFU Layout Prototype

Branch:
- `wave/stage8-gated-channel-video-sfu-layout-prototype`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-video-sfu-layout-prototype`

## Goal

Add a controlled non-production explicit channel `VIDEO` SFU layout prototype for two users without switching channel `VIDEO` to SFU by default.

## Scope Boundary

Changed:
- added a channel `VIDEO` SFU gate that opens only with the full explicit non-production query:
  - `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real`
  - `?sfu=true&sfuChannel=true&sfuVideo=true&sfuCapture=real`
- extended the existing SFU adapter with a `participant-grid` remote video layout mode.
- added participant-keyed remote video tiles for the channel video path.
- added a guarded two-user channel `VIDEO` browser smoke spec and npm script.

Preserved:
- ordinary channel `VIDEO` without the full gate remains LiveKit.
- channel `AUDIO` SFU behavior remains unchanged.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- ordinary private `?video=true` remains LiveKit.
- gated private SFU behavior remains available for private routes only.
- LiveKit fallback/default was not removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime implementation was added.

## Implementation Notes

Channel gate:
- `MediaRoom` now distinguishes three SFU cases:
  - private conversation SFU gate.
  - channel `AUDIO` SFU gate.
  - channel `VIDEO` SFU gate.
- channel `VIDEO` SFU additionally requires `sfuVideo=true` and `sfuCapture=real`.
- missing `sfuCapture=real` keeps channel `VIDEO` on LiveKit even if `mediaProvider=sfu&sfuChannel=true&sfuVideo=true` is present.

Layout:
- `SfuPrivateCallAdapter` keeps the existing single-video behavior by default.
- channel `VIDEO` passes `remoteVideoLayout="participant-grid"`.
- participant-grid mode models remote media by `participantSessionId`.
- remote audio is still mixed into the existing remote audio element.
- each remote participant can render one video tile or an audio-only placeholder.
- `producer.closed` removes the corresponding participant media state.

Capture:
- channel `VIDEO` uses the existing real-capture path.
- the existing no-camera fallback remains in place:
  - request audio+video first.
  - when camera is missing and audio capture succeeds, continue audio-only.
  - show `Camera not found; continuing audio-only`.
  - disable camera control when no video track exists.

Browser smoke:
- new guarded spec: `tests/browser/channel-video-sfu-smoke.spec.ts`
- new script: `bun.cmd run test:browser:channel-video-sfu`
- smoke env flag: `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- expected full-capture result: `Remote producers: 2` per participant.
- expected no-camera fallback result: `Remote producers: 1` per participant.

## Smoke Result

2-user channel `VIDEO` direct smoke:
- `pass`

Command attempted:
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Local services:
- API was started on `http://localhost:4000/api`.
- Web was started on `http://localhost:3001`.

Observed:
- local Docker Postgres was available on `localhost:5433`.
- Prisma reported the database was already in sync with the active schema.
- two authenticated users joined the same channel `VIDEO` route through the full explicit SFU gate.
- both users reached `connected`.
- both users observed `Remote producers: 2`.
- local preview was visible on both users with Chromium fake camera.
- each user rendered one remote video tile.
- ordinary channel `VIDEO` without the full gate stayed off the SFU UI.
- partial channel `VIDEO` SFU query without `sfuCapture=real` stayed off the SFU UI.
- ordinary channel `AUDIO` without the gate stayed off the SFU UI.
- no-camera fallback path stayed connected audio-only with `Remote producers: 1`, capture notice, and disabled camera control.
- channel leave redirected to the server general text channel.

## Handoff

Changed files:
- `package.json`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
- `tests/browser/channel-video-sfu-smoke.spec.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_116_GATED_CHANNEL_VIDEO_SFU_LAYOUT_PROTOTYPE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

2-user video result:
- `pass`
- full-capture channel `VIDEO` SFU reached connected state with `Remote producers: 2` per participant.

Layout result:
- `pass / prototype`
- local preview and one remote video tile per participant were observed through Chromium fake audio/video devices.

LiveKit fallback result:
- `pass / preserved by gate design`
- ordinary channel `VIDEO` requires the full explicit gate before SFU can render.
- ordinary channel `AUDIO` and private defaults remain LiveKit.

Regressions:
- channel `AUDIO` SFU regression passed.
- private SFU regression passed.
- ordinary channel `VIDEO` and ordinary channel `AUDIO` LiveKit fallback assertions passed in the channel video smoke.

Remaining blockers:
- run 3-user channel `VIDEO` direct smoke with restart and leave/rejoin cleanup.
- run TURN channel `VIDEO` smoke after direct 3-user path passes.
- run 5-user channel `VIDEO` load baseline after 3-user/TURN confidence.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- physical camera QA and SFU screen-share remain deferred.

Recommended next segment:
- `gated-channel-video-sfu-3user-turn-rejoin-smoke`

## Verification Performed

Commands:
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
- all verification commands passed.
- guarded browser scripts skipped safely without their smoke env flags.
- real channel `VIDEO` SFU smoke passed with `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`.
- real channel `AUDIO` SFU regression passed with `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`.
- real private SFU regression passed with `PRIVATE_SFU_BROWSER_SMOKE=1`.
