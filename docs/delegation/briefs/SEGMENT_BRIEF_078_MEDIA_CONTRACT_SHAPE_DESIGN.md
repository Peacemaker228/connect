# SEGMENT BRIEF 078. Media Contract Shape Design

Branch:
- `wave/stage7-media-contract-shape-design`

Segment:
- `media-contract-shape-design`

## Goal

Describe concrete vendor-neutral media contract shapes before `apps/api` media control-plane design.

This segment is docs-only. It does not change runtime code, does not change `packages/app-core` code, does not add dependencies or infrastructure, and does not design a mediasoup implementation.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_077_MEDIA_CONTRACT_BOUNDARY_INVENTORY.md`
- `packages/app-core/src/contracts/media-provider.ts`

## Design Boundary

These are contract shapes, not implementation code.

They should guide a later `packages/app-core` contract update and `apps/api` control-plane design, but this segment does not apply them to code.

Rules:
- contract names are vendor-neutral
- no LiveKit, mediasoup, coturn, SFU transport, producer, or consumer ids should leak into app-level contracts
- private calls, channel calls, future meetings, and large-room/stage modes use one media engine and one control-plane family
- differences live in room scope, room mode, permissions, lifecycle policy, subscription/publish policy, and moderation policy

## Room Scope / Mode Shapes

```ts
type MediaRoomScopeKind = 'channel' | 'conversation' | 'meeting'

type MediaRoomMode =
  | 'persistent-channel'
  | 'private-call'
  | 'meeting'
  | 'large-room'
  | 'stage'

type MediaRoomScope =
  | {
      kind: 'channel'
      serverId: string
      channelId: string
    }
  | {
      kind: 'conversation'
      serverId: string
      conversationId: string
    }
  | {
      kind: 'meeting'
      meetingId: string
      serverId?: string
    }

type MediaRoomDescriptor = {
  roomId: string
  scope: MediaRoomScope
  mode: MediaRoomMode
  displayName?: string | null
  lifecycle: MediaRoomLifecycleState
}
```

Mapping from current runtime:
- channel `AUDIO` and `VIDEO` use `scope.kind = 'channel'`
- private conversation video mode uses `scope.kind = 'conversation'`
- future scheduled/hosted sessions use `scope.kind = 'meeting'`
- large room and stage are modes/policies, not separate engines

## Participant / Session Identity Shapes

```ts
type MediaParticipantIdentity = {
  profileId: string
  memberId?: string
  displayName: string
}

type MediaParticipantSession = {
  participantSessionId: string
  roomId: string
  identity: MediaParticipantIdentity
  connectionId?: string
  lifecycle: MediaParticipantLifecycleState
  joinedAt?: string
  lastSeenAt?: string
}
```

Rules:
- `profileId` is the stable user/profile identity
- `memberId` is required when the room scope is server-bound and member-specific
- `participantSessionId` identifies one media participant session and is the resume anchor
- `displayName` is presentation-only and must not be used as auth/media identity
- `connectionId` is optional and should describe transport/socket connection identity only when needed

## Permissions Shape

```ts
type MediaPermissions = {
  join: boolean
  publishAudio: boolean
  publishVideo: boolean
  publishScreenShare: boolean
  subscribe: boolean
  moderate: boolean
}

type MediaPermissionReason =
  | 'allowed'
  | 'auth-required'
  | 'not-room-member'
  | 'channel-denied'
  | 'conversation-denied'
  | 'meeting-denied'
  | 'room-closed'
  | 'policy-denied'

type MediaPermissionSnapshot = {
  roomId: string
  participantSessionId?: string
  permissions: MediaPermissions
  reason?: MediaPermissionReason
}
```

Rules:
- permissions are decided by backend/domain policy
- join, publish, subscribe, and moderate are separate permissions
- large-room/stage behavior should be expressible through these permissions and room policy, not a separate engine

## Desired vs Published Media State

```ts
type MediaBooleanState = {
  audio: boolean
  video: boolean
  screenShare: boolean
}

type MediaState = {
  desired: MediaBooleanState
  published: MediaBooleanState
}

type MediaStatePatch = {
  desired?: Partial<MediaBooleanState>
}

type MediaStateSnapshot = {
  roomId: string
  participantSessionId: string
  state: MediaState
  updatedAt: string
}
```

Rules:
- desired state is local user intent
- published state is confirmed active publish state
- UI can show pending/failed behavior when desired and published differ
- backend/control-plane can deny desired state transitions before they become published

Current runtime mapping:
- channel `AUDIO`: desired audio true, desired video false, desired screenShare false
- channel `VIDEO`: desired audio true, desired video true, desired screenShare false
- private video call: desired audio true, desired video true, desired screenShare false

## Track Shape

```ts
type MediaTrackKind = 'audio' | 'video'

type MediaTrackSource = 'microphone' | 'camera' | 'screen'

type MediaTrackState =
  | 'publishing'
  | 'published'
  | 'muted'
  | 'paused'
  | 'unpublished'
  | 'failed'

type MediaTrack = {
  trackId: string
  roomId: string
  ownerParticipantSessionId: string
  kind: MediaTrackKind
  source: MediaTrackSource
  state: MediaTrackState
  label?: string | null
  createdAt?: string
  updatedAt?: string
}
```

Rules:
- microphone is an audio track source
- camera is a video track source
- screen share is a video track source with `source = 'screen'`
- vendor adapter ids may exist below this boundary, but app contracts should not expose them directly

## Room Lifecycle Commands / Events

Room lifecycle states:

```ts
type MediaRoomLifecycleState =
  | 'resolving'
  | 'open'
  | 'joining'
  | 'active'
  | 'empty'
  | 'closing'
  | 'closed'
