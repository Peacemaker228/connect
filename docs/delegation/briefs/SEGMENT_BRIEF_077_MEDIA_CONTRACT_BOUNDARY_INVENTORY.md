# SEGMENT BRIEF 077. Media Contract Boundary Inventory

Branch:
- `wave/stage7-media-contract-boundary-inventory`

Segment:
- `media-contract-boundary-inventory`

## Goal

Inventory the future vendor-neutral media contract boundary based on the current LiveKit runtime inventory.

This segment is docs-only. It does not change `packages/app-core/src/contracts/media-provider.ts`, does not change runtime code, does not add media dependencies, and does not design the full `apps/api` control-plane implementation.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- `packages/app-core/src/contracts/media-provider.ts`

## Current Seed Contract

Current `packages/app-core/src/contracts/media-provider.ts` provides:
- `MediaConnectionState`: `idle | connecting | connected | reconnecting | disconnected`
- `MediaParticipant`: `id`, optional `displayName`, and boolean audio/video/screen-share flags
- `MediaRoom`: `id`, optional `name`
- `MediaRoomAccessRequest`: `roomId`, `participantId`, optional `displayName`
- `MediaRoomAccess`: `room`, `participant`, optional `token`, optional `endpoint`
- `MediaPermissions`: `audio`, `video`, `screenShare`
- `MediaParticipantStatePatch`: optional `audio`, `video`, `screenShare`
- `MediaProvider`: `createRoomAccess`, `getParticipant`, `updateParticipantState`, `getPermissions`

What the seed contract gets right:
- it establishes a media boundary in `packages/app-core`
- it avoids naming LiveKit in the contract file
- it has room and participant concepts
- it has a basic connection-state vocabulary
- it has a basic permission concept
- it can carry a transitional token/endpoint for the current LiveKit bridge

## Comparison Against Segment 076 Runtime Findings

Segment 076 found current runtime behavior that the future boundary must preserve:
- channel `AUDIO` starts with microphone only
- channel `VIDEO` starts with microphone and camera
- private conversation video mode starts with microphone and camera
- channel rooms are scoped to `channel.id`
- private rooms are scoped to `conversation.id`
- private/channel modes share the same `MediaRoom` runtime today
- leave behavior differs by scope
- local device errors must remain user-visible
- intentional leave must be distinguished from unexpected disconnect
- screen share, reconnect, participant lifecycle, and post-join media state are currently not project-owned

Current seed contract gaps against that runtime:
- no room scope model for `channel`, `conversation`, or future `meeting`
- no call/room mode model for persistent channel, private call, meeting, large room, or stage-like behavior
- no stable participant identity model beyond a generic `participantId`
- no separate `profileId`, `memberId`, `sessionId`, and `displayName`
- no desired-vs-published state split
- no track model
- no commands/events vocabulary
- no room lifecycle state
- no participant lifecycle state
- no reconnect resume model
- no intentional-leave vs network-disconnect model
- no screen-share policy
- no error taxonomy
- permissions are too coarse and do not include join, subscribe, or moderate

## Required Vendor-Neutral Contract Areas

### Room Scope

Needed types:
- `MediaRoomScopeKind`: `channel | conversation | meeting`
- `MediaRoomMode`: `persistent-channel | private-call | meeting | large-room | stage`
- `MediaRoomScope` discriminated union:
  - channel scope: `serverId`, `channelId`
  - conversation scope: `serverId`, `conversationId`
  - future meeting scope: `meetingId`, optional `serverId`

Contract requirement:
- private calls, channel calls, future meetings, and large rooms must use one media engine/control-plane
- differences must live in `roomScope`, `roomMode`, and permissions, not separate media implementations

Current seed gap:
- `MediaRoom.id` cannot explain whether the id is a channel, conversation, or future meeting

### Stable Participant Identity

Needed identity fields:
- `profileId`: stable user/profile identity
- `memberId`: server membership identity when room scope is server-bound
- `participantSessionId`: stable media-session participant instance
- `connectionId`: optional transport/socket connection identity
- `displayName`: presentation-only name

Contract requirement:
- `displayName` must not be the auth/media identity
- a participant can reconnect as the same participant session within a controlled resume window
- a user may have multiple device/session connections later if product scope allows

Current seed gap:
- `MediaParticipant.id` and `MediaRoomAccessRequest.participantId` are underspecified
- current runtime uses display name as LiveKit token identity, which should not carry into the target contract

### Permissions

