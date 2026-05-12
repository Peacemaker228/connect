# SEGMENT BRIEF 080. Media Client Boundary Design

Branch:
- `wave/stage7-media-client-boundary-design`

Segment:
- `media-client-boundary-design`

## Goal

Design the future client media boundary for web and desktop.

The target is a docs-only design for how app UI should consume the future `apps/api` media control plane without direct feature/UI dependence on LiveKit runtime concepts. This segment does not change runtime code, does not change `packages/app-core` or `packages/sdk` code, does not remove LiveKit, does not add `mediasoup` or `coturn`, does not fix the current microphone/media symptom, and does not change env, infra, or production docs.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`

Client/code files read:
- `src/lib/shared/features/media-room.tsx`
- `packages/sdk/src/actions/media.ts`
- `packages/app-core/src/contracts/media-provider.ts`
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `src/lib/chat/features/chat-video-button.tsx`

Branch note:
- the requested branch was not present locally or on `origin`; this docs-only branch was created locally from the current Stage 7 control-plane head.

## Current Client Findings

Current entry points:
- channel route verifies auth/server/channel/member on the server-rendered page, then renders `MediaRoom`
- channel `AUDIO` passes `audio=true`, `video=false`, `chatId=channel.id`
- channel `VIDEO` passes `audio=true`, `video=true`, `chatId=channel.id`
- private conversation route verifies auth/server/current member, blocks self-call, creates/resolves conversation, then renders `MediaRoom` only when `?video=true`
- private video mode passes `audio=true`, `video=true`, `chatId=conversation.id`, and a conversation leave redirect without `?video=true`
- `ChatVideoButton` only toggles the `video=true` query parameter

Current client media ownership:
- `MediaRoom` imports `LiveKitRoom`, `VideoConference`, LiveKit styles, `Room`, and `MediaDeviceFailure`
- `MediaRoom` fetches a LiveKit token through `getLiveKitToken({ room: chatId, username: displayName })`
- `MediaRoom` reads `NEXT_PUBLIC_LIVEKIT_URL` directly for `LiveKitRoom`
- `MediaRoom` creates the LiveKit `Room` instance and starts requested microphone/camera after `onConnected`
- preferred device selection and fallback are implemented in `MediaRoom`
- device errors are mapped through LiveKit `MediaDeviceFailure` and surfaced through toasts
- intentional leave is inferred from `.lk-disconnect-button` click capture
- post-join mute/camera/screen-share UI is delegated to LiveKit `VideoConference`

Current SDK/app-core surface:
- `packages/sdk/src/actions/media.ts` exposes only `getLiveKitToken`
- the request shape is caller-provided `room` and `username`
- `packages/app-core/src/contracts/media-provider.ts` has a seed provider contract, but not the Segment 078 command/event/session shapes

Primary client gap:
- the app feature boundary is also the LiveKit runtime boundary today. The target should split app media state, SDK/control commands, realtime events, provider adapter state, and browser capture/rendering.

## Target Client Boundary Architecture

The future client side should be layered like this:

```text
Route / app UI shell
  -> Media entry mapper
  -> Media feature controller / hook
  -> SDK media commands and realtime event subscription
  -> Provider adapter
  -> Browser capture and renderer layer
