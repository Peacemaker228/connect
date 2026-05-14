# Wave 33. Media MVP Implementation Plan

## Goal

Define the ordered implementation roadmap for the first project-owned media path.

This wave starts only after Stage 7 planning has fixed:
- target stack: `mediasoup + coturn`
- backend control-plane ownership in `apps/api`
- client boundary ownership
- SFU/TURN topology direction
- transitional LiveKit containment plan

This document is still planning. It does not change runtime code, does not add media dependencies, does not add infra/env, does not remove LiveKit, and does not fix the current microphone/media symptom.

## MVP Objective

Deliver the first working non-LiveKit media path for private calls and small-room flows.

MVP scope:
- private 1:1 call path first
- small-room path second, using the same engine/control-plane
- audio publish/subscribe
- video publish/subscribe
- baseline reconnect/resume visibility
- screen-share plan and contract support, even if full replacement is deferred behind parity gates
- desktop/web client boundary parity where current runtime supports it

LiveKit remains:
- current fallback/bridge
- parity reference
- rollback path until the new media path passes parity and smoke

Production media infra rollout is separate and later. The MVP implementation can validate locally and in controlled environments before any production deployment plan.

## Global Guardrails

Implementation must happen as small PRs, not one rewrite.

Forbidden across this roadmap unless a specific segment explicitly allows it:
- deleting LiveKit
- removing the current LiveKit fallback before replacement parity
- adding production infra/env/deploy changes
- combining SFU/TURN implementation with production rollout
- fixing the current microphone/media bug as an unscoped side effect
- changing Stage 6 production Postgres cutover/runbook work
- introducing distributed SFU/Redis/multi-node media before single-node MVP requires it

## Ordered Implementation Segments

### 1. `app-core-media-contracts-code`

Goal:
- implement vendor-neutral media contracts from Segment 078 in `packages/app-core`

Depends on:
- Segment 078 contract shapes
- accepted file split for media contracts

Expected output:
- room scope/mode types
- participant identity/session types
- permission snapshot types
- desired vs published media state
- track model
- reconnect/resume types
- screen-share policy types
- media error taxonomy
- command/event name constants and payload types
- transitional provider access metadata shape

Acceptance:
- contracts compile
- no runtime behavior changes
- no LiveKit, mediasoup, or coturn implementation logic leaks into app-level contracts

Segment 084 result:
- status: `complete`
- contract shapes landed in `packages/app-core/src/contracts/media-provider.ts`
- existing barrel export in `packages/app-core/src/contracts/index.ts` continues to expose the media contract surface
- compatibility aliases keep the current room-access names available while the SDK moves to the new command surface
- next segment: `sdk-media-command-surface`

### 2. `sdk-media-command-surface`

Goal:
- add SDK media command types/actions around the new app-core contracts

Depends on:
- `app-core-media-contracts-code`

Expected output:
- command surface for `resolveRoomAccess`, `joinRoom`, `leaveRoom`, `updateDesiredMediaState`, publish/unpublish, screen share, reconnect, and resume where backend support exists or is stubbed behind typed boundaries
- event subscription contract shape if media signaling route is ready
- existing `getLiveKitToken` remains for compatibility

Acceptance:
- SDK compiles
- existing LiveKit token action remains compatible
- no runtime media path switches yet

Segment 085 result:
- status: `complete`
- future SDK media command actions landed in `packages/sdk/src/actions/media.ts`
- command payloads and response shapes use the Segment 084 app-core media contracts where available
- `getLiveKitToken` still calls `/api/media/livekit-token` and the current `MediaRoom` token flow is unchanged
- future control-plane endpoints are not wired to UI and remain blocked on backend implementation
- next segment: `backend-livekit-adapter-containment`

### 3. `backend-livekit-adapter-containment`

Goal:
- contain current backend LiveKit token generation behind an adapter boundary

Depends on:
- `app-core-media-contracts-code`
- current `apps/api` media module

Expected output:
- backend `MediaProviderAdapter` interface
- `LiveKitMediaProviderAdapter`
- current `/api/media/livekit-token` delegates token construction to adapter while preserving response compatibility
- no removing LiveKit

Acceptance:
- current token endpoint behavior preserved
- no product behavior change
- backend LiveKit-specific code is no longer owned directly by the controller path

Segment 086 result:
- status: `complete`
- `MediaProviderAdapter` is now the backend media provider boundary for current room access token creation
- `LiveKitMediaProviderAdapter` owns `livekit-server-sdk` `AccessToken` construction and current env validation
- `MediaController` preserves `GET /api/media/livekit-token`, query params `{ room, username }`, and response `{ token }`
- no UI, SDK runtime flow, dependencies, env, infra, or production deploy docs changed
- next segment: `client-livekit-adapter-containment`