```

Command names:
- `resolveRoomAccess`
- `createOrResolveRoom`
- `joinRoom`
- `leaveRoom`
- `closeRoom`

Event names:
- `media.room.resolved`
- `media.room.created`
- `media.room.joined`
- `media.room.left`
- `media.room.empty`
- `media.room.closing`
- `media.room.closed`

Suggested command payload base:

```ts
type MediaRoomCommandBase = {
  requestId: string
  scope: MediaRoomScope
  mode?: MediaRoomMode
}
```

## Participant Lifecycle Commands / Events

Participant lifecycle states:

```ts
type MediaParticipantLifecycleState =
  | 'joining'
  | 'joined'
  | 'left'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnected'
  | 'expired'
```

Command names:
- `joinRoom`
- `leaveRoom`
- `beginReconnect`
- `resumeSession`

Event names:
- `media.participant.joined`
- `media.participant.left`
- `media.participant.disconnected`
- `media.participant.reconnecting`
- `media.participant.reconnected`
- `media.participant.expired`
- `media.participant.media-state-changed`

Rules:
- `left` is intentional leave
- `disconnected` is unplanned transport/session loss
- `reconnecting` and `reconnected` are participant session lifecycle states, not just client UI states

## Reconnect / Resume Shape

```ts
type MediaDisconnectReason =
  | 'intentional-leave'
  | 'network-disconnect'
  | 'page-refresh'
  | 'transport-failure'
  | 'server-restart'
  | 'timeout'
  | 'unknown'

type MediaReconnectPolicy = {
  timeoutMs: number
  allowResume: boolean
}

type MediaReconnectState = {
  participantSessionId: string
  roomId: string
  startedAt: string
  expiresAt: string
  reason: MediaDisconnectReason
  resumeToken?: string
}

type ResumeMediaSessionCommand = {
  roomId: string
  participantSessionId: string
  resumeToken?: string
}
```

Event names:
- `media.reconnect.started`
- `media.reconnect.succeeded`
- `media.reconnect.expired`
- `media.reconnect.rejected`

Rules:
- intentional leave must not enter resumable reconnect
- network disconnect can be resumable inside policy
- resume behavior is anchored by `participantSessionId`, not display name

## Screen Share Policy Shape

```ts
type MediaScreenShareReplacePolicy =
  | 'deny'
  | 'replace-own'
  | 'moderator-can-replace'

type MediaScreenSharePolicy = {
  allowed: boolean
  maxActiveShares: number
  currentPresenterParticipantSessionId?: string
  replacePolicy: MediaScreenShareReplacePolicy
}
```

Command names:
- `startScreenShare`
- `stopScreenShare`

Event names:
- `media.screen-share.started`
- `media.screen-share.stopped`
- `media.screen-share.rejected`

Rules:
- screen share is represented as media state and as a `MediaTrack` with `source = 'screen'`
- room mode can change `maxActiveShares` and replacement behavior
- no separate screen-share engine should be introduced

## Error Taxonomy Shape

```ts
type MediaErrorCode =
  | 'auth-required'
  | 'permission-denied'
  | 'room-not-found'
  | 'room-closed'
  | 'participant-not-found'
  | 'participant-session-expired'
  | 'invalid-room-scope'
  | 'device-permission-denied'
  | 'device-in-use'
  | 'device-not-found'
  | 'publish-denied'
  | 'subscribe-denied'
  | 'screen-share-denied'
  | 'transport-failed'
  | 'ice-failed'
  | 'reconnect-timeout'
  | 'state-conflict'
  | 'provider-unavailable'
  | 'unknown'

type MediaError = {
  code: MediaErrorCode
  message?: string
  roomId?: string
  participantSessionId?: string
  recoverable: boolean
}
```

Rules:
- backend authorization errors and browser device failures are different categories
- errors must carry stable codes for UI, SDK, logging, and future telemetry
- provider-specific errors should be mapped into this taxonomy at adapter boundaries

## Client Command Names

Client-facing command names:
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

Command payload rule:
- every command that affects a room must include `roomId` or `scope`
- every command that affects a participant must include `participantSessionId`
- commands should use app media terms, not LiveKit or mediasoup API terms

## Server Event Names

Server event names:
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

Event payload rule:
- events should include `roomId`
- participant events should include `participantSessionId`
- track events should include `trackId` and `ownerParticipantSessionId`
- error events should carry `MediaError`

## Gap Classification

Pass:
- concrete vendor-neutral shape vocabulary is now documented
- shapes cover the blockers from Segment 077
- shapes preserve current channel/private-call behavior from Segment 076

Review:
- decide whether these shapes land as one `media-provider.ts` expansion or are split into `media-room`, `media-participant`, `media-events`, and `media-commands` files later
- decide whether device error codes belong in shared app-core contracts or a client media adapter contract
- decide whether `resumeToken` is required or whether `participantSessionId` plus backend session is sufficient

Block:
- `apps/api` control-plane design should not skip the explicit room scope, participant session, permission, desired/published state, track, reconnect, screen-share, error, command, and event shapes
- no runtime implementation should start until these shapes are accepted or revised

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `media-control-plane-design`

Reason:
- the contract vocabulary is now concrete enough for a docs-only `apps/api` control-plane design that maps commands/events to backend ownership without implementing mediasoup.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
