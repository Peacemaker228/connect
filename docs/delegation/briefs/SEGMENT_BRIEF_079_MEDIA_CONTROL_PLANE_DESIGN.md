# SEGMENT BRIEF 079. Media Control Plane Design

Branch:
- `wave/stage7-media-control-plane-design`

Segment:
- `media-control-plane-design`

## Goal

Design the future `apps/api` media control plane at documentation level.

This segment describes backend ownership for room access, participant sessions, permissions, lifecycle commands/events, and the signaling/control boundary. It does not change runtime code, does not change `packages/app-core` contracts, does not remove LiveKit, does not add `mediasoup` or `coturn`, and does not design SFU transport internals.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_077_MEDIA_CONTRACT_BOUNDARY_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`

Backend files read:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `apps/api/src/modules/realtime/realtime.gateway.ts`
- `apps/api/src/modules/realtime/realtime.events.ts`
- `apps/api/src/modules/auth/guards/require-auth.guard.ts`
- `apps/api/src/modules/auth/decorators/current-profile-id.decorator.ts`
- `apps/api/src/modules/channels/channels.controller.ts`
- `apps/api/src/modules/channels/channels.service.ts`
- `apps/api/src/modules/members/members.controller.ts`
- `apps/api/src/modules/members/members.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`

Branch note:
- the requested branch was not present locally or on `origin`; this docs-only branch was created locally from the current Stage 7 contract-shape head.

## Current Backend Findings

Current `apps/api` media ownership is only a LiveKit token bridge:
- `MediaController` exposes `GET /api/media/livekit-token`
- the endpoint accepts caller-provided `room` and `username`
- `username` becomes the LiveKit token identity
- the token grant always allows `roomJoin`, `canPublish`, and `canSubscribe`
- the controller reads `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL`
- `MediaModule` registers only `MediaController`

Current auth/domain contrast:
- `ChannelsController`, `MembersController`, and `DirectMessagesController` use `@UseGuards(RequireAuthGuard)` and `@CurrentProfileId()`
- those services resolve server membership, channel mutation authority, or conversation membership from backend data
- `MediaController` does not currently use the same explicit guard/decorator pattern
- the current media endpoint does not verify server membership, channel access, conversation membership, room mode, or granular publish/subscribe permissions before issuing a token

Current realtime contrast:
- `RealtimeGateway` exposes a generic `namespace: 'realtime'` Socket.IO gateway
- it logs connect/disconnect and emits typed key/payload events
- existing realtime events are domain-success notifications for channels, members, and chat messages
- there is no media signaling gateway, media namespace, room-scoped media subscription, participant-session event model, or media command handler yet

## Target Ownership Principle

`apps/api` must become the owner of media control-plane decisions:
- resolving room scope
- checking access
- creating or resolving room records/state
- creating participant sessions
- evaluating permissions
- accepting lifecycle commands
- emitting room/participant/media-state events
- brokering provider access through an adapter boundary

The browser remains responsible for local capture/rendering, device prompts, and user interaction. Vendor-specific signaling and transport details stay below the backend adapter/client adapter boundary.

Private calls, channel calls, future meetings, and large-room/stage modes must use one control-plane family and one media engine direction. They differ by `roomScope`, `roomMode`, lifecycle policy, and permissions, not by separate backend implementations.

## Future `apps/api` Media Module Shape

Suggested module ownership:

```text
MediaModule
  MediaController
    REST command boundary for resolve/join/leave/close and access snapshots
  MediaSignalingGateway
    WebSocket/signaling boundary for session commands, state updates, provider signaling envelopes, and server events
  MediaAccessService
    resolves scope from caller intent and enforces auth/domain access
  MediaRoomService
    creates/resolves rooms, tracks room lifecycle, closes/empties rooms
  MediaParticipantSessionService
    creates, resumes, disconnects, expires, and leaves participant sessions
  MediaPermissionService
    evaluates join/publish/subscribe/moderate permissions from domain policy
  MediaProviderAdapter
    vendor bridge for LiveKit transition and future mediasoup/coturn-backed access
