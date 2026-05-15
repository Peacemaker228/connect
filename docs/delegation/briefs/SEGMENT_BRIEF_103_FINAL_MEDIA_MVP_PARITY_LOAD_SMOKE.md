# SEGMENT BRIEF 103. Final Media MVP Parity Load Smoke

Branch:
- `wave/stage8-final-media-mvp-parity-load-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `final-media-mvp-parity-load-smoke`

## Goal

Run the final local Media MVP parity/load smoke before deciding whether broader small-room/channel SFU replacement work can start.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only:
  - `?video=true&mediaProvider=sfu`
  - `?video=true&sfu=true`
- TURN relay remains explicit under:
  - `sfuTransport=turn`
  - `sfuIce=relay`
- LiveKit fallback/default remains in place.
- no production infra/env/nginx/firewall/deploy changes were made.

Not changed:
- no channel/small-room route was switched to SFU.
- no ordinary private call default was switched to SFU.
- no real microphone bug/device-capture parity work was folded into this segment.
- no Stage 6 production Postgres work was touched.

## Parity Checks

Ordinary private `?video=true`:
- status: `pass`
- code boundary: `MediaRoom` only opens `SfuPrivateCallAdapter` when `mediaEntry.scope.kind === 'conversation'` and an explicit SFU query is present in non-production.
- browser smoke assertion: the ordinary private URL without SFU query did not render `private-sfu-provider`.
- default path remains `LiveKitClientAdapter`.

Channel `AUDIO` / `VIDEO`:
- status: `pass / static boundary`
- code boundary: `isPrivateSfuGateRequested` requires `conversation`, so channel media entries cannot open the SFU adapter.
- default channel path remains `LiveKitClientAdapter`.
- `MediaPermissionService` still preserves audio-only channel video denial through `publishVideo: !isChannelAudioOnly`.

Private leave redirect:
- status: `pass`
- browser smoke clicks the private SFU leave button and confirms redirect to `/servers/:serverId/conversations/:memberId`.

LiveKit fallback/default:
- status: `pass`
- backend `MediaModule` still binds `MEDIA_PROVIDER_ADAPTER` to `LiveKitMediaProviderAdapter`.
- `MediaController.joinRoom` still issues `providerAccess.metadata.provider = 'livekit-bridge'`.
- frontend falls through to `LiveKitClientAdapter` when the private SFU gate is absent or unavailable.

## Smoke Env Used

Direct local profile:
- API env:
  - `API_PORT=4000`
  - `API_CORS_ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005`
  - `LOCAL_MEDIASOUP_LISTEN_IP=127.0.0.1`
- Web env:
  - `PORT=3001`
  - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
  - `API_INTERNAL_URL=http://localhost:4000`
- Smoke env:
  - `PRIVATE_SFU_BROWSER_SMOKE=1`
  - `PRIVATE_SFU_SMOKE_HOST=localhost`
  - `PRIVATE_SFU_SMOKE_API_PORT=4000`
  - `PRIVATE_SFU_SMOKE_WEB_PORT=3001`
- Command:
  - `bun.cmd run test:browser:private-sfu`

TURN local profile:
- coturn:
  - `docker compose -f infra/coturn/docker-compose.local.yml up -d`
- local-only coturn env:
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-stage8-turn-secret`
  - `LOCAL_TURN_EXTERNAL_IP=127.0.0.1`
  - `LOCAL_TURN_RELAY_MIN_PORT=49160`
  - `LOCAL_TURN_RELAY_MAX_PORT=49170`
- API env additionally:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-stage8-turn-secret`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- Smoke env additionally:
  - `PRIVATE_SFU_SMOKE_TRANSPORT=turn`
- Command:
  - `bun.cmd run test:browser:private-sfu`

## Smoke Results

Direct private SFU browser smoke:
- status: `pass`
- result: `1 passed`
- both authenticated private participants reached `connected`.
- each participant observed exactly one remote producer.
- ordinary private URL without SFU query stayed off the SFU provider.
- private leave redirect was preserved.

TURN relay private SFU browser smoke:
- status: `pass`
- result: `1 passed`
- local Docker coturn was available.
- relay-only query mode was used through `PRIVATE_SFU_SMOKE_TRANSPORT=turn`.
- both authenticated private participants reached `connected`.
- each participant observed exactly one remote producer.
- ordinary private URL without SFU query stayed off the SFU provider.
- private leave redirect was preserved.

## Screen-Share, Reconnect, And Device Parity

Screen-share:
- status: `deferred`
- LiveKit fallback still owns the existing `VideoConference` screen-share controls.
- private SFU path does not implement screen-share producer/consumer lifecycle yet.
- no screen-share regression was introduced because default routes remain LiveKit.

Reconnect:
- status: `review`
- app contracts expose reconnect policy and LiveKit fallback keeps its existing reconnect behavior.
- private SFU path has cleanup and restart controls, but no explicit reconnect/resume smoke has been added.
- broader replacement should not start until reconnect behavior is owned and tested for the SFU path.

Device controls and real capture:
- status: `deferred`
- LiveKit path still owns microphone/camera enablement, preferred-device retry, and user-visible media device errors.
- private SFU smoke uses synthetic audio and does not prove real microphone/camera capture parity.
- microphone/capture parity remains separate scoped work.

Small-room/load readiness:
- status: `review / not ready for broad switch`
- current proof is two-user private SFU direct/TURN smoke.
- no channel or small-room route has been switched or load-tested.
- mediasoup registry/signaling remains process-local prototype state.
- no production readiness claim is made.

## Decision

Parity result:
- `private gated SFU local direct/TURN smoke pass`
- `LiveKit default/fallback pass`
- `small-room/channel replacement not ready`

Final recommendation:
- `split next segment`

Reason:
- local private SFU smoke gates are clean, but device controls, real capture, reconnect, screen-share, and small-room/channel load behavior are still not accepted for replacement.
- proceed only to a narrow parity-hardening or small-room planning segment; hold any route switch.

## Handoff

Direct smoke result:
- `pass`

TURN smoke result:
- `pass`

Load/readiness result:
- `review / hold broad replacement`

Blockers before small-room/channel replacement:
- real microphone/camera capture parity for SFU.
- SFU device controls and user-visible media error behavior.
- SFU reconnect/resume behavior and smoke coverage.
- SFU screen-share lifecycle or an explicit MVP deferral decision.
- small-room/channel room/session lifecycle and load smoke plan.
- process-local prototype state must be replaced or explicitly bounded before any production rollout work.

Recommended next segment:
- `private-sfu-device-controls-reconnect-parity`

Reason:
- this keeps the next change narrow and closes the largest parity gaps before any small-room/channel route work.

## Verification Performed

Commands:
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:private-sfu`
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
- `bun.cmd run test:browser` skipped the guarded smoke without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
- `bun.cmd run test:browser:private-sfu` also skipped without the env flag; the direct/TURN pass commands above were run with the explicit smoke env.
