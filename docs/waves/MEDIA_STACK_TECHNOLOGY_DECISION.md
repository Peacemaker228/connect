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
4. `media-control-plane-design`
5. `media-client-boundary-design`
6. `sfu-turn-architecture-design`
7. `livekit-adapter-containment`
8. `media-mvp-implementation-plan`

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
