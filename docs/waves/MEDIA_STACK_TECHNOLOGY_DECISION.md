# Wave 32. Media Stack Technology Decision

## Goal

Fix the target media stack before deeper Stage 7 inventory/design work.

This wave is documentation-only. It does not install media dependencies, does not deploy media infrastructure, does not change the current LiveKit runtime, and does not fix the current microphone/media symptom.

## Decision

Target media stack:

- `mediasoup` as the SFU layer
- `coturn` as the TURN/STUN layer
- `apps/api` as the application-owned signaling and control-plane owner
- `packages/app-core` as the owner of vendor-neutral media contracts and event types
- `packages/sdk` as the client access layer for media control-plane commands/events
- web/desktop shells as local capture/render/UI orchestration only

Current LiveKit runtime remains a temporary bridge until a later scoped implementation wave replaces it.

Self-hosted LiveKit is not the target architecture. It can remove the managed LiveKit Cloud subscription, but it would keep the product coupled to LiveKit room, token, client, component, and operational model.

## Why Not Self-Hosted LiveKit as Target

Self-hosted LiveKit is viable if the only goal is to stop using LiveKit Cloud.

It is not enough for the project's stated target because:

- the app would still be coupled to LiveKit APIs and room model
- browser runtime would still depend on LiveKit client/component behavior
- media permissions would still map through LiveKit grants instead of project-owned policy
- reconnect, participant state, screen share, and diagnostics would still largely be LiveKit-shaped
- future product behavior would remain constrained by a full external media platform, even if self-hosted

Therefore self-hosted LiveKit is treated only as a possible temporary operational bridge, not as the final Stage 7/8 target.

## What Mediasoup Is For

`mediasoup` is the SFU part of the stack.

In practical terms, it is responsible for the server-side media routing layer:

- receives published audio/video/screen-share RTP streams from clients
- routes selected streams to other participants
- creates and manages WebRTC transports, producers, and consumers
- lets the application decide its own room lifecycle, participant lifecycle, permissions, and signaling model

`mediasoup` is not a complete app server. It does not replace `apps/api`, auth, room permissions, SDK contracts, UI, or product state.

## What Coturn Is For

`coturn` is the TURN/STUN part of the stack.

In practical terms, it helps WebRTC clients connect across real networks:

- STUN helps clients discover their public network candidate
- TURN relays traffic when direct peer/SFU connectivity is blocked by NAT, firewall, corporate networks, mobile networks, or restrictive routers
- TURN is required for production-grade reliability, even when an SFU exists

`coturn` does not route conference media like an SFU. It is network traversal/relay infrastructure, not the media room engine.

## Product Interaction Model

The target product model is Discord-like for everyday server communication and Zoom-like for structured meetings/conferences.

The media engine should stay unified across all interaction modes. Private calls, channel calls, and future conference rooms must not become separate media implementations.

Interaction modes:

- private call: a media room scoped to a direct conversation
- server voice/video channel: a persistent media room scoped to a server channel
- structured meeting/conference: a media room scoped to a future meeting/session entity
- large room or stage: the same room engine with stricter publish, subscribe, moderation, and active-speaker policies

The differences between these modes belong in domain policy:

- who may join
- who may publish audio
- who may publish video
- who may share screen
- who may moderate
- how participants are displayed and subscribed to
- whether the room behaves like an always-on channel, direct call, or scheduled/hosted session

The shared technical core remains:

- join room
- leave room
- publish track
- unpublish track
- subscribe to track
- mute/unmute state
- screen-share state
- participant state
- reconnect state
- room permission checks

Large rooms should not assume that every participant publishes and receives every stream at full quality. The intended direction is SFU-based selective subscription, active-speaker behavior, publisher limits where needed, and adaptive client rendering.

## Target Runtime Shape

Planned shape:

1. Client asks `apps/api` to join a domain media room.
2. `apps/api` verifies auth, server/channel/conversation access, and media permissions.
3. `apps/api` creates or resolves a media session/participant state.
4. Client and backend exchange signaling/control messages over the project-owned media boundary.
5. `mediasoup` handles WebRTC media transports and stream routing.
6. `coturn` is used by clients when network traversal requires STUN/TURN.
7. UI consumes project media contracts instead of directly owning SFU-specific or vendor-specific concepts.

## Stage 7 Scope Impact

This decision changes the next Stage 7 order:

1. `media-stack-technology-decision`
2. `media-runtime-inventory`
3. `media-contract-boundary-inventory`
4. `media-contract-shape-design`
5. `media-control-plane-design`
6. `media-client-boundary-design`
7. `sfu-turn-architecture-design`
8. `livekit-adapter-containment`
9. `media-mvp-implementation-plan`

## Segment 076 Runtime Inventory Findings

Current runtime flow:

```text
channel AUDIO/VIDEO route or private conversation ?video=true route
  -> server/auth route guard
  -> MediaRoom(chatId = channel.id or conversation.id)
  -> SDK getLiveKitToken(room = chatId, username = profile display name)
  -> apps/api GET /api/media/livekit-token
  -> LiveKit AccessToken(roomJoin + publish + subscribe)
  -> LiveKitRoom(serverUrl = NEXT_PUBLIC_LIVEKIT_URL)
  -> onConnected starts requested microphone/camera
  -> VideoConference owns active conference UI controls
```

Current coupling points:
- `livekit-server-sdk` token generation in `apps/api`
- `@livekit/components-react` and `@livekit/components-styles` in `MediaRoom`
- direct `livekit-client` import for `Room` and `MediaDeviceFailure`
- `NEXT_PUBLIC_LIVEKIT_URL` in browser runtime
- LiveKit grants for room join, publish, and subscribe
- LiveKit `VideoConference` ownership of mute/camera/screen-share controls
- `.lk-disconnect-button` click detection for intentional leave

Runtime findings that the next contract segment must preserve:
- channel `AUDIO` starts with microphone only
- channel `VIDEO` starts with microphone and camera
- private conversation video mode starts with microphone and camera
- channel rooms are scoped to `channel.id`
- private rooms are scoped to `conversation.id`
- channel leave returns to a general text channel or server fallback
- private call leave returns to the conversation chat route without `?video=true`
- local device startup retries preferred device first, then default
- device permission/in-use/not-found errors surface to users
- intentional leave is distinct from unexpected disconnect

Known gaps/risks:
- `livekit-client` is directly imported but not explicitly declared in root `package.json`
- media token identity is a display name, not a stable profile/member/user id
- media token endpoint accepts caller-provided `room` and `username`
- media controller has no explicit auth guard or domain permission check in the file
- token grants always allow publish and subscribe
- screen share, reconnect, participant lifecycle, and post-join mute/camera state are not project-owned
- backend media ownership is token issuance only, not room/session/control-plane ownership

Next recommended segment:
- `media-contract-boundary-inventory`

## Segment 077 Contract Boundary Findings

Current seed contract:
- `packages/app-core/src/contracts/media-provider.ts` already has vendor-neutral room, participant, access, permission, state patch, and provider concepts
- it does not mention LiveKit directly
- it can carry transitional token/endpoint fields while LiveKit remains the bridge

Missing contract areas before control-plane design:
- room scope union for `channel`, `conversation`, and future `meeting`
- room mode for persistent channel, private call, meeting, large room, and stage-like behavior
- stable participant identity: `profileId`, `memberId`, `participantSessionId`, optional connection identity, and display name as presentation only
- granular permissions: join, publish audio, publish video, publish screen share, subscribe, and moderate
- room lifecycle commands/events for resolve/create/join/leave/close
- participant lifecycle states/events for joined, left, disconnected, reconnecting, reconnected, and expired
- media state split between desired local intent and confirmed published state
- track model with id, kind, source, owner participant session, and state
- reconnect model with timeout/resume policy and intentional-leave vs network-disconnect distinction
- screen-share policy and active presenter model
- stable media error taxonomy
- client command names and server event names

Boundary rule:
- private calls, channel calls, future meetings, and large-room/stage modes must use one media engine and one control-plane family
- differences belong in room scope, room mode, permissions, lifecycle policy, subscription/publish policy, and moderation policy
- differences must not become separate media engines, unrelated APIs, separate client runtimes, or separate room/participant state models

Gap classification:
- pass: a vendor-neutral seed contract exists and captures rough room/participant/access/permission concepts
- review: decide how to split facade, command, query, event, transitional token/endpoint, and client-only device-error contracts
- block: media control-plane design needs explicit room scope, stable participant/session identity, permission, lifecycle, track, reconnect, screen-share, error, command, and event contracts first

Next recommended segment:
- `media-control-plane-design`

## Segment 078 Contract Shape Findings

Concrete vendor-neutral contract shapes are documented in `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`.

Shape areas:
- room scope and mode: `channel`, `conversation`, future `meeting`, persistent channel, private call, meeting, large room, and stage
- participant/session identity: `profileId`, optional `memberId`, `participantSessionId`, optional `connectionId`, and display name as presentation-only data
- permissions: join, publish audio, publish video, publish screen share, subscribe, and moderate
- media state: desired local intent separated from confirmed published state
- track model: id, owner participant session, kind, source, state, and UI metadata
- room lifecycle commands/events: resolve, create/resolve, join, leave, close
- participant lifecycle commands/events: join, leave, disconnected, reconnecting, reconnected, expired
- reconnect/resume: timeout policy, resume handle, disconnect reason, and intentional-leave distinction
- screen-share policy: active presenter, max active shares, and replacement policy
- error taxonomy: stable media error codes for auth, permission, room, device, publish/subscribe, transport, reconnect, provider, and unknown failures
- client commands and server events as app media concepts, not vendor API concepts

Design boundary:
- these are docs-only shapes, not committed `packages/app-core` code
- they do not design mediasoup transport internals
- `apps/api` control-plane design should map to these shapes before any implementation segment