```

### MediaAccessService

Responsibilities:
- accept a backend-validated room scope request, not an arbitrary provider room id
- resolve channel, conversation, or future meeting access
- derive `serverId`, `channelId`, `conversationId`, `meetingId`, `profileId`, and `memberId` where applicable
- reject invalid or inaccessible scopes before any media provider access is created
- return a vendor-neutral access decision with room scope, mode, identity, permissions, and policy

Domain checks:
- require authenticated profile through `RequireAuthGuard` and `CurrentProfileId`
- channel scope: verify server membership and channel existence/access
- conversation scope: verify the current profile belongs to one side of the conversation through server membership/member identity
- future meeting scope: verify meeting access through the meeting owner/invite/membership policy once that domain exists

### MediaRoomService

Responsibilities:
- create or resolve the canonical app media room for a scope
- maintain lifecycle state: `resolving`, `open`, `joining`, `active`, `empty`, `closing`, `closed`
- map current channel rooms and private conversation calls into the same room model
- decide empty-room behavior by mode/policy
- emit room events after state changes

Lifecycle commands owned here:
- `resolveRoomAccess`
- `createOrResolveRoom`
- `closeRoom`

Lifecycle events emitted here:
- `media.room.resolved`
- `media.room.created`
- `media.room.empty`
- `media.room.closing`
- `media.room.closed`

### MediaParticipantSessionService

Responsibilities:
- create `participantSessionId` for each join
- store stable participant identity: `profileId`, `memberId`, `displayName`
- attach optional realtime/socket `connectionId`
- distinguish intentional leave from network disconnect
- manage reconnect/resume windows
- expire stale participant sessions
- publish participant lifecycle events

Lifecycle commands owned here:
- `joinRoom`
- `leaveRoom`
- `beginReconnect`
- `resumeSession`

Lifecycle events emitted here:
- `media.room.joined`
- `media.room.left`
- `media.participant.joined`
- `media.participant.left`
- `media.participant.disconnected`
- `media.participant.reconnecting`
- `media.participant.reconnected`
- `media.participant.expired`
- `media.reconnect.started`
- `media.reconnect.succeeded`
- `media.reconnect.expired`
- `media.reconnect.rejected`

### MediaPermissionService

Responsibilities:
- evaluate:
  - `join`
  - `publishAudio`
  - `publishVideo`
  - `publishScreenShare`
  - `subscribe`
  - `moderate`
- return a `MediaPermissionSnapshot`
- emit `media.permission.changed` when a room or participant permission changes
- map current channel/private behavior into explicit initial desired state and permissions

Policy examples:
- channel `AUDIO`: allow join, publish audio, subscribe; deny initial video intent unless room/channel policy allows it
- channel `VIDEO`: allow join, publish audio/video, subscribe
- private conversation call: allow only conversation participants to join/publish/subscribe
- large-room/stage: use the same permissions shape but restrict publish/moderate by role and mode

### MediaSignalingGateway

Responsibilities:
- authenticate WebSocket/session commands before accepting media control commands
- bind socket `connectionId` to `participantSessionId`
- accept client media commands that need low-latency state/event feedback
- emit server events using Segment 078 event names
- carry provider-specific signaling only as an opaque adapter envelope
- keep room/participant/permission state in `apps/api`, not in the client runtime

Open design choice:
- either extend the existing `RealtimeGateway` with scoped media command/event support or introduce a dedicated media namespace/gateway
- the first implementation should choose one path explicitly; this segment recommends a dedicated `MediaSignalingGateway` design because media commands have stricter room/session/auth semantics than current broadcast-style domain notifications

### MediaProviderAdapter Boundary

Responsibilities:
- hide provider-specific access and signaling details behind app media concepts
- produce transitional LiveKit access while LiveKit remains in place
- later map the same control-plane decisions to mediasoup/coturn-backed access without changing room/session/permission contracts

Adapter must not own:
- server membership checks
- conversation membership checks
- stable app identity decisions
- app room lifecycle policy
- app permission policy
- app reconnect policy

## REST Commands vs WebSocket / Signaling Events

REST should own durable/request-response commands:
- `resolveRoomAccess`: authenticated request that resolves scope, mode, identity, permissions, and room descriptor
- `joinRoom`: creates or resumes a participant session and returns access data needed by the client
- `leaveRoom`: marks an intentional leave and closes provider access for the participant session
- `closeRoom`: moderator/system command to close a room when policy allows it
- optional access snapshot queries for room/participant state when clients reload

WebSocket/signaling should own realtime commands/events:
- participant connection binding to a `participantSessionId`
- `updateDesiredMediaState`
- `publishTrack`
- `unpublishTrack`
- `startScreenShare`
- `stopScreenShare`
- `subscribeToTrack`
- `unsubscribeFromTrack`
- `beginReconnect`
- `resumeSession`
- provider-specific signaling envelopes that remain below app contract names

Server events should use Segment 078 names:
- `media.room.resolved`
- `media.room.created`
- `media.room.joined`
- `media.room.left`
- `media.room.empty`
- `media.room.closing`
- `media.room.closed`
- `media.participant.joined`
- `media.participant.left`
- `media.participant.disconnected`
- `media.participant.reconnecting`
- `media.participant.reconnected`
- `media.participant.expired`
- `media.participant.media-state-changed`
- `media.track.published`
- `media.track.unpublished`
- `media.screen-share.started`
- `media.screen-share.stopped`
- `media.screen-share.rejected`
- `media.permission.changed`
- `media.reconnect.started`
- `media.reconnect.succeeded`
- `media.reconnect.expired`
- `media.reconnect.rejected`
- `media.error`

## Identity Model Change

The target control plane must replace caller-provided `room` and `username`.

Current model:

```text
client supplies room = channel.id or conversation.id
client supplies username = profile display name
backend signs LiveKit token with identity = username
```

Target model:

```text
client supplies room scope intent
backend authenticates profileId
backend resolves server/channel/conversation/meeting access
backend resolves memberId when scope is server-bound
backend creates participantSessionId
backend returns roomId, participantSessionId, displayName, permissions, and adapter access
```

Rules:
- `profileId` is the stable account/profile identity
- `memberId` is required for server-bound scopes when domain behavior needs membership identity
- `participantSessionId` is the media session/resume anchor
- `displayName` is presentation-only
- provider identity must be derived from backend-owned stable ids, not caller-provided display text

## Lifecycle Flow

### Resolve

```text
REST resolveRoomAccess
  -> RequireAuthGuard
  -> CurrentProfileId
  -> MediaAccessService validates scope and domain access
  -> MediaRoomService creates or resolves app media room
  -> MediaPermissionService returns permission snapshot
  -> emit media.room.resolved and maybe media.room.created
