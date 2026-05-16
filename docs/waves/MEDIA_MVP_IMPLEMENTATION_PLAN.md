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

Segment 096 result:
- status: `review / replacement blocked`
- authenticated backend mediasoup health passed locally after fixing `MediaModule` to import `AuthModule` for `RequireAuthGuard` dependency resolution
- authenticated backend direct send/receive WebRTC transport metadata creation passed locally
- a dev-only authenticated `/media/sfu-smoke` route now exercises `SfuClientAdapter` through health, send/recv transport creation, local synthetic audio produce, consumer metadata creation, and remote track consume
- `SfuClientAdapter.createTransport(...)` now accepts optional `iceTransportPolicy`, allowing the smoke harness to force `relay` for TURN review
- full browser direct produce/consume remote-track observation was not executed in this environment and remains review-only
- TURN smoke is blocked locally because `LOCAL_TURN_STATIC_AUTH_SECRET` is not configured and no local coturn availability was confirmed
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route is switched to SFU
- next segment should rerun browser direct/TURN smoke with an authenticated browser and local coturn env before replacement

Segment 097 result:
- status: `direct pass / TURN blocked / replacement blocked`
- authenticated browser `/media/sfu-smoke` Direct run passed in Chromium
- direct smoke created producer `b5127fad-9844-47c5-b050-7efebc1a92bf` and consumer `95fd4e9d-d2a6-4c2d-9f8e-9dad1753153f`
- direct smoke observed consumed remote track state `live`
- TURN relay smoke remains blocked because local `LOCAL_TURN_*` env is absent, `turnserver` / `coturn` is not available in `PATH`, and `127.0.0.1:3478` is not reachable
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route is switched to SFU
- no production media infra/env/nginx/firewall/deploy changes were made
- next segment should unblock local coturn/TURN env and rerun relay smoke before replacement

Segment 098 result:
- status: `direct pass / TURN pass / replacement unblocked`
- local-only Docker coturn runtime was added in `infra/coturn/docker-compose.local.yml`
- local env example now documents optional local Docker coturn relay range and external IP knobs without real secrets
- TURN relay smoke used backend-issued REST credentials with shell-only shared secret and `iceTransportPolicy: "relay"`
- API was run locally with `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0` and a host IPv4 `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` so coturn could reach the host mediasoup candidates
- authenticated browser `/media/sfu-smoke` TURN run passed in Chromium
- TURN smoke created producer `3950e702-a289-4024-9d0b-d5d5073fd10b` and consumer `354245a9-ff37-4f55-a8c5-a5cf41763942`
- TURN smoke observed consumed remote track state `live`
- coturn logs showed authenticated `ALLOCATE` and `CREATE_PERMISSION` success for the host mediasoup announced-address peer
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route is switched to SFU
- no production media infra/env/nginx/firewall/deploy changes were made
- next segment can start controlled `mvp-private-small-room-replacement`

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

Segment 099 result:
- status: `review / gated private SFU loopback only`
- private conversation SFU path is now explicit-gated by `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`
- the SFU gate is limited to `conversation` media entries and disabled in production runtime
- private calls without the explicit SFU query and all channel audio/video routes remain on `LiveKitClientAdapter`
- mediasoup prototype transport create/connect, producers, consumers, and producer discovery can now be bound to backend-resolved `roomId` and `participantSessionId`
- authenticated scoped producer discovery exists at `POST /api/media/prototype/mediasoup/producers/discover`
- `SfuPrivateCallAdapter` uses the existing control-plane join result, creates scoped send/recv transports, produces a local synthetic audio track, discovers the scoped producer, consumes it locally, and preserves the existing leave redirect
- authenticated private-route SFU smoke reached `review` with scoped local produce/consume loopback and leave redirect preserved
- full two-user private SFU smoke remains blocked because remote producer announcement/subscription lifecycle is not implemented yet
- small-room/channel replacement has not started
- next segment should add remote producer discovery/signaling and run a full two-user private SFU smoke before any small-room/channel switch

