# SEGMENT BRIEF 081. SFU / TURN Architecture Design

Branch:
- `wave/stage7-sfu-turn-architecture-design`

Segment:
- `sfu-turn-architecture-design`

## Goal

Design the future `mediasoup + coturn` topology at documentation level.

This segment covers local development, single-server VPS production MVP, networking, ports, credentials, scaling, security, and operational constraints. It does not change runtime code, does not add `mediasoup` or `coturn` dependencies, does not add Docker/systemd/Nginx/firewall configs, does not change env, does not touch production deploy docs, does not fix the microphone/media symptom, and does not start implementation.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_080_MEDIA_CLIENT_BOUNDARY_DESIGN.md`

Official docs checked:
- mediasoup documentation/API: `https://mediasoup.org/documentation/`
- coturn repository/docs: `https://github.com/coturn/coturn`
- WebRTC peer connection / ICE basics: `https://webrtc.org/getting-started/peer-connections`
- MDN WebRTC protocol overview: `https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols`

Branch note:
- the requested branch was not present locally or on `origin`; this docs-only branch was created locally from the current Stage 7 client-boundary head.

## Official Docs Findings

Relevant mediasoup constraints:
- `mediasoup` is a low-level SFU layer; the application still owns rooms, permissions, signaling, participant lifecycle, and product state
- a mediasoup `Router` forwards media streams through transports and can be treated as a low-level media room primitive, not as the product room contract
- `WebRtcTransport` and `WebRtcServer` require bindable host IPs
- when listening on wildcard addresses such as `0.0.0.0` or `::`, an announced public address is required
- mediasoup WebRTC transport is ICE Lite, so browsers initiate ICE connectivity checks
- workers/routers can be used for CPU/core isolation and later expansion, but multi-router/distributed SFU behavior is not needed for the first MVP

Relevant coturn constraints:
- WebRTC TURN relay should use authenticated access, not anonymous relay mode
- coturn supports long-term credentials and TURN REST API style time-limited credentials
- relay port ranges can be constrained with `min-port` / `max-port`
- NAT/public-IP deployment needs explicit external address handling when applicable

Relevant WebRTC constraints:
- signaling is not part of WebRTC and must be provided by the application
- ICE candidate gathering uses STUN and/or TURN servers
- TURN relays traffic when direct connectivity is not possible and should be treated as a reliability fallback with bandwidth cost

## Target Topology

Target logical topology:

```text
browser / desktop client
  | HTTPS REST + WSS signaling/control
  v
apps/api media control-plane
  | in-process or same-host adapter calls
  v
mediasoup worker/router layer
  ^ direct WebRTC media packets when possible
  |
coturn TURN/STUN
  ^ relay path when client network requires TURN
```

Ownership:
- `apps/api` owns auth, room access, participant sessions, permissions, lifecycle commands/events, and signaling/control messages
- mediasoup owns SFU media routing, WebRTC transports, routers, producers, consumers, and RTP/RTCP media movement
- coturn owns STUN/TURN/NAT traversal and relay traffic
- clients own browser capture/rendering and consume backend-issued access/ICE credentials

Boundary rule:
- app contracts must not expose mediasoup producer/consumer/router internals as product room/participant contracts
- private calls, channel calls, future meetings, and large-room/stage modes use one control-plane and one media stack direction; they differ by room scope, mode, policy, and permissions

## Traffic Separation

### Signaling / Control-Plane Traffic

Traffic:
- HTTPS REST for durable commands such as resolve, join, leave, close, snapshots, and TURN credential fetch
- WSS or Socket.IO over TLS for signaling commands/events and provider signaling envelopes

Path:
- client -> HTTPS/WSS endpoint -> reverse proxy/TLS boundary -> `apps/api`

Rules:
- Nginx/reverse proxy may terminate TLS for HTTP/WSS app traffic
- signaling messages contain room/session/control data, not media RTP packets
- signaling remains app-authenticated and app-authorized
- signaling route/namespace choice remains an open decision from Segments 079/080

### WebRTC Media Traffic

Traffic:
- DTLS/SRTP/RTCP/ICE packets between browser and mediasoup WebRTC transport/server
- primarily UDP, with TCP fallback only if explicitly designed later

