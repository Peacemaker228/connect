# SEGMENT BRIEF 093. Backend Mediasoup Transport Prototype

Branch:
- `wave/stage8-backend-mediasoup-transport-prototype`

Segment:
- `backend-mediasoup-transport-prototype`

## Goal

Add local-only backend mediasoup WebRTC transport prototype metadata before the browser adapter, without UI runtime switching, LiveKit removal, production infra/env changes, coturn service rollout, or microphone/media fixes.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_088_LIVEKIT_PARITY_SMOKE.md`
- `packages/app-core/src/contracts/media-provider.ts`
- `packages/sdk/src/actions/media.ts`
- `apps/api/src/modules/media/*`

Mediasoup local type/runtime references checked:
- installed `mediasoup` package type declarations for `WebRtcTransportOptions`, `TransportListenInfo`, `IceParameters`, `IceCandidate`, and `DtlsParameters`
- one-off local worker/router/transport smoke through the installed package

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_093_BACKEND_MEDIASOUP_TRANSPORT_PROTOTYPE.md`

Changed:
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_083_MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_092_LOCAL_COTURN_TURN_CREDENTIAL.md`

## Implementation Summary

Backend prototype service:
- extended `MediasoupPrototypeService` from worker/router health into local WebRTC transport metadata
- added `createWebRtcTransport(direction)` for `send` and `recv` prototype directions
- returns `transportId`, `iceParameters`, `iceCandidates`, `dtlsParameters`, and optional `sctpParameters`
- keeps transports in a local in-memory map for the life of the API process
- removes closed transports from the local map
- uses local listen info from `LOCAL_MEDIASOUP_LISTEN_IP`, defaulting to `127.0.0.1`
- supports optional `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` for future local network testing

Connect skeleton:
- added `connectWebRtcTransport({ transportId, dtlsParameters })`
- validates that a transport id and DTLS parameters are present
- connects the stored mediasoup transport when a future browser adapter supplies DTLS parameters
- returns `transportId` and current DTLS state

Guarding:
- added authenticated `POST /api/media/prototype/mediasoup/transports`
- added authenticated `POST /api/media/prototype/mediasoup/transports/:transportId/connect`
- both endpoints use `RequireAuthGuard`
- production runtime returns disabled status instead of creating or connecting transports

TURN metadata:
- `POST /api/media/prototype/mediasoup/transports` accepts `includeTurnCredentials`
- when requested, the response can include local TURN credential metadata from `TurnCredentialService`
- missing local TURN env or production runtime still returns a disabled credential response rather than exposing relay secrets

Compatibility:
- current LiveKit token/provider/client path is unchanged
- no browser SFU client package was added
- no UI runtime switch was made
- no production env, deploy, Docker, PM2, Nginx, or network access config was changed
- microphone/media behavior was not changed

## Prototype API Shape

Create transport:
- method: `POST`
- path: `/api/media/prototype/mediasoup/transports`
- auth: required
- request body:
  - `direction?: "send" | "recv"`
  - `includeTurnCredentials?: boolean`
- response:
  - `status`
  - `enabled`
  - `direction`
  - `transportId`
  - `iceParameters`
  - `iceCandidates`
  - `dtlsParameters`
  - `sctpParameters`
  - optional `turnCredentials`

Connect transport:
- method: `POST`
- path: `/api/media/prototype/mediasoup/transports/:transportId/connect`
- auth: required
- request body:
  - `dtlsParameters`
- response:
  - `status`
  - `enabled`
  - `transportId`
  - `dtlsState`

## Acceptance Result

Pass:
- backend can create local mediasoup WebRTC transport metadata through the existing prototype worker/router.
- transport metadata includes id, ICE parameters, ICE candidates, and DTLS parameters.
- connect transport skeleton exists for the future browser adapter.
- prototype endpoints are auth-guarded.
- production runtime is disabled safely.
- current LiveKit fallback path is unchanged.

Review:
- authenticated HTTP endpoint smoke was not executed in this segment.
- transport state is intentionally local in-memory prototype state and is not yet tied to durable media sessions.
- produce/consume, room pinning, and browser adapter behavior remain for later segments.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `browser-sfu-adapter`

Reason:
- backend can now provide the transport metadata a browser adapter needs, while LiveKit remains active as fallback. The next narrow step is to add the client-side SFU adapter behind the existing media controller boundary without switching the default runtime path.

## Verification Performed

Verification performed:
- one-off local mediasoup worker/router/WebRTC transport smoke passed with ICE and DTLS metadata present.
- `bun.cmd run typecheck:api` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `git diff --check` passed.
- `bun.cmd run build:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- required forbidden-string scan returned no matches.