Segment 100 result:
- status: `private two-user pass / private TURN pass / replacement still gated`
- `SfuPrivateCallAdapter` now publishes a scoped local producer and runs remote producer discovery for other participant sessions in the same private room
- the private SFU adapter excludes self producers before consuming, while the standalone `/media/sfu-smoke` harness remains unchanged
- backend producer close support and latest-per-participant discovery were added so dev remounts do not leave stale producers visible to subscribers
- authenticated two-user private browser smoke passed with both participants reaching `connected` and each observing one remote producer
- normal private `?video=true` still did not render SFU, and channel audio/video routes remain LiveKit
- private leave redirect stayed `/servers/:serverId/conversations/:memberId`
- private TURN relay smoke passed locally with `sfuTransport=turn`, relay-only ICE policy, backend-issued TURN credentials, and coturn authenticated `ALLOCATE` / `CREATE_PERMISSION`
- discovery remains polling-based and process-local; next segment should move lifecycle toward project-owned media signaling/events and controls before small-room/channel replacement

Segment 101 result:
- status: `signaling lifecycle review / smoke env stabilization required`
- private SFU producer discovery in `SfuPrivateCallAdapter` no longer uses polling; it subscribes to authenticated project-owned SSE events under `GET /api/media/prototype/mediasoup/events`
- the event path emits scoped producer snapshots plus producer published/closed and consumer closed lifecycle events
- backend producer close now emits lifecycle events, and explicit consumer close exists at `POST /api/media/prototype/mediasoup/consumers/:consumerId/close`
- `SfuClientAdapter.close()` now requests backend consumer cleanup before producer cleanup, then closes local mediasoup-client resources
- the client waits for the initial event snapshot before local publish to avoid missing remote producer events, and dedupes dev-remount producer events by `participantSessionId + kind`
- ordinary private calls and channel audio/video routes remain LiveKit; the SFU gate remains conversation-only and non-production
- reusable guarded Playwright browser smoke now exists at `tests/browser/private-sfu-two-user-smoke.spec.ts`
- direct and TURN browser smoke are `review`, not final pass, because the local dev run exposed host/API URL cookie mismatch and route-guard instability after the lifecycle changes
- next segment should stabilize the local browser smoke environment and rerun direct + TURN before small-room/channel replacement

Segment 102 result:
- status: `private direct pass / private TURN pass / smoke env stabilized`
- `tests/browser/private-sfu-two-user-smoke.spec.ts` now defaults to a single `localhost` smoke profile and fails early if API and web hostnames diverge, preventing auth-cookie route-guard mismatch between `localhost` and `127.0.0.1`
- the smoke supports `PRIVATE_SFU_SMOKE_HOST`, `PRIVATE_SFU_SMOKE_API_PORT`, `PRIVATE_SFU_SMOKE_WEB_PORT`, and explicit API/web URL overrides, with `/api` base URL normalization
- `bun run test:browser:private-sfu` is now the repo-owned entrypoint for the guarded private SFU two-user browser smoke; normal `bun run test:browser` remains safe-skip without `PRIVATE_SFU_BROWSER_SMOKE=1`
- direct two-user private SFU browser smoke passed with both participants connected, one remote producer observed per participant, LiveKit default preserved for ordinary private `?video=true`, and private leave redirect preserved
- TURN relay private SFU browser smoke passed with local Docker coturn, relay-only query mode, backend-issued TURN credentials, both participants connected, one remote producer observed per participant, and LiveKit default preserved
- ordinary private calls and channel audio/video routes remain LiveKit; small-room/channel replacement has not started
- next segment should run final media MVP parity/load smoke before deciding whether broader replacement work can start

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

Segment 103 result:
- status: `private direct pass / private TURN pass / broader replacement hold`
- final parity smoke confirms ordinary private `?video=true` still falls back to `LiveKitClientAdapter` unless an explicit non-production conversation SFU gate is present
- channel `AUDIO` and `VIDEO` routes remain LiveKit by static boundary because SFU gate requires `mediaEntry.scope.kind === 'conversation'`
- backend provider binding remains `LiveKitMediaProviderAdapter`, and control-plane join still emits `providerAccess.metadata.provider = 'livekit-bridge'`
- direct private SFU browser smoke passed with two authenticated participants connected, one remote producer observed per participant, ordinary private LiveKit fallback assertion, and private leave redirect preserved
- TURN relay private SFU browser smoke passed with local Docker coturn and relay-only query mode
- screen-share is `deferred` for SFU because the private SFU path does not implement screen-share producer/consumer lifecycle yet; LiveKit fallback still owns the existing screen-share controls
- reconnect is `review` because SFU cleanup/restart exists, but explicit reconnect/resume smoke is not yet implemented
- device controls and real microphone/camera capture parity are `deferred`; private SFU smoke still uses synthetic audio
- small-room/channel load readiness is `review / hold broad replacement`; current proof is two-user private SFU local smoke only, with process-local prototype signaling/registry state
- final recommendation is `split next segment`: close private SFU device-controls/reconnect parity before any channel/small-room route replacement

