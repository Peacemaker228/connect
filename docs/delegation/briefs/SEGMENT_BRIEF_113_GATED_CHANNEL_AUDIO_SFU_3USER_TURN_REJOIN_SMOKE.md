# SEGMENT BRIEF 113. Gated Channel AUDIO SFU 3-User TURN Rejoin Smoke

Branch:
- `wave/stage8-gated-channel-audio-sfu-3user-turn-rejoin-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-audio-sfu-3user-turn-rejoin-smoke`

## Goal

Extend the guarded channel `AUDIO` SFU smoke to three users, leave/rejoin cleanup, restart recovery, and TURN relay without switching defaults.

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

## Implementation

Changed:
- `tests/browser/channel-audio-sfu-smoke.spec.ts` now defaults to a three-participant guarded channel `AUDIO` run when `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1`.
- the smoke accepts `CHANNEL_AUDIO_SFU_SMOKE_USERS`, defaulting to `3`.
- the smoke accepts `CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN`, defaulting to enabled unless set to `0`.
- the smoke accepts `CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1` for optional offline/restore coverage.
- existing `CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn` relay mode is preserved.
- no runtime SFU cleanup fix was needed.

## Direct Smoke

Smoke env:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`
- command: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

3-user direct result:
- `pass`

Observed:
- three authenticated users joined the same channel `AUDIO` route through `?mediaProvider=sfu&sfuChannel=true`.
- all participants reached `connected`.
- all participants observed `Remote producers: 2`.
- channel SFU UI reported `Requested media: audio on, video off`.
- restarting one participant recovered to `connected`.
- all participants returned to `Remote producers: 2` after restart.
- one participant left through the channel SFU leave button.
- the two remaining participants dropped to `Remote producers: 1`.
- the same participant rejoined the gated channel route.
- all participants returned to `Remote producers: 2`.
- ordinary channel `AUDIO` without the gate did not render SFU.
- gated channel `VIDEO` did not render SFU.
- channel leave redirected to the server general text channel.

Leave/rejoin cleanup result:
- `pass`

Stale producer cleanup result:
- `pass`
- no inflated remote producer count was observed after restart or leave/rejoin.

Restart recovery result:
- `pass`

Offline/restore result:
- `deferred / optional env added`
- rationale: this segment proved restart recovery in the three-user channel room. The smoke now has `CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE=1` for a later explicit offline/restore run if needed.

## TURN Smoke

Local coturn:
- started from `infra/coturn/docker-compose.local.yml`
- shell-only local env used:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=connect-local-turn-secret`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`

Smoke command:
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

TURN channel `AUDIO` result:
- `pass`

Observed:
- the same three-user channel `AUDIO` matrix passed in relay mode.
- coturn logs showed authenticated sessions, relay usage, allocation count changes, and peer cleanup for mediasoup peer `10.8.1.13`.

## Regression

Private SFU regression:
- `pass`
- command: `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

LiveKit fallback result:
- `pass / preserved`
- channel `AUDIO` without the gate remains LiveKit.
- channel `VIDEO` remains LiveKit.
- ordinary private `?video=true` remains LiveKit by the existing private smoke assertion.

## Handoff

3-user result:
- `pass`

TURN result:
- `pass`

Leave/rejoin result:
- `pass`

Stale producer cleanup result:
- `pass`

Remaining blockers before broad small-room/channel replacement:
- five-participant channel `AUDIO` load baseline is still unproven.
- explicit channel offline/restore run remains optional/review; restart recovery passed.
- channel `VIDEO` remote layout/rendering definition and smoke remain unstarted.
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- physical camera QA remains deferred on camera-equipped hardware.
- optional human-operated TURN audio signoff remains review-only.
- SFU screen-share remains deferred unless a later parity/default-switch scope requires it.

Recommended next segment:
- `gated-channel-audio-sfu-5user-load-offline-smoke`

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
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3 CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN=1 CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Results:
- all verification commands passed.
- guarded browser scripts skip safely without their smoke env flags.