Needed permission fields:
- `join`
- `publishAudio`
- `publishVideo`
- `publishScreenShare`
- `subscribe`
- `moderate`

Optional later permission fields:
- `kickParticipant`
- `muteParticipant`
- `closeRoom`
- `pinTrack`
- `record`

Contract requirement:
- permissions must be decided by backend/domain policy
- permissions must be scoped to room and participant
- large-room/stage modes should be able to restrict publish and subscribe behavior without changing the media engine

Current seed gap:
- `MediaPermissions` has only `audio`, `video`, and `screenShare`
- it does not distinguish publish vs subscribe
- it does not model join or moderation

### Room Lifecycle

Needed room lifecycle state:
- `resolving`
- `open`
- `joining`
- `active`
- `empty`
- `closing`
- `closed`

Needed commands:
- `ResolveMediaRoom`
- `CreateOrResolveMediaRoom`
- `JoinMediaRoom`
- `LeaveMediaRoom`
- `CloseMediaRoom`

Needed events:
- `MediaRoomResolved`
- `MediaRoomCreated`
- `MediaRoomJoined`
- `MediaRoomLeft`
- `MediaRoomEmpty`
- `MediaRoomClosing`
- `MediaRoomClosed`

Current seed gap:
- `createRoomAccess` mixes access creation with room resolution
- there is no room lifecycle state, close behavior, empty-room behavior, or leave command

### Participant Lifecycle

Needed participant lifecycle state:
- `joining`
- `joined`
- `left`
- `disconnected`
- `reconnecting`
- `reconnected`
- `expired`

Needed events:
- `MediaParticipantJoined`
- `MediaParticipantLeft`
- `MediaParticipantDisconnected`
- `MediaParticipantReconnecting`
- `MediaParticipantReconnected`
- `MediaParticipantExpired`

Contract requirement:
- intentional leave and network disconnect must be different states/reasons
- reconnect should resume a participant session only inside a defined policy window

Current seed gap:
- `MediaParticipant` is only a snapshot of id/displayName/media booleans
- no lifecycle state or disconnect reason exists

### Media State

Needed media state split:
- desired state: what the user intends locally
- published state: what backend/SFU confirms as actively published

Suggested shape:
- `desired.audio`
- `desired.video`
- `desired.screenShare`
- `published.audio`
- `published.video`
- `published.screenShare`

Contract requirement:
- initial channel/private-call behavior can map to desired state
- UI can show pending/failed states when desired and published differ
- backend/control-plane can validate publish permissions before state becomes published

Current seed gap:
- `isAudioEnabled`, `isVideoEnabled`, and `isScreenShareEnabled` flatten desired and published state into one boolean each
- `MediaParticipantStatePatch` does not specify whether it updates desired or published state

### Track Model

Needed track fields:
- `trackId`
- `ownerParticipantSessionId`
- `kind`: `audio | video`
- `source`: `microphone | camera | screen`
- `state`: `publishing | published | muted | paused | unpublished | failed`
- optional display metadata for UI, not SFU internals

Contract requirement:
- track contracts must remain vendor-neutral
- mediasoup producer/consumer ids should not leak into app-level contracts unless wrapped as internal adapter metadata

Current seed gap:
- no track model exists
- screen share cannot be represented as a distinct track/source

### Reconnect Model

Needed fields:
- `reconnectToken` or resume handle, if required by future design
- `participantSessionId`
- `timeoutMs`
- `startedAt`
- `expiresAt`
- `reason`: `network-disconnect | page-refresh | transport-failure | server-restart | unknown`
- `intentionalLeave`: boolean or explicit leave reason

Needed commands/events:
- `BeginMediaReconnect`
- `ResumeMediaSession`
- `MediaReconnectStarted`
- `MediaReconnectSucceeded`
- `MediaReconnectExpired`
- `MediaReconnectRejected`

Contract requirement:
- intentional leave should not trigger resume behavior
- network disconnect should be resumable only within policy
- reconnect status must be visible to UI and observability

Current seed gap:
- `MediaConnectionState` includes `reconnecting`, but there is no participant-session resume model or reason taxonomy

### Screen Share Policy

Needed policy fields:
- `allowed`
- `maxActiveShares`
- `currentPresenterParticipantSessionId`
- `replacePolicy`: `deny | replace-own | moderator-can-replace`

Needed events:
- `MediaScreenShareStarted`
- `MediaScreenShareStopped`
- `MediaScreenShareRejected`