Segment 104 result:
- status: `private SFU controls pass-review / restart pass-review / broad replacement still hold`
- explicit gated private SFU now supports `sfuCapture=real` for non-production conversation routes while synthetic audio remains the default repeatable smoke path
- real capture mode uses browser `getUserMedia` for requested audio/video and publishes all captured tracks through the scoped SFU path
- gated private SFU now has basic microphone mute/unmute and camera stop/start controls that toggle local track `enabled`
- browser smoke now verifies private SFU restart recovery and optional real-capture controls
- direct synthetic private SFU smoke passed with restart recovery and one remote producer per participant
- direct real-capture private SFU smoke passed in Chromium fake-device mode with two remote producers per participant and mic/camera control toggles
- TURN synthetic private SFU smoke passed with relay mode and restart recovery
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- device controls/capture are `pass / review`: automated fake-device path passes, physical device quality/permission UX remains manual review
- reconnect/restart is `pass / review`: user-triggered restart passes, network interruption reconnect/resume remains review
- recommended next segment is manual physical-device and network interruption QA before channel/small-room work

Segment 105 result:
- status: `manual synthetic pass / real capture blocked by missing camera / broad replacement hold`
- operator manual synthetic private SFU smoke passed: two authenticated users joined the gated private SFU path without `sfuCapture=real`, both reached `connected`, both had producer/consumer ids, and both observed `Remote producers: 1`
- manual real-capture QA was not marked pass because `sfuCapture=real` failed with `Requested device not found` on the operator machine, which has no physical camera available
- Segment 104 automated baseline remains the current proof: direct synthetic SFU pass, direct Chromium fake-device real-capture pass, and TURN synthetic SFU pass
- permission/device UX is `review / camera-missing fallback needed`; the current real-capture path fails the whole call when camera capture is unavailable instead of degrading to audio-only where possible
- network interruption reconnect/resume is `review / not manually executed`; user-triggered restart recovery is already covered, but real network loss/restore still needs a human-operated QA run
- TURN manual QA with physical devices is `review / not manually executed`; automated local coturn relay smoke remains pass from Segment 104
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- recommended next segment is `private-sfu-real-capture-device-fallback`, so no-camera machines can continue audio-only physical-device QA without failing the whole call

Segment 106 result:
- status: `no-camera fallback pass-simulated / synthetic pass / LiveKit preserved`
- gated private SFU `sfuCapture=real` still attempts requested audio+video first, but now retries audio-only when video capture fails because the camera is missing and `audio=true`
- the SFU UI now reports `Camera not found; continuing audio-only` and disables the camera control when no video track exists
- if audio-only fallback also fails, the failure reason explicitly says camera was not found and audio-only fallback failed
- browser smoke added `PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera` to simulate missing camera under the non-production private SFU gate
- direct synthetic private SFU smoke passed, confirming the default synthetic path did not regress
- direct real audio+video fake-device smoke passed, confirming the full real-capture path remains compatible
- direct simulated no-camera fallback smoke passed with both participants connected, one remote producer per participant, capture notice visible, microphone toggle working, and camera control disabled
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- recommended next segment is an operator rerun on the physical no-camera machine that exposed the original blocker

Segment 107 result:
- status: `operator no-camera audio-only fallback pass / stale producer lifecycle fixed / broad replacement hold`
- physical no-camera fallback is now marked pass based on operator evidence: two authenticated private SFU clients were rerun with `?video=true&mediaProvider=sfu&sfuCapture=real`, reached the real-capture audio-only path, and real voice audio was heard in both directions
- the earlier one-sided hum was explained by one client still using synthetic capture; synthetic capture intentionally produces generated test audio and is not a valid physical mic QA mode
- Segment 106 remains the automated proof for synthetic, fake-device real audio+video, simulated missing-camera audio-only fallback, microphone toggle, and disabled camera control behavior
- operator-observed inflated `Remote producers` counts and random stale audio were traced to stale SFU producers from older sessions in the same conversation room
- media join now marks older joined sessions for the same room identity as `left`, producer discovery cleans producers for non-joined sessions, and media leave closes scoped mediasoup resources
- two consecutive private SFU browser smoke runs plus a subsequent simulated no-camera fallback run passed on the same API process without inflated producer counts
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- remaining blockers before small-room/channel replacement are real network interruption reconnect/resume QA, physical camera QA on a machine with camera hardware, optional physical TURN relay signoff, and SFU screen-share implementation or explicit MVP deferral
- recommended next segment is `private-sfu-network-interruption-reconnect-qa`

