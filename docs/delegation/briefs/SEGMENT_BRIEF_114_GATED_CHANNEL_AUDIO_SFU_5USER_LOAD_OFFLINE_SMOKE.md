# SEGMENT BRIEF 114. Gated Channel AUDIO SFU 5-User Load Offline Smoke

Branch:
- `wave/stage8-gated-channel-audio-sfu-5user-load-offline-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-audio-sfu-5user-load-offline-smoke`

## Goal

Run a five-user channel `AUDIO` SFU load baseline and explicit offline/restore smoke before any channel default switch.

## Scope Boundary

Preserved:
- channel `AUDIO` SFU remains non-production and explicit-gated only.
- ordinary channel `AUDIO` without the gate remains LiveKit.
- channel `VIDEO` remains LiveKit, including when `sfuChannel=true` is present.
- private SFU path did not regress.
- LiveKit fallback/default was not removed or weakened.
- no channel `VIDEO` SFU implementation was added.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no runtime cleanup fix was needed.

## Smoke Env

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

Command:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=5 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

## Result

5-user direct channel `AUDIO` result:
- `pass`

Expected remote producers:
- `Remote producers: 4` per participant

Observed:
- five authenticated users joined the same channel `AUDIO` route through `?mediaProvider=sfu&sfuChannel=true`.
- all participants reached `connected`.
- all participants observed `Remote producers: 4`.
- channel SFU UI stayed audio-only: `Requested media: audio on, video off`.
- one participant restart recovered to `connected`.
- all participants returned to `Remote producers: 4` after restart.
- one participant was forced offline through Playwright browser context offline mode.
- after restore, all participants returned to `connected` and `Remote producers: 4`.
- one participant left through the channel SFU leave button.
- the remaining four participants dropped to `Remote producers: 3`.
- the same participant rejoined the gated channel route.
- all participants returned to `Remote producers: 4`.
- ordinary channel `AUDIO` without the gate did not render SFU.
- gated channel `VIDEO` did not render SFU.
- channel leave redirected to the server general text channel.

Offline/restore result:
- `pass`

Stale cleanup result:
- `pass`
- no stale producer inflation was observed after restart, offline/restore, or leave/rejoin.

LiveKit fallback result:
- `pass / preserved`

Private SFU regression:
- `pass`
- command: `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

TURN 5-user result:
- `not run / optional`
- previous Segment 113 three-user TURN channel `AUDIO` result remains `pass`.

## Handoff

5-user result:
- `pass`

Offline/restore result:
- `pass`

Stale cleanup result:
- `pass`

Remaining blockers before broad small-room/channel replacement:
- channel `VIDEO` remote layout/rendering definition and smoke remain unstarted.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- physical camera QA remains deferred on camera-equipped hardware.
- optional human-operated TURN audio signoff remains review-only.
- SFU screen-share remains deferred unless a later parity/default-switch scope requires it.

Recommended next segment:
- `channel-video-sfu-layout-readiness-plan`

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
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=5 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Results:
- all verification commands passed.
- guarded browser scripts skip safely without their smoke env flags.