### 4. `client-livekit-adapter-containment`

Goal:
- contain LiveKit client runtime imports/components behind a client adapter boundary

Depends on:
- `sdk-media-command-surface`
- `backend-livekit-adapter-containment`

Expected output:
- `LiveKitClientAdapter` boundary
- LiveKit component/runtime/style imports moved behind adapter-owned files
- current `MediaRoom` behavior preserved through app-shaped props/actions
- leave redirect, preferred-device fallback, device toasts, mute/camera/screen-share remain working

Acceptance:
- no user-visible media behavior regression
- feature/UI code begins consuming app media boundary instead of direct LiveKit concepts
- current LiveKit fallback still active

Segment 087 result:
- status: `complete`
- `LiveKitClientAdapter` now owns `@livekit/components-react`, `@livekit/components-styles`, `livekit-client`, `LiveKitRoom`, `VideoConference`, `Room`, `MediaDeviceFailure`, and `.lk-disconnect-button` handling
- current `MediaRoom` keeps token fetch, route entry, profile/server lookup, and leave redirect ownership
- channel audio/video, private video mode, preferred-device fallback, device error toasts, and leave redirects are preserved by containment
- no backend, SDK contract, dependency, env, infra, route, or product behavior changes were made
- next segment: `livekit-parity-smoke`

### 5. `livekit-parity-smoke`

Goal:
- prove containment did not regress current LiveKit behavior

Depends on:
- `backend-livekit-adapter-containment`
- `client-livekit-adapter-containment`

Expected output:
- documented smoke results for current channel/private media flows
- pass/review/fail classification
- regression list if any

Acceptance:
- channel audio mic-only passes
- channel video mic+camera passes
- private video call passes
- leave redirects pass
- device fallback/toasts pass
- mute/camera/screen-share still works

Segment 088 result:
- status: `review`
- static route/token/adapter parity checks passed for channel `AUDIO`, channel `VIDEO`, private video mode, leave redirects, preferred-device fallback code, device error toast code, and LiveKit `VideoConference` controls
- `getLiveKitToken` still calls `/api/media/livekit-token`, and backend media still returns `{ token }` through `LiveKitMediaProviderAdapter`
- manual authenticated browser/device/LiveKit session checks were not executed in this docs/report-only segment
- no runtime fixes, SDK/API/UI behavior changes, dependency changes, env/infra changes, or removing LiveKit were made
- next segment: `backend-media-control-plane-implementation`

### 6. `backend-media-control-plane-implementation`

Goal:
- implement `apps/api` media control-plane ownership without mediasoup transport internals yet

Depends on:
- `app-core-media-contracts-code`
- `sdk-media-command-surface`
- Segment 079 design

Expected output:
- `MediaAccessService`
- `MediaRoomService`
- `MediaParticipantSessionService`
- `MediaPermissionService`
- media REST commands for resolve/join/leave
- media signaling/event boundary skeleton
- backend-resolved identity/scope/session before provider access

Acceptance:
- auth/domain checks are backend-owned
- caller-provided room/username no longer defines the target control-plane identity
- LiveKit can still be used as provider adapter behind the control-plane

Segment 089 result:
- status: `complete`
- `apps/api` now has `MediaAccessService`, `MediaRoomService`, `MediaParticipantSessionService`, and `MediaPermissionService`
- new authenticated control-plane routes exist for `resolveRoomAccess`, `joinRoom`, `leaveRoom`, and `closeRoom` at the SDK provisional paths
- `/api/media/commands` exists as a non-implemented signaling acknowledgement boundary for future command handling
- channel and conversation access now use backend auth/domain checks before producing app media room/session envelopes
- `joinRoom` creates backend-owned participant session ids and can request a transitional LiveKit provider token behind the existing adapter
- the old `GET /api/media/livekit-token` path and current UI token flow are unchanged
- next segment: `client-media-controller-boundary`

### 7. `client-media-controller-boundary`

Goal:
- implement client media controller/hook and entry mapping around the backend control-plane

Depends on:
- `backend-media-control-plane-implementation`
- `client-livekit-adapter-containment`
- Segment 080 design

Expected output:
- media entry mapper for channel/private/future meeting scopes
- controller/hook for resolve/join/leave/desired state/reconnect baseline
- current LiveKit adapter used as provider behind the controller
- route leave behavior preserved