Segment 108 result:
- status: `network interruption pass / restart recovery pass / broad replacement hold`
- gated private SFU now treats transient media signaling interruption after the initial snapshot as `reconnecting` instead of terminal `failed`
- when the browser restores the SSE stream and receives a fresh producer snapshot, the private SFU UI returns to `connected` if the remote producer remains consumed
- the guarded private SFU browser smoke now supports `PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1`, forcing one authenticated browser context offline for 6 seconds before restoring it
- browser offline-restore smoke passed with `PRIVATE_SFU_SMOKE_CAPTURE=real`, two authenticated participants, stable remote producer count, restored `connected` status, and successful Restart SFU private call recovery
- simulated no-camera fallback smoke passed again after the reconnect/status change, preserving the Segment 107 audio-only fallback result
- stale producer cleanup remained stable; no inflated remote producer count was observed
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- remaining blockers before small-room/channel replacement are physical camera QA on camera-equipped hardware, optional physical TURN relay signoff, SFU screen-share implementation or explicit MVP deferral, and broader small-room/channel load readiness
- recommended next segment is `private-sfu-physical-camera-turn-qa`

Segment 109 result:
- status: `physical camera deferred / local TURN audio-only smoke pass-review / broad replacement hold`
- physical camera QA is explicitly deferred because the local Windows device checks did not find active camera hardware; physical camera pass is not marked without a real camera
- no-camera audio-only fallback remains pass and was rerun through the guarded private SFU smoke
- local-only Docker coturn was started from `infra/coturn/docker-compose.local.yml`, and API/web were run locally with shell-only TURN env and `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=10.8.1.13`
- gated private SFU TURN relay smoke passed with `PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera` and `PRIVATE_SFU_SMOKE_TRANSPORT=turn`
- TURN physical/audio-only status remains `review`, not full physical pass, because this segment did not include a human listening check over TURN with real microphone capture
- ordinary private `?video=true` and channel `AUDIO`/`VIDEO` remain LiveKit; no broad replacement started
- remaining blockers before small-room/channel replacement are physical camera QA on camera-equipped hardware, optional human-operated TURN audio signoff if required, SFU screen-share implementation or explicit MVP deferral, and broader small-room/channel load readiness
- recommended next segment is `private-sfu-screen-share-mvp-decision`

Segment 110 result:
- status: `screen-share deferred-for-MVP / LiveKit fallback preserved / broad replacement hold`
- decision is `defer-for-MVP`: gated private SFU remains audio/video only for the current MVP readiness decision
- LiveKit remains the default/fallback for ordinary private `?video=true` and channel `AUDIO`/`VIDEO`, preserving the current `VideoConference` screen-share behavior outside the explicit non-production SFU gate
- current SFU private adapter has microphone, camera, restart, and leave controls, but no `getDisplayMedia` capture, screen producer source metadata, screen render target, or screen-share lifecycle cleanup
- future SFU screen-share implementation should be a separate narrow segment covering `getDisplayMedia`, source-aware producer metadata, single active share policy, remote screen rendering, stop/ended cleanup, restart/leave cleanup, and direct/TURN smoke
- remaining blockers before small-room/channel replacement are physical camera QA on camera-equipped hardware, optional human-operated TURN audio signoff if required, and broader small-room/channel load/readiness
- recommended next segment is `small-room-channel-sfu-readiness-plan`