```

### Join

```text
REST joinRoom
  -> RequireAuthGuard
  -> verify room access again from backend state/scope
  -> MediaPermissionService requires join=true
  -> MediaParticipantSessionService creates participantSessionId
  -> MediaProviderAdapter creates provider access
  -> emit media.room.joined and media.participant.joined
```

### Leave

```text
REST or WS leaveRoom
  -> verify participantSessionId belongs to authenticated profile
  -> mark leave reason as intentional-leave
  -> revoke/close provider participant access when available
  -> emit media.participant.left and media.room.left
  -> if room policy says empty, emit media.room.empty
```

### Close

```text
REST closeRoom
  -> RequireAuthGuard
  -> MediaPermissionService requires moderate=true or system policy
  -> MediaRoomService marks closing then closed
  -> MediaProviderAdapter closes provider room/session resources if supported
  -> emit media.room.closing and media.room.closed
```

### Disconnect / Reconnect / Expire

```text
WS disconnect or provider disconnect
  -> MediaParticipantSessionService records disconnected
  -> if not intentional leave and policy allows resume, mark reconnecting
  -> emit media.participant.disconnected and media.reconnect.started

WS resumeSession
  -> verify authenticated profile/session/resume token if used
  -> if inside timeout, rebind connectionId and provider access
  -> emit media.participant.reconnected and media.reconnect.succeeded
  -> otherwise expire session and emit media.reconnect.expired or media.reconnect.rejected
