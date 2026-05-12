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
- no LiveKit removal

Acceptance:
- current token endpoint behavior preserved
- no product behavior change
- backend LiveKit-specific code is no longer owned directly by the controller path

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
- no LiveKit removal

Acceptance:
- local prototype can create a room/router/transport path behind adapter boundary
- current LiveKit fallback remains usable
- no production rollout behavior changes

### 9. `local-coturn-turn-credential`

Goal:
- add local TURN credential/control-plane support for relay-path testing

Depends on:
- `local-mediasoup-dependency-prototype`
- Segment 081 security decisions

Expected output:
- local TURN credential issuance design/implementation
- no open relay
- no production secret or deploy changes
- local relay smoke path

Acceptance:
- direct and TURN-relayed local ICE paths can be tested
- credentials are short-lived/backend-issued or explicitly local-only

### 10. `mediasoup-client-adapter`

Goal:
- add the client provider adapter for the non-LiveKit path

Depends on:
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

### 11. `mvp-private-small-room-replacement`

Goal:
- switch a controlled private/small-room flow to the new media path behind fallback gates

Depends on:
- `mediasoup-client-adapter`
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

### 12. `final-media-mvp-parity-load-smoke`

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
9. mediasoup client adapter
10. controlled replacement
11. final parity/load smoke

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
- production coturn deployment
- production mediasoup process management
- production TURN credentials/secrets
- production monitoring/alerting rollout
- removing LiveKit from production

Production media infra should get its own runbook/implementation wave after local MVP parity is proven.

## Blockers Before First Code Segment

Before `app-core-media-contracts-code`:
- accept Segment 078 contract vocabulary as the code target
- choose contract file split under `packages/app-core`
- keep provider access metadata explicitly transitional
- confirm no LiveKit/mediasoup/coturn runtime imports enter app-core contracts
- define type export path compatibility so existing imports do not churn unnecessarily
- keep first PR narrow to contracts only

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

Next active work should move to the first code segment:
- `app-core-media-contracts-code`
