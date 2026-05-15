# SEGMENT BRIEF 112. Gated Channel AUDIO SFU Pilot

Branch:
- `wave/stage8-gated-channel-audio-sfu-pilot`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `gated-channel-audio-sfu-pilot`

## Goal

Add a controlled non-production explicit SFU gate for channel `AUDIO` without switching runtime defaults.

## Scope Boundary

Preserved:
- ordinary channel `AUDIO` without the explicit gate remains LiveKit.
- channel `VIDEO` remains LiveKit, including when `sfuChannel=true` is present.
- ordinary private `?video=true` remains LiveKit unless the existing private SFU gate is explicitly requested.
- private SFU path remains available and did not regress in the guarded smoke.
- LiveKit fallback/default was not removed or weakened.
- no channel `VIDEO` SFU implementation was added.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.

## Implementation

Changed:
- `MediaRoom` now has a second SFU gate for channel `AUDIO`.
- channel SFU gate requires all of:
  - `mediaEntry.scope.kind === 'channel'`
  - channel render props are `audio=true` and `video=false`
  - `process.env.NODE_ENV !== 'production'`
  - explicit provider request: `?mediaProvider=sfu` or `?sfu=true`
  - explicit channel opt-in: `?sfuChannel=true`
- channel `AUDIO` SFU forces adapter props to audio-only: `audio=true`, `video=false`.
- existing relay query shape is preserved for the gated channel path:
  - `sfuTransport=turn`
  - or `sfuIce=relay`
- `SfuPrivateCallAdapter` now accepts display labels so the shared lifecycle can be reused without showing private-call wording in channel pilot UI.
- `tests/browser/channel-audio-sfu-smoke.spec.ts` adds a guarded two-user channel `AUDIO` smoke.
- `package.json` adds `bun run test:browser:channel-audio-sfu`.

## Gate

Channel `AUDIO` SFU opens only with one of:
- `/servers/:serverId/channels/:channelId?mediaProvider=sfu&sfuChannel=true`
- `/servers/:serverId/channels/:channelId?sfu=true&sfuChannel=true`

The gate is non-production only.

Channel `VIDEO` does not enter SFU from this gate.

## Browser Smoke

Smoke env:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`
- command: `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`

Direct channel `AUDIO` result:
- `pass`

Observed:
- two authenticated users joined the same channel `AUDIO` route through `?mediaProvider=sfu&sfuChannel=true`.
- both participants reached `connected`.
- both participants observed `Remote producers: 1`.
- channel SFU UI reported `Requested media: audio on, video off`.
- restarting one participant recovered to `connected`.
- the other participant stayed at `Remote producers: 1`, so no stale producer inflation was observed in the restart path.
- ordinary channel `AUDIO` without the gate did not render SFU.
- gated channel `VIDEO` did not render SFU.
- channel leave redirected to the server general text channel.

Private SFU regression:
- `pass`
- command: `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`
- existing two-user private SFU direct smoke still passed.

TURN channel result:
- `deferred / not rerun in this segment`
- rationale: this pilot focused on direct channel audio gate and private regression. The same adapter path preserves relay query support, but local coturn was not started for a channel-specific TURN signoff here.

Three-participant channel result:
- `deferred`
- rationale: two-user direct gate is now proven; three-user channel audio, leave/rejoin, and TURN should be a follow-up smoke segment before any broader channel replacement claim.

## Handoff

Channel `AUDIO` gated result:
- `pass / direct two-user browser smoke`

LiveKit fallback result:
- `pass / preserved`

Private SFU regression result:
- `pass / guarded private smoke rerun`

Two/three participant status:
- two participants: `pass`
- three participants: `deferred`

Remaining blockers before broad small-room/channel replacement:
- three-participant channel `AUDIO` smoke.
- channel `AUDIO` TURN relay smoke.
- channel leave/rejoin cleanup under repeated joins.
- channel offline/restore or restart recovery matrix.
- channel `VIDEO` remote layout/rendering definition and smoke.
- process-local mediasoup/signaling state decision before production or multi-process use.
- physical camera QA remains deferred on camera-equipped hardware.
- optional human-operated TURN audio signoff remains review-only.
- SFU screen-share remains deferred unless a later parity/default-switch scope requires it.

Recommended next segment:
- `gated-channel-audio-sfu-3user-turn-rejoin-smoke`

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
- `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_AUDIO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-audio-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Results:
- all verification commands passed.
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- guarded browser scripts skip safely without their smoke env flags.