Acceptance:
- app media state is consumed by UI/controller
- provider adapter state is not leaked to feature entry points
- current LiveKit fallback remains intact

Segment 090 result:
- status: `complete`
- `media-room-entry` now maps channel and private route entries to app-core `MediaRoomScope`, `MediaRoomMode`, and desired-state shapes
- `useMediaRoomController` can call backend `joinRoom` and `leaveRoom` while keeping `getLiveKitToken` as the active LiveKit fallback token source
- `MediaRoom` now consumes the client media entry/controller boundary before rendering the unchanged `LiveKitClientAdapter`
- channel `AUDIO`, channel `VIDEO`, and private video route entry behavior remains mapped to the same audio/video intent and leave redirect behavior
- no removing LiveKit, backend/API mutation, media dependency, env, infra, route behavior, or microphone fix was made
- next segment: `local-mediasoup-dependency-prototype`

### 8. `local-mediasoup-dependency-prototype`

Goal:
- introduce local-only mediasoup prototype after contracts/control-plane boundaries exist

Depends on:
- `backend-media-control-plane-implementation`
- Segment 081 topology

Expected output:
- scoped dependency introduction if approved in that segment
- local-only mediasoup worker/router prototype
- no production infra/env changes
- no removing LiveKit

Acceptance:
- local prototype can create a room/router/transport path behind adapter boundary
- current LiveKit fallback remains usable
- no production rollout behavior changes

Segment 091 result:
- status: `complete`
- `mediasoup@3.19.22` is installed as a server-side dependency
- Bun `trustedDependencies` includes `mediasoup` so the required worker postinstall can run
- a one-off local Node smoke created a mediasoup worker/router successfully
- `MediasoupPrototypeService` isolates worker/router startup and health reporting behind backend media module ownership
- authenticated `GET /api/media/prototype/mediasoup/health` can lazily start and report the local prototype
- the prototype is disabled in production runtime via `NODE_ENV === 'production'`
- LiveKit remains the active fallback/provider path; no UI switch, coturn, browser SFU client package, env, infra, Docker, PM2, Nginx, firewall, production deploy docs, or microphone fix was added
- next segment: `local-coturn-turn-credential`

### 9. `local-coturn-turn-credential`

Goal:
- add local TURN credential/control-plane support for relay-path testing

Depends on:
- `local-mediasoup-dependency-prototype`
- Segment 081 security decisions

Expected output:
- local TURN credential issuance design/implementation
- no unauthenticated TURN relay
- no production secret or deploy changes
- local relay smoke path

Acceptance:
- direct and TURN-relayed local ICE paths can be tested
- credentials are short-lived/backend-issued or explicitly local-only

Segment 092 result:
- status: `complete`
- `TurnCredentialService` issues local-only TURN REST credentials using server-side `LOCAL_TURN_URLS`, `LOCAL_TURN_STATIC_AUTH_SECRET`, and `LOCAL_TURN_TTL_SECONDS`
- credentials use `expiresAtUnixSeconds:profileId` as username and `base64(hmac-sha1(secret, username))` as credential
- authenticated `GET /api/media/prototype/turn/credentials` returns `urls`, `username`, `credential`, `ttlSeconds`, `expiresAt`, and `expiresAtUnixSeconds`
- production runtime and missing local TURN env return disabled status instead of issuing credentials
- local env placeholders are documented in `infra/coturn/local-turn.env.example`
- current LiveKit path, UI runtime, production infra, production env, Docker, PM2, Nginx, firewall, and microphone behavior are unchanged
- next segment: `backend-mediasoup-transport-prototype`

### 10. `backend-mediasoup-transport-prototype`

Goal:
- add backend mediasoup WebRTC transport prototype endpoints behind the existing control-plane

Depends on:
- `local-mediasoup-dependency-prototype`
- `local-coturn-turn-credential`
- `backend-media-control-plane-implementation`

Expected output:
- create send/receive WebRTC transport prototype commands
- connect transport prototype command
- produce/consume skeleton metadata for local private/small-room testing
- TURN credential metadata can be included in provider access where useful
- no browser runtime switch and no production infra changes

Acceptance:
- backend can create mediasoup transport metadata needed by a future browser adapter
- current LiveKit fallback remains available