```

Expiration:
- participant sessions should expire when reconnect timeout passes
- expired sessions emit `media.participant.expired`
- the room may become `empty` or `closed` depending on mode/policy

## Desired vs Published State Flow

`updateDesiredMediaState` is the app-level client intent command.

Flow:

```text
client updates desired audio/video/screenShare
  -> MediaSignalingGateway validates participant session
  -> MediaPermissionService checks publishAudio/publishVideo/publishScreenShare
  -> accepted desired state is recorded
  -> provider adapter attempts publish/unpublish where needed
  -> confirmed provider state updates published state
  -> emit media.participant.media-state-changed
  -> emit media.track.published or media.track.unpublished as applicable
```

Rules:
- desired state and published state are separate
- denied publish requests emit `media.error` with `publish-denied` or `screen-share-denied`
- browser device failures remain client-observed but should map to shared error codes for UI/reporting

## Screen Share Policy

Screen share must be a first-class room policy and track source.

Control-plane responsibilities:
- evaluate `publishScreenShare`
- enforce `maxActiveShares`
- track `currentPresenterParticipantSessionId`
- apply replacement policy: `deny`, `replace-own`, or `moderator-can-replace`
- emit `media.screen-share.started`, `media.screen-share.stopped`, or `media.screen-share.rejected`

The provider adapter may implement provider-specific publish mechanics, but it must not decide room-level screen-share policy.

## Transitional LiveKit Bridge

LiveKit remains in place until a later scoped implementation segment.

Bridge direction:
- keep the current LiveKit runtime behavior available during transition
- move future token creation behind `MediaProviderAdapter`
- use backend-resolved `roomId` and stable participant/session identity when the bridge is implemented
- map app permissions into LiveKit grants only after `MediaAccessService` and `MediaPermissionService` approve access
- keep provider token/endpoint as adapter access metadata, not as the app-level contract itself

Compatibility rule:
- the existing `/api/media/livekit-token` endpoint should not be removed in this design segment
- a future bridge/containment segment should decide whether it is wrapped, deprecated, or replaced after the client boundary is ready

## Open Decisions

Review:
- whether media signaling uses the existing `realtime` namespace or a dedicated media namespace
- where participant session state initially lives: in memory, database, or a later Redis-backed store
- whether `resumeToken` is required or `participantSessionId` plus authenticated session is sufficient
- how much of the media event contract lands in `packages/app-core` before backend implementation
- whether device error taxonomy belongs in shared app contracts or a client media adapter package
- exact REST route names for resolve/join/leave/close
- exact persistence semantics for persistent channel rooms versus private-call rooms

Block:
- no implementation should start before the client boundary design defines how web/desktop calls these commands and consumes these events
- no SFU/TURN implementation should start before local/prod topology and operations are documented
- the current media token endpoint needs explicit auth/domain ownership before it can become the long-term access path
- app-core contracts still need a scoped implementation segment before code can rely on the Segment 078 shapes

## Acceptance Criteria

Pass:
- backend ownership is assigned to concrete future services/gateway/adapter boundaries
- REST commands and WebSocket/signaling events are separated
- auth/domain checks are tied to existing `RequireAuthGuard` and `CurrentProfileId` patterns
- caller-provided room/username is replaced by backend-resolved scope and stable identity
- lifecycle, permissions, reconnect, screen share, and event flow map to Segment 078 names
- transitional LiveKit bridge path is documented without deleting LiveKit
- private/channel/meeting/large-room modes stay on one control-plane family

Out of scope:
- runtime implementation
- `packages/app-core` code changes
- removing LiveKit
- microphone/media bug fix
- mediasoup/coturn dependency or infra changes
- production/deploy/runbook changes
- React/Vite rewrite
- mediasoup transport internals

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `media-client-boundary-design`

Reason:
- backend control-plane ownership is now designed at docs level; the next planning slice should define how the web/desktop client boundary, SDK actions, and future app-core contracts consume resolve/join/leave/state/signaling without depending directly on LiveKit UI/runtime concepts.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