Path:
- client -> public VPS IP and mediasoup RTC port/range -> mediasoup worker/router layer

Rules:
- media packets should not be proxied through the HTTP reverse proxy
- mediasoup listen IP must be bindable on the host
- public deployments need an announced public address when binding to wildcard or private addresses
- the firewall must allow the selected mediasoup RTC UDP/TCP port range

### TURN Relay Traffic

Traffic:
- client -> coturn listening port for STUN/TURN allocation
- coturn -> mediasoup RTC address/port when relay is selected by ICE

Path:
- client -> public VPS IP coturn listener -> coturn relay port range -> mediasoup RTC port/range

Rules:
- TURN must not be configured for anonymous relay access
- TURN credentials should be short-lived or backend-issued
- relay traffic has bandwidth cost and should be observable as a distinct path
- coturn relay port range and mediasoup RTC range must be planned so firewall rules are explicit

## Local Development Topology

No local infra is added in this segment.

Local design assumptions:
- `apps/api` continues to serve media control-plane REST/WSS on the existing dev API origin
- local mediasoup should run on the developer machine when implementation begins
- local mediasoup should bind to a loopback or local interface address that is actually bindable
- local announced address can be `127.0.0.1` or a LAN IP depending on whether tests run in the same machine browser or across devices
- local RTC port range should be bounded and disposable
- local coturn is optional for first local smoke if same-machine direct ICE is enough
- local coturn becomes required for testing TURN-only/relay behavior or restrictive-network reproduction

Suggested local planning placeholders:
- app/control traffic: existing local API HTTP/WSS ports
- mediasoup RTC range: reserved high UDP range, exact range deferred
- coturn listener: standard TURN port family or local alternate port, exact choice deferred
- coturn relay range: bounded high UDP range, exact range deferred

Local constraints:
- no production secrets in local TURN credentials
- no anonymous relay mode even in local shared networks
- disposable state only
- no Docker/systemd/firewall files until a scoped implementation segment

## Single-Server VPS Production MVP Topology

First production MVP direction:
- single VPS
- `apps/api` and mediasoup worker/router layer on the same host
- coturn on the same host
- public IP used as the announced media/TURN address
- reverse proxy/TLS boundary handles HTTPS/WSS only
- direct UDP/TCP firewall openings handle WebRTC media and TURN relay traffic

Text topology:

```text
Internet clients
  | HTTPS 443 / WSS 443
  v
Nginx / TLS boundary
  v
apps/api control-plane
  | local process/service boundary
  v
mediasoup workers/routers

Internet clients
  | UDP/TCP selected RTC range
  v
mediasoup WebRTC transports

Internet clients
  | UDP/TCP/TLS TURN listener
  v
coturn
  | UDP/TCP relay range
  v
mediasoup WebRTC transports
```

Production MVP networking decisions:
- one public IPv4 is enough for the first design, if firewall and announced address are correct
- TLS/HTTPS/WSS remains at the app reverse-proxy boundary
- mediasoup WebRTC media uses direct public IP/port candidates, not Nginx HTTP proxying
- TURN provides fallback for restrictive client networks
- exact UDP/TCP ranges are not fixed in this segment
- exact Docker/systemd process ownership is not fixed in this segment

Firewall needs:
- HTTP/HTTPS app ports already required by the app runtime
- WSS over the same TLS boundary or a documented backend websocket port/path
- mediasoup RTC UDP range
- optional mediasoup TCP fallback range if selected later
- coturn listener port(s)
- coturn relay UDP range
- optional TURN-over-TCP/TLS port(s) if selected later

## Security Decisions

Required:
- no anonymous TURN relay
- backend-issued or short-lived TURN credentials
- TURN shared secret stored only server-side when implementation begins
- do not log TURN passwords, provider tokens, or media access secrets
- rate-limit or abuse-protect media join and TURN credential issuance endpoints
- restrict firewall exposure to the chosen media/TURN ranges
- validate room access and permissions in `apps/api` before issuing provider access or TURN credentials
- treat TURN relay bandwidth as an abuse and cost surface

Preferred direction:
- use coturn REST API style time-limited credentials for browser clients
- bind TURN credentials to authenticated app profile/session or participant session where practical
- make TURN credential TTL shorter than or equal to the media session bootstrap window
- refresh credentials through backend control-plane only when the participant session remains valid