Segment 093 result:
- status: `complete`
- `MediasoupPrototypeService` now creates local mediasoup WebRTC transports for `send` and `recv` prototype directions
- authenticated `POST /api/media/prototype/mediasoup/transports` returns `transportId`, `iceParameters`, `iceCandidates`, `dtlsParameters`, and optional `sctpParameters`
- the transport response can include local TURN credential metadata when requested, while missing local TURN env and production runtime remain disabled safely
- authenticated `POST /api/media/prototype/mediasoup/transports/:transportId/connect` provides the DTLS connect skeleton for the future browser adapter
- prototype transports are process-local and intentionally not a production session model yet
- current LiveKit fallback/provider/client path remains unchanged
- no browser SFU client package, UI switch, production infra/env/deploy config, relay service rollout, or microphone fix was added
- next segment: `browser-sfu-adapter`

### 11. `browser-sfu-adapter`

Goal:
- add the client provider adapter for the non-LiveKit path

Depends on:
- `backend-mediasoup-transport-prototype`
- `local-mediasoup-dependency-prototype`
- `local-coturn-turn-credential`
- `client-media-controller-boundary`

Expected output:
- client adapter that consumes backend provider access/signaling metadata
- publish/unpublish audio/video path
- basic subscribe/render path
- error mapping to app media taxonomy

Acceptance:
- private/local small-room media can connect through project-owned adapter
- LiveKit fallback remains available

Segment 094 result:
- status: `complete / replacement not switched`
- `mediasoup-client@3.20.0` is installed as the browser SFU client dependency
- backend prototype health now includes router RTP capabilities for browser `Device` loading
- SDK prototype calls exist for mediasoup health, WebRTC transport creation, and transport connect
- `SfuClientAdapter` exists next to `LiveKitClientAdapter`
- the adapter can load a browser mediasoup `Device`, create send/receive transports from backend metadata, wire transport `connect` to backend DTLS connect, and pass local TURN credentials into `iceServers`
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route is switched to the SFU path
- end-to-end media replacement is not complete in this segment; backend producer/consumer endpoints and client publish/consume/render wiring are still missing
- next segment: `mediasoup-produce-consume-prototype`

### 11A. `mediasoup-produce-consume-prototype`

Goal:
- add narrow publish/consume prototype behavior on top of existing local mediasoup transports

Depends on:
- `browser-sfu-adapter`
- `backend-mediasoup-transport-prototype`

Expected output:
- backend prototype producer endpoint
- backend prototype consumer endpoint
- in-memory producer/consumer registry
- SDK producer/consumer calls
- `SfuClientAdapter.produce(track)`
- `SfuClientAdapter.consume(metadata)`
- no default route switch

Acceptance:
- backend can create producer metadata from client RTP parameters
- backend can create consumer metadata for a compatible receive transport
- browser adapter can call publish and consume methods without being the default provider
- current LiveKit path remains unchanged

Segment 095 result:
- status: `complete / replacement not switched`
- `MediasoupPrototypeService` now owns local in-memory producer and consumer registries
- authenticated `POST /api/media/prototype/mediasoup/producers` accepts RTP parameters and creates a mediasoup producer on a send transport
- authenticated `POST /api/media/prototype/mediasoup/consumers` checks RTP compatibility and creates consumer metadata on a receive transport
- SDK actions exist for prototype produce and consume
- `SfuClientAdapter.produce(track)` publishes a browser track through an existing send transport
- `SfuClientAdapter.createConsumerMetadata(...)` requests backend consumer metadata from a receive transport and device RTP capabilities
- `SfuClientAdapter.consume(metadata)` creates a mediasoup-client consumer and returns the remote track
- prototype consumers default to unpaused because no consumer resume command exists yet
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route is switched to SFU
- next segment: `local-sfu-direct-turn-smoke`

### 11B. `local-sfu-direct-turn-smoke`

Goal:
- verify the local SFU prototype can move media before any private/small-room replacement switch

Depends on:
- `mediasoup-produce-consume-prototype`
- local direct WebRTC path available
- local TURN env available for relay-path review where possible

Expected output:
- controlled local smoke harness or manual smoke path that exercises `SfuClientAdapter`
- direct-path publish/consume result
- TURN credential/relay-path result or explicit blocked/review status if local coturn is not running
- documented findings and blockers before replacement
- no default route switch

Acceptance:
- authenticated local client can create send/recv transports
- local track can be produced through the send transport
- compatible consumer metadata can be created and consumed through the receive transport
- remote track/media flow is observed locally, or a concrete blocker is documented before replacement
- current LiveKit path remains unchanged

### 12. `mvp-private-small-room-replacement`

Goal:
- switch a controlled private/small-room flow to the new media path behind fallback gates