Segment 111 result:
- status: `ready-to-implement-gated-channel / audio-first / broad replacement hold`
- readiness decision is `ready-to-implement-gated-channel`, limited to a controlled non-production explicit channel SFU pilot
- first implementation should be channel `AUDIO` only; channel `VIDEO` should follow after remote video layout/rendering and video smoke expectations are defined
- proposed gate is channel-route only, non-production only, and explicit query only, such as `?mediaProvider=sfu&sfuChannel=true` or `?sfu=true&sfuChannel=true`
- ordinary channel `AUDIO`, ordinary channel `VIDEO`, and ordinary private `?video=true` remain LiveKit by default
- prerequisites are documented for extracting/reusing SFU room lifecycle without private-route assumptions, enforcing audio-only behavior for `AUDIO` channels, adding multi-user channel smoke setup, and preserving LiveKit fallback assertions
- smoke/load matrix is defined for direct/TURN, two- and three-participant channel audio, leave/rejoin cleanup, restart recovery, offline/restore, no-camera fallback, and later channel video layout/load
- risks are documented: process-local state, multi-user scaling/rendering, persistent-room stale sessions, permissions, deferred screen-share, deferred physical camera QA, and review-only physical TURN signoff
- recommended next implementation segment is `gated-channel-audio-sfu-pilot`

Segment 112 result:
- status: `channel audio direct pass / two-user pilot / broad replacement hold`
- channel `AUDIO` SFU is now available only behind a non-production explicit channel gate: `?mediaProvider=sfu&sfuChannel=true` or `?sfu=true&sfuChannel=true`
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit even with `sfuChannel=true`, and ordinary private `?video=true` remains LiveKit
- the existing SFU lifecycle adapter is reused with channel-safe labels and forced audio-only props for channel `AUDIO`
- guarded browser smoke exists at `tests/browser/channel-audio-sfu-smoke.spec.ts` and repo script `bun run test:browser:channel-audio-sfu`
- direct two-user channel `AUDIO` browser smoke passed with both users connected, `Remote producers: 1` on both clients, `Requested media: audio on, video off`, restart recovery, no stale producer inflation, and leave redirect to the general text channel
- private SFU direct smoke passed again as a regression check
- channel `AUDIO` TURN relay and three-participant smoke are deferred to the next narrow segment before any broader channel replacement claim
- recommended next segment is `gated-channel-audio-sfu-3user-turn-rejoin-smoke`

Segment 113 result:
- status: `channel audio 3-user direct pass / TURN pass / broad replacement hold`
- guarded channel `AUDIO` smoke now defaults to three authenticated participants and supports `CHANNEL_AUDIO_SFU_SMOKE_USERS`, `CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN`, `CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE`, and `CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT=turn`
- three-user direct channel `AUDIO` smoke passed with all users connected, `Remote producers: 2` per participant, audio-only requested media, restart recovery, leave/rejoin cleanup, and no stale producer inflation
- three-user TURN relay channel `AUDIO` smoke passed through local Docker coturn with backend-issued local TURN credentials and relay policy
- coturn logs showed authenticated sessions, relay usage, allocation cleanup, and mediasoup peer cleanup for `10.8.1.13`
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit even with `sfuChannel=true`, and private SFU direct smoke passed again as a regression check
- explicit channel offline/restore was not run in this segment because restart recovery passed and the smoke now has an optional offline env flag for a later run
- recommended next segment is `gated-channel-audio-sfu-5user-load-offline-smoke`

Segment 114 result:
- status: `channel audio 5-user direct pass / offline-restore pass / broad replacement hold`
- five-user direct channel `AUDIO` smoke passed through the existing non-production explicit gate with all participants connected and `Remote producers: 4` per participant
- explicit offline/restore smoke passed with all participants returning to `connected` and `Remote producers: 4`
- restart recovery and leave/rejoin cleanup passed in the same five-user run, with no stale producer inflation observed
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit even with `sfuChannel=true`, and private SFU direct smoke passed again as a regression check
- five-user TURN was not run because it is optional in this segment; Segment 113 three-user TURN channel `AUDIO` remains the current relay proof
- recommended next segment is `channel-video-sfu-layout-readiness-plan`