Next recommended segment:
- `media-control-plane-design`

## Segment 079 Media Control-Plane Findings

Future `apps/api` media control-plane ownership is documented in `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`.

Backend ownership shape:
- `MediaAccessService` resolves room scope and enforces backend auth/domain access
- `MediaRoomService` creates/resolves rooms and owns room lifecycle state/events
- `MediaParticipantSessionService` owns participant sessions, intentional leave, disconnect, reconnect, resume, and expiry
- `MediaPermissionService` evaluates join, publish audio, publish video, publish screen share, subscribe, and moderate permissions
- `MediaSignalingGateway` owns media WebSocket/signaling commands and emits Segment 078 media events
- `MediaProviderAdapter` hides transitional LiveKit access now and future mediasoup/coturn-backed provider details later

Design decisions:
- REST owns durable request/response commands: resolve room access, join, leave, close, and access snapshots
- WebSocket/signaling owns realtime session binding, desired media state updates, track publish/unpublish, screen-share commands, reconnect/resume, provider signaling envelopes, and server events
- media access must use `RequireAuthGuard` and `CurrentProfileId`, then resolve server membership, channel access, conversation membership, or future meeting access in backend services
- caller-provided `room` and `username` must be replaced by backend-resolved room scope plus stable `profileId`, `memberId`, `participantSessionId`, and presentation-only `displayName`
- private calls, channel calls, future meetings, and large-room/stage modes continue to use one control-plane family and differ by scope, mode, policy, and permissions
- LiveKit remains a transitional bridge; token creation should later move behind the provider adapter without deleting the current runtime in this planning segment

Open decisions:
- whether media signaling extends the existing `realtime` namespace or uses a dedicated media namespace
- initial participant-session persistence strategy
- whether resume needs a separate `resumeToken`
- exact REST route names and app-core contract file split
- persistent channel versus private-call room persistence semantics

Next recommended segment:
- `media-client-boundary-design`

## Segment 080 Media Client Boundary Findings

Future web/desktop media client boundary ownership is documented in `docs/delegation/briefs/SEGMENT_BRIEF_080_MEDIA_CLIENT_BOUNDARY_DESIGN.md`.

Client ownership shape:
- app UI shell passes domain scope, mode, initial desired media state, and leave redirect behavior
- media entry mapper normalizes channel, private conversation, and future meeting entries into one boundary
- media feature controller/hook coordinates SDK commands, realtime events, provider adapter connection, desired state, leave, and reconnect
- SDK media commands should expose app-domain commands such as resolve room access, join, leave, desired-state updates, publish/unpublish, screen share, reconnect, and resume
- realtime event subscription should consume the Segment 078 media event names
- provider adapter hides LiveKit now and future provider details later
- browser capture/renderer layer remains responsible for device prompts, preferred-device fallback, local capture, rendering, and user-visible device errors

Design decisions:
- project media state, browser device state, and provider adapter state must be separate
- channel `AUDIO`, channel `VIDEO`, private video call, and future meeting entries use one client boundary and differ by scope, mode, initial desired state, and leave policy
- current behaviors to preserve include AUDIO mic-only, VIDEO mic+camera, private video mic+camera, channel/private leave redirects, preferred-device fallback, and device error toasts
- browser capture/render stays client-side, while room access, permissions, lifecycle, participant sessions, and reconnect policy stay owned by `apps/api`
- LiveKit client imports/components should later be contained behind a client provider adapter without deleting LiveKit during the transition

Open decisions:
- exact client file/package placement for controller, adapter, and renderer/capture layer
- whether the first transitional adapter can wrap `VideoConference` or should split controls earlier
- SDK route/command names and app-core contract file split
- whether media signaling uses a dedicated namespace/gateway or extends existing realtime
- device error taxonomy placement between shared contracts and client-only adapter code

Next recommended segment:
- `sfu-turn-architecture-design`

## Guardrails

Forbidden in this wave:

- adding `mediasoup`, `mediasoup-client`, `coturn`, or related runtime dependencies
- editing `MediaRoom`
- deleting LiveKit
- changing media token behavior
- changing production deploy, PM2, Nginx, Docker, or server env files
- fixing the microphone/media bug
- mixing this with Stage 6 production Postgres cutover

## Open Questions For Later Waves

- whether MVP starts with 1:1 only or small channel rooms too
- whether initial media signaling reuses the existing realtime gateway or gets a separate media namespace/gateway
- local dev topology for mediasoup worker ports and TURN
- production topology for public IP, UDP/TCP ranges, TLS, TURN credentials, and firewall rules
- observability needs for transport failures, ICE failures, reconnects, packet loss, and room lifecycle
- whether Redis is needed later for multi-instance signaling/state, not for the first single-node MVP

## References

- LiveKit self-hosting: https://docs.livekit.io/transport/self-hosting/
- mediasoup documentation: https://mediasoup.org/documentation/
- coturn project: https://github.com/coturn/coturn