Explicit non-goals:
- static public TURN credentials in client bundles
- shared hard-coded TURN usernames/passwords
- anonymous relay mode for convenience
- production media secrets in docs or repo

## Scaling Path

MVP scaling:
- single mediasoup node first
- run one or more mediasoup workers on the same host
- worker count may align with CPU/core availability during implementation
- pin each app media room to one mediasoup router/worker for the first MVP
- keep room-to-worker placement in `apps/api` control-plane state
- avoid distributed SFU and inter-host routing early

Later scaling:
- add room placement and capacity policy
- add Redis/pubsub only when multiple `apps/api` or media nodes require shared signaling/session state
- add multi-node routing only after single-node bottlenecks are measured
- evaluate mediasoup router piping only for explicit large-room/broadcast needs
- keep large-room selective subscription and publisher limits as policy, not a separate engine

Do not do early:
- distributed SFU cluster
- cross-region media routing
- recording/egress architecture
- Redis dependency before multi-instance state requires it
- Kubernetes/media orchestration as part of the MVP

## Observability Requirements

Control-plane logs:
- room resolved/created/joined/left/closed
- participant joined/left/disconnected/reconnecting/reconnected/expired
- permission denied reasons
- screen-share accepted/rejected
- reconnect started/succeeded/expired/rejected
- TURN credential issued, without logging secrets

Media/SFU metrics:
- transport creation/close/failure counts
- ICE connection failures
- DTLS/transport failures
- producer/consumer counts
- bitrate trends
- packet loss and retransmission indicators where available
- selected candidate path when observable: direct vs TURN relay

Client-visible telemetry:
- device permission denied
- device in use
- device not found
- media publish denied
- provider unavailable
- reconnect timeout

Operational alerts later:
- high TURN relay bandwidth
- repeated ICE failures after deploy
- mediasoup worker process crash/restart
- high room join failure rate
- high reconnect failure rate

## Open Decisions

Review:
- exact mediasoup RTC UDP/TCP port range
- exact coturn listener and relay port ranges
- whether TURN-over-TLS uses `5349`, `443`, or another production-specific path
- whether local/prod run as Docker containers, systemd services, PM2-managed processes, or mixed ownership
- whether media signaling uses a dedicated media gateway/namespace or extends existing realtime
- initial participant-session state persistence for process restart behavior
- TURN credential TTL and refresh policy
- whether first MVP enables TCP fallback for mediasoup or relies on TURN for restrictive networks
- exact observability stack and metric naming

Out of scope:
- recording/egress
- distributed SFU
- cross-region routing
- production network access commands
- Docker/systemd/Nginx config files
- dependency installation

## Blockers Before Implementation

Block:
- app-core contract implementation for Segment 078 shapes
- `apps/api` control-plane service/gateway implementation plan
- SDK media command/realtime subscription implementation plan
- client LiveKit adapter containment plan
- exact port range decision
- TURN credential strategy decision
- local smoke procedure for direct and TURN-relayed ICE paths
- production operator review for public IP, firewall, process owner, TLS/WSS boundary, and secret handling

Guardrail:
- no media runtime dependencies, Docker, systemd, Nginx, firewall, or env changes should land before a separate scoped implementation segment.

## Acceptance Criteria

Pass:
- topology separates `apps/api` control-plane, mediasoup worker/router layer, and coturn STUN/TURN
- signaling/control traffic, WebRTC media traffic, and TURN relay traffic are separated
- local dev assumptions are documented without adding infra
- single-server VPS production MVP topology is documented
- security decisions reject anonymous relay mode and prefer short-lived/backend-issued TURN credentials
- scaling starts single-node and defers Redis/distributed SFU until needed
- observability needs cover ICE, reconnect, transport, bitrate/packet loss, room, and participant lifecycle
- open decisions and implementation blockers are explicit

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `livekit-adapter-containment`

Reason:
- backend control-plane design, client boundary design, and SFU/TURN topology are now documented at design level. The next planning slice should define how current LiveKit usage is contained behind transitional backend/client adapter boundaries without removing LiveKit or starting the mediasoup implementation.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