```

### App UI Shell

Responsibilities:
- decide whether the current route is a media entry point
- pass domain scope and initial media intent into the media boundary
- preserve route-level leave behavior
- keep chat/page composition outside provider-specific media runtime

The shell should pass app-domain data:
- channel entry: `{ kind: 'channel', serverId, channelId }`
- private entry: `{ kind: 'conversation', serverId, conversationId }`
- future meeting entry: `{ kind: 'meeting', meetingId, serverId? }`
- `mode`: `persistent-channel`, `private-call`, or `meeting`
- `initialDesiredState`: audio/video/screenShare intent
- `leaveRedirect`: route target or callback

It should not pass:
- provider room id
- provider token
- provider username
- LiveKit `Room`
- LiveKit component props

### Media Entry Mapper

Responsibilities:
- normalize channel/private/future meeting entries into one `MediaRoomScope` and `MediaRoomMode`
- map current product behavior into initial desired media state
- keep route-specific leave redirects outside provider internals

Mappings:
- channel `AUDIO`: `scope.kind = 'channel'`, `mode = 'persistent-channel'`, desired audio on, video off, screen share off
- channel `VIDEO`: `scope.kind = 'channel'`, `mode = 'persistent-channel'`, desired audio on, video on, screen share off
- private conversation video: `scope.kind = 'conversation'`, `mode = 'private-call'`, desired audio on, video on, screen share off
- future meeting: `scope.kind = 'meeting'`, `mode = 'meeting'`, desired state driven by meeting policy and UI entry intent

Rule:
- all modes enter the same client boundary; only scope, mode, policy, and permissions differ.

### Media Feature Controller / Hook

Suggested future shape:

```text
useMediaRoomController({
  scope,
  mode,
  initialDesiredState,
  leaveRedirect,
})
```

Responsibilities:
- call SDK `resolveRoomAccess`
- call SDK `joinRoom`
- hold project media state snapshots
- bind realtime event subscription for the joined room/session
- translate UI actions into SDK/signaling commands
- coordinate provider adapter connection and local publish/unpublish attempts
- distinguish intentional leave from unexpected disconnect
- preserve reconnect/resume state visible to UI
- map backend/provider/client errors into shared media error codes

The controller owns app media state, not browser devices and not provider internals.

### SDK Media Commands

Future SDK media actions should expose app-domain commands:
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

REST-backed SDK commands:
- `resolveRoomAccess`
- `joinRoom`
- `leaveRoom`
- `closeRoom`
- state/snapshot queries when needed

Realtime/signaling-backed SDK commands:
- `updateDesiredMediaState`
- `publishTrack`
- `unpublishTrack`
- `startScreenShare`
- `stopScreenShare`
- `subscribeToTrack`
- `unsubscribeFromTrack`
- `beginReconnect`
- `resumeSession`
- opaque provider signaling envelopes

SDK rules:
- command payloads use room scope, `roomId`, and `participantSessionId`, not LiveKit room names or display-name identities
- SDK errors use the Segment 078 media error taxonomy
- transitional LiveKit token/endpoint fields may exist only as provider access metadata returned by `joinRoom`

### Realtime Event Subscription

The client boundary should subscribe to Segment 078 server events after room/session resolution.

Events consumed by the controller:
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

Event handling rules:
- room events update room lifecycle UI state
- participant events update participant/session presence
- media-state events update desired versus published state
- track events update render/subscription model
- permission events disable or enable publish/subscribe/moderation controls
- reconnect events drive resumable reconnect UI rather than relying only on provider internals
- error events map to stable user-visible messages and logs

### Provider Adapter

Responsibilities:
- hide vendor-specific runtime objects and event names
- connect/disconnect to provider access returned by `joinRoom`
- publish and unpublish microphone, camera, and screen tracks when the controller permits it
- translate provider state into app track/published-state updates
- expose provider connection status without leaking provider-specific room/session objects
- map provider errors into shared media errors

Provider adapter interface should be app-shaped:
- `connect(access)`
- `disconnect(reason)`
- `publishAudio(options)`
- `unpublishAudio()`
- `publishVideo(options)`
- `unpublishVideo()`
- `startScreenShare(options)`
- `stopScreenShare()`
- `subscribe(trackId)`
- `unsubscribe(trackId)`
- `resume(access)`

Provider adapter should not own:
- route scope
- backend permission decisions
- participant identity
- room lifecycle policy
- leave redirect policy
- long-term reconnect policy

### Browser Capture / Renderer Layer

The browser remains responsible for:
- device prompts
- `getUserMedia` / display capture
- preferred device selection
- default-device fallback
- local preview
- remote track rendering
- user-visible device errors

The browser must not own:
- media secrets
- token signing
- room access decisions
- publish/subscribe permissions
- room lifecycle decisions
- participant-session authority

Current behavior to preserve:
- preferred microphone/camera device is tried first when available
- default capture is retried when preferred device startup fails
- microphone failure, camera failure, permission denied, device in use, and device not found remain user-visible
- browser device errors map to stable app media error codes, even if detection remains provider/browser-specific internally

## State Ownership Split

### Project Media State

Owned by `apps/api` and mirrored by the client controller:
- room scope and mode
- room lifecycle
- participant sessions
- stable identity: `profileId`, `memberId`, `participantSessionId`
- permissions
- desired media state
- published media state
- track metadata
- screen-share policy
- reconnect/resume state
- media error events

### Browser Device State

Owned by the client runtime:
- available devices
- chosen preferred device id
- browser permission prompt result
- local capture stream status
- device startup failure details
- local preview readiness

### Provider Adapter State

Owned inside the provider adapter:
- provider connection object
- provider endpoint/token/access metadata
- provider room/session handles
- provider track handles
- provider-specific reconnect/connectivity events
- provider-specific error objects before mapping

Boundary rule:
- project features consume project media state and controller actions, not provider adapter state directly.

## Command Flow

### Resolve and Join

```text
route maps entry to scope/mode/initial desired state
  -> controller calls SDK resolveRoomAccess(scope, mode)
  -> apps/api returns room descriptor, permissions, policy
  -> controller calls SDK joinRoom(roomId, initial desired state)
  -> apps/api returns participantSessionId and provider access metadata
  -> controller opens realtime subscription for room/session events
  -> provider adapter connects using access metadata
  -> controller applies initial desired state through update/publish commands