Segment 115 result:
- status: `ready-to-implement-gated-channel-video / layout plan only / no runtime switch`
- channel `VIDEO` SFU readiness decision is `ready-to-implement-gated-channel-video`, limited to a non-production explicit pilot and not a default switch
- current SFU video capability was inventoried: backend VP8 produce/consume and scoped room/session checks exist, while the current client UI only has a single remote video element and is not ready for multi-participant channel video rendering
- proposed channel video gate is stricter than channel audio: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true` or `?sfu=true&sfuChannel=true&sfuVideo=true`, with `sfuCapture=real` for video smoke and optional `sfuTransport=turn`
- layout requirements are defined for 2, 3, and 5 participants, including participant-keyed remote media, one remote tile per participant, audio-only placeholders, stable grid sizing, restart cleanup, leave/rejoin cleanup, and no stale producer inflation
- capture/no-camera behavior is defined: try real audio+video first, continue audio-only when the camera is missing and microphone capture succeeds, disable camera control, and keep the call connected where possible
- direct/TURN smoke matrix is defined for 2-user, 3-user, 5-user, no-camera fallback, leave/rejoin, restart, offline/restore, LiveKit fallback assertions, channel `AUDIO` regression, and private SFU regression
- risks remain autoplay, multi-video grid work, camera absence, source metadata for future screen-share, deferred SFU screen-share, process-local state, and 5-user video load
- recommended next segment is `gated-channel-video-sfu-layout-prototype`

Segment 116 result:
- status: `channel video 2-user direct pass / layout prototype pass / broad replacement hold`
- channel `VIDEO` SFU now opens only behind the full non-production explicit gate `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real` or `?sfu=true&sfuChannel=true&sfuVideo=true&sfuCapture=real`
- ordinary channel `VIDEO` without the full gate remains LiveKit, including partial SFU query variants without `sfuCapture=real`
- existing channel `AUDIO` SFU gate and ordinary channel `AUDIO` LiveKit default are preserved
- the existing SFU adapter now supports a `participant-grid` remote video layout that models remote media by `participantSessionId` and renders one remote video tile or audio-only placeholder per remote participant
- guarded two-user channel `VIDEO` browser smoke exists at `tests/browser/channel-video-sfu-smoke.spec.ts` with script `bun.cmd run test:browser:channel-video-sfu`
- two-user channel `VIDEO` direct smoke passed with both users connected, `Remote producers: 2` per participant, visible local previews, one remote video tile per participant, no-camera audio-only fallback preserved, and channel leave redirect preserved
- channel `AUDIO` SFU regression passed, private SFU regression passed, ordinary channel `AUDIO` without the gate remained LiveKit, and ordinary channel `VIDEO` without the full gate remained LiveKit
- recommended next segment is `gated-channel-video-sfu-3user-turn-rejoin-smoke`

Segment 117 result:
- status: `channel video 3-user direct pass / TURN pass / restart leave-rejoin pass`
- guarded channel `VIDEO` smoke now supports `CHANNEL_VIDEO_SFU_SMOKE_USERS`, leave/rejoin assertions, restart recovery assertions, and `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`
- three-user direct channel `VIDEO` smoke passed with all users connected, `Remote producers: 4` per participant, two remote video tiles per participant, restart recovery, leave/rejoin cleanup, and no stale tile or producer inflation
- three-user TURN relay channel `VIDEO` smoke passed through local Docker coturn with the same restart, leave/rejoin, producer count, and video tile assertions
- ordinary channel `VIDEO` without the full gate remains LiveKit, ordinary channel `AUDIO` without the gate remains LiveKit, channel `AUDIO` SFU regression passed, and private SFU regression passed
- recommended next segment is `gated-channel-video-sfu-5user-load-offline-smoke`

Segment 118 result:
- status: `channel video 5-user direct pass / offline-restore pass / broad replacement hold`
- guarded channel `VIDEO` smoke now supports `CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1`
- five-user direct channel `VIDEO` smoke passed with all users connected, `Remote producers: 8` per participant, four remote video tiles per participant, visible local fake-camera previews, restart recovery, leave/rejoin cleanup, and no stale tile or producer inflation
- explicit offline/restore passed in the five-user channel `VIDEO` smoke after one browser context was forced offline for 6 seconds and restored
- five-user TURN was not rerun because it is optional in this segment; Segment 117 three-user TURN channel `VIDEO` remains the current relay proof
- ordinary channel `VIDEO` without the full gate remains LiveKit, ordinary channel `AUDIO` without the gate remains LiveKit, channel `AUDIO` SFU regression passed, and private SFU regression passed
- recommended next segment is `channel-video-sfu-physical-camera-turn-signoff`

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
- `channel-video-sfu-physical-camera-turn-signoff`

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

Next active work can continue controlled replacement:
- `channel-video-sfu-physical-camera-turn-signoff`