Depends on:
- `local-sfu-direct-turn-smoke`
- `browser-sfu-adapter`
- `backend-media-control-plane-implementation`
- local direct and TURN smoke passing

Expected output:
- controlled entry flag or route/runtime gate
- private call first
- small-room/channel path second only after private flow passes
- LiveKit fallback remains available

Acceptance:
- first non-LiveKit private call works end-to-end
- small-room path works under MVP constraints
- fallback to current LiveKit remains available during review

### 13. `final-media-mvp-parity-load-smoke`

Goal:
- decide whether MVP replacement is ready to move beyond local/controlled rollout

Depends on:
- `mvp-private-small-room-replacement`

Expected output:
- parity results against current LiveKit behavior
- baseline load/small-room smoke results
- reconnect baseline review
- screen-share status review
- production rollout readiness decision

Acceptance:
- channel audio/video acceptance criteria pass or have explicit deferred status
- private calls pass
- leave redirects pass
- device fallback/errors pass
- reconnect baseline is visible and acceptable for MVP
- screen-share path is either working or explicitly deferred with preserved LiveKit fallback
- no LiveKit regression until replacement is accepted

## Dependency Summary

Critical path:
1. app-core contracts
2. SDK command surface
3. LiveKit containment
4. parity smoke
5. backend control-plane
6. client controller boundary
7. local mediasoup prototype
8. local TURN credential path
9. backend mediasoup transport prototype
10. browser SFU adapter
11. mediasoup produce/consume prototype
12. local SFU direct/TURN smoke
13. controlled replacement
14. final parity/load smoke

Dependency rules:
- app-core contracts come before SDK/backend/client implementation
- LiveKit containment comes before new provider replacement so fallback remains clean
- control-plane comes before mediasoup transport replacement
- local SFU/TURN comes before production media infra
- production rollout comes after MVP parity, not inside MVP implementation planning

## MVP Acceptance Criteria

Must preserve before and during replacement:
- channel `AUDIO` mic-only behavior
- channel `VIDEO` mic+camera behavior
- private video call behavior
- channel leave redirect to text/general/server fallback
- private leave redirect to conversation without `?video=true`
- preferred-device fallback
- user-visible device permission/in-use/not-found errors
- mute/camera controls
- screen-share plan and no unplanned regression
- intentional leave versus unexpected disconnect distinction
- LiveKit fallback until the new path passes parity

MVP replacement acceptance:
- first private/small-room non-LiveKit path works end-to-end locally
- backend owns room/session/permission decisions
- client consumes app media boundary
- provider adapter hides mediasoup-specific details
- TURN relay path has a local smoke path before production planning
- no production infra/deploy change is required to call local MVP complete

## Rollback / Fallback

Rollback principle:
- current LiveKit runtime remains until replacement passes parity and a later rollout decision removes the fallback.

Fallback requirements:
- existing LiveKit token path stays available until a scoped deprecation segment
- feature gates or route/runtime switches should allow reverting to LiveKit during MVP review
- parity smoke must compare against current LiveKit behavior
- no data migration should be required to roll back media runtime

## Production Rollout Boundary

Production rollout is separate and later.

Out of scope for MVP implementation planning:
- VPS firewall commands
- Docker/systemd/Nginx configs
- production TURN service rollout
- production mediasoup process management
- production TURN credentials/secrets
- production monitoring/alerting rollout
- removing LiveKit from production

Production media infra should get its own runbook/implementation wave after local MVP parity is proven.

## First Code Segment Result

`app-core-media-contracts-code` is complete.

Result:
- Segment 078 contract vocabulary is the code target
- the first pass stayed in `packages/app-core/src/contracts/media-provider.ts`
- provider access metadata remains explicitly transitional
- app-core contracts do not import media vendors or infra packages
- existing media contract exports remain available through the current barrel path
- the segment stayed narrow to contracts and docs only

Current next code segment:
- `local-sfu-direct-turn-smoke`

Before any runtime replacement:
- LiveKit containment and parity smoke must happen
- backend auth/domain checks must be owned by the control-plane
- local SFU/TURN must be validated before production infra planning

## Stage 7 Planning Closure

Stage 7 planning can close after this segment if this implementation plan is accepted.

Reason:
- stack decision is fixed
- current runtime inventory is documented
- contract shapes are designed
- backend control-plane is designed
- client boundary is designed
- SFU/TURN topology is designed
- LiveKit containment is planned
- MVP implementation order, fallback, and acceptance are now documented

Next active work should validate the local SFU path before controlled replacement:
- `local-sfu-direct-turn-smoke`