```

### Desired State / Publish / Unpublish

```text
user toggles microphone/camera/screen share
  -> controller updates desired state through SDK/signaling
  -> backend validates permission
  -> provider adapter attempts local capture and publish/unpublish
  -> backend/provider confirmation updates published state
  -> controller receives media-state/track events and updates UI
```

### Screen Share

```text
user starts screen share
  -> controller sends startScreenShare
  -> backend checks publishScreenShare and screen-share policy
  -> provider adapter requests display capture
  -> backend/provider confirmation emits screen-share and track events
```

### Leave

```text
user clicks leave
  -> controller marks intentional leave
  -> SDK leaveRoom(participantSessionId)
  -> provider adapter disconnects
  -> controller follows route leaveRedirect
```

Leave behavior to preserve:
- channel leave redirects to useful server text/general fallback or server page
- private conversation leave redirects to the conversation route without `?video=true`
- unexpected disconnect should not be treated as route leave

### Reconnect / Resume

```text
provider or websocket disconnects unexpectedly
  -> controller reports beginReconnect when policy allows it
  -> backend emits participant/reconnect events
  -> controller shows reconnecting state
  -> controller calls resumeSession with participantSessionId/resume metadata
  -> provider adapter resumes or reconnects using new access metadata if needed
  -> backend emits reconnected or expired/rejected event
```

Rules:
- intentional leave does not enter resumable reconnect
- resume is anchored by `participantSessionId`, not display name
- UI should present reconnect state from project events, not only provider events

## Transitional LiveKit Adapter Containment

LiveKit must remain available until a later scoped implementation segment.

Containment direction:
- isolate `@livekit/components-react`, `@livekit/components-styles`, `livekit-client`, `LiveKitRoom`, `VideoConference`, `Room`, and `MediaDeviceFailure` under a client provider adapter boundary
- keep feature-level media UI and route entry code consuming app media controller state/actions
- keep current LiveKit endpoint behavior until the backend bridge is replaced by control-plane join/access commands
- wrap current LiveKit token/endpoint access as provider metadata, not app identity
- map LiveKit device/provider errors into app media error codes
- keep LiveKit screen-share and reconnect behavior as transitional internals until project-owned commands/events replace them

Review risk:
- a temporary adapter may still render `VideoConference` internally, but product UI should not treat LiveKit component state as the app media contract. The long-term boundary should move controls toward project-owned controller actions.

## Blockers Before Next Segments

Before `sfu-turn-architecture-design`:
- confirm the expected MVP room scale and interaction modes for topology assumptions
- choose whether media signaling is a dedicated namespace/gateway or an extension of existing realtime
- decide the first participant-session persistence assumption for single-node versus later multi-instance operation
- define whether TURN credentials are static config, short-lived backend-issued credentials, or deferred to a later implementation plan

Before `livekit-adapter-containment`:
- accept the client boundary split between controller, SDK, realtime subscription, provider adapter, and renderer/capture layer
- decide future file/package placement for the client media adapter
- define the app-core contract update slice for Segment 078 shapes
- define SDK route/command names for resolve/join/leave/state/signaling
- decide how much of LiveKit `VideoConference` can remain wrapped during transition

Before implementation:
- implement app-core media command/event/session contracts in a scoped segment
- implement `apps/api` control-plane services/gateway in a scoped segment
- implement SDK media commands and realtime event subscription in a scoped segment
- implement client adapter containment without deleting LiveKit until parity is proven
- add tests for entry mapping, initial desired state, leave redirects, permission-denied UI, device fallback, and reconnect state
- document local/prod SFU/TURN topology before adding media infra or dependencies

## Acceptance Criteria

Pass:
- future client layers are documented: app UI shell, entry mapper, media controller/hook, SDK commands, realtime subscription, provider adapter, and renderer/capture layer
- project media state, browser device state, and provider adapter state are separated
- channel/private/future meeting entries use one client boundary
- current AUDIO, VIDEO, private video, leave redirect, preferred-device fallback, and device error behavior is preserved
- future command flow covers resolve, join, leave, desired state, publish/unpublish, screen share, reconnect, and resume
- Segment 078 event consumption is documented
- LiveKit client-side containment is documented without removing LiveKit
- browser capture/render remains client-side while permissions/lifecycle/control decisions stay in `apps/api`

Out of scope:
- runtime implementation
- `packages/app-core` code changes
- `packages/sdk` code changes
- LiveKit removal
- microphone/media bug fix
- mediasoup/coturn dependency or infra changes
- env/production/deploy changes

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `sfu-turn-architecture-design`

Reason:
- backend control-plane and client boundary ownership are now documented at design level. The next planning slice should document local/prod SFU/TURN topology, networking, ports, credentials, and operational constraints before any `mediasoup`/`coturn` dependency or infrastructure work.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