Contract requirement:
- screen share must be a first-class state and track source
- channel/private/meeting/large-room modes can share the same contract with different policy values

Current seed gap:
- `screenShare` exists only as a boolean permission/state flag
- no policy or active presenter model exists

### Error Taxonomy

Needed error categories:
- `auth-required`
- `permission-denied`
- `room-not-found`
- `room-closed`
- `participant-not-found`
- `participant-session-expired`
- `invalid-room-scope`
- `device-permission-denied`
- `device-in-use`
- `device-not-found`
- `publish-denied`
- `subscribe-denied`
- `screen-share-denied`
- `transport-failed`
- `ice-failed`
- `reconnect-timeout`
- `state-conflict`
- `provider-unavailable`
- `unknown`

Contract requirement:
- browser device failures and backend authorization failures must be separate
- errors should carry stable codes for UI, SDK, logging, and future telemetry

Current seed gap:
- no error contract exists
- current runtime relies on LiveKit `MediaDeviceFailure` and raw thrown errors

### Client Commands

Needed command names:
- `resolveRoomAccess`
- `joinRoom`
- `leaveRoom`
- `closeRoom`
- `updateDesiredMediaState`
- `publishTrack`
- `unpublishTrack`
- `startScreenShare`
- `stopScreenShare`
- `subscribeToTrack`
- `unsubscribeFromTrack`
- `beginReconnect`
- `resumeSession`

Contract requirement:
- command names should be app-domain/media concepts, not LiveKit or mediasoup API names
- command payloads should carry room scope, participant session identity, desired state, and permissions context where needed

Current seed gap:
- only `createRoomAccess`, `getParticipant`, `updateParticipantState`, and `getPermissions` exist
- there is no command/event split

### Server Events

Needed event names:
- `media.room.resolved`
- `media.room.closed`
- `media.participant.joined`
- `media.participant.left`
- `media.participant.disconnected`
- `media.participant.reconnecting`
- `media.participant.reconnected`
- `media.participant.media-state-changed`
- `media.track.published`
- `media.track.unpublished`
- `media.screen-share.started`
- `media.screen-share.stopped`
- `media.permission.changed`
- `media.error`

Contract requirement:
- event contracts should be central in `packages/app-core`
- events should be usable by `packages/sdk`, web runtime, desktop runtime, and `apps/api`

Current seed gap:
- no media event contract exists

## Gap Classification

Pass:
- a vendor-neutral seed file exists under `packages/app-core`
- the seed already avoids direct LiveKit naming
- the seed captures the rough concepts of room, participant, permissions, access, and connection state

Review:
- keep or rename `createRoomAccess`; it currently mixes room resolution, access grants, and token/endpoint bridge behavior
- keep `token` and `endpoint` only as transitional adapter fields or wrap them in provider-specific access metadata
- decide whether `MediaProvider` remains a high-level facade or splits into command/query/event contracts
- decide whether browser device errors live in app-core or a client-only media package
- decide whether room lifecycle state belongs in app-core as domain state or only in SDK/control-plane event contracts

Block:
- missing room scope union for channel/conversation/future meeting
- missing stable participant/session identity
- missing permission granularity for join/publish audio/video/screen/share/subscribe/moderate
- missing desired vs published media state
- missing track model
- missing reconnect model
- missing screen-share policy
- missing error taxonomy
- missing client command and server event contracts
- missing explicit shared-engine rule for private/channel/large-room modes at contract level

Overall:
- `pass-with-blockers`

## Boundary Rule For Future Segments

Private calls, channel calls, future meetings, and large-room/stage modes must use one media engine and one control-plane family.

Differences belong in:
- `roomScope`
- `roomMode`
- permission policy
- lifecycle policy
- subscription/publish policy
- moderation policy

Differences must not become:
- separate media engines
- separate unrelated APIs
- separate client runtimes
- separate room/participant state models

## Blockers Before Media Control-Plane Design

Before `media-control-plane-design`, a future segment should define docs-level contract shapes for:
- room scope and room mode
- participant identity and participant session
- permission model
- desired vs published media state
- track model
- room lifecycle commands/events
- participant lifecycle events
- reconnect/resume policy
- screen-share policy
- error taxonomy
- client command and server event names

## Recommended Next Segment

Recommended next segment:
- `media-control-plane-design`

Reason:
- contract gaps are now inventoried; the next step is to design how `apps/api` will own room access, participant/session lifecycle, permissions, signaling/control commands, and server events without implementing them yet.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
