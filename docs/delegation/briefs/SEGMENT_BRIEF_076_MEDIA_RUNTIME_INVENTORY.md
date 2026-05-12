# SEGMENT BRIEF 076. Media Runtime Inventory

Branch:
- `wave/stage7-media-runtime-inventory`

Segment:
- `media-runtime-inventory`

## Goal

Inventory the current LiveKit/media runtime before designing media contracts and the future `apps/api` control plane.

This segment is docs-only. It does not change runtime code, does not fix the current microphone/media symptom, does not remove LiveKit, and does not add `mediasoup`, `coturn`, or related dependencies.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_075_MEDIA_STACK_TECHNOLOGY_DECISION.md`

Runtime files read:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `apps/api/src/app.module.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `src/lib/chat/features/chat-video-button.tsx`
- `packages/app-core/src/contracts/media-provider.ts`
- `package.json`
- `bun.lock`

## Current Runtime Flow Diagram

Text flow:

```text
Channel AUDIO/VIDEO route
  -> server/auth route guard
  -> channel/member lookup
  -> MediaRoom(chatId = channel.id, serverId, audio/video intent)

Private conversation route with ?video=true
  -> server/auth route guard
  -> self-call guard
  -> getOrCreateConversation(memberId, serverId)
  -> MediaRoom(chatId = conversation.id, serverId, leaveRedirectHref, audio=true, video=true)

MediaRoom
  -> useGetProfile()
  -> getProfileName(username = profile.name)
  -> getLiveKitToken(room = chatId, username = display name)
  -> packages/sdk privateApiInstance GET /api/media/livekit-token
  -> apps/api MediaController creates LiveKit AccessToken(identity = username)
  -> token grant: room, roomJoin=true, canPublish=true, canSubscribe=true
  -> MediaRoom renders LiveKitRoom(serverUrl = NEXT_PUBLIC_LIVEKIT_URL, token, room = new Room(), connect=true)
  -> LiveKit onConnected
  -> MediaRoom enables requested microphone/camera through room.localParticipant
  -> VideoConference owns the active conference UI and most post-join media controls
```

## Current Backend Runtime

`apps/api/src/modules/media/media.controller.ts`:
- exposes `GET /api/media/livekit-token`
- accepts query parameters `room` and `username`
- rejects missing `room` or `username`
- reads `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL`
- validates that all three env vars exist
- creates a `livekit-server-sdk` `AccessToken` with `identity: username`
- grants `roomJoin`, `canPublish`, and `canSubscribe` for the requested `room`
- returns only `{ token }`

`apps/api/src/modules/media/media.module.ts`:
- registers only `MediaController`
- no media service, policy service, participant store, room lifecycle service, or signaling gateway exists yet

`apps/api/src/app.module.ts`:
- imports `MediaModule`, so the controller is part of the active backend module graph

Important finding:
- the media controller has no explicit `@UseGuards(RequireAuthGuard)` or `@CurrentProfileId()` usage in the file, unlike most domain controllers
- if there is no external/global guard applied elsewhere, token issuing can be driven by arbitrary `room` and `username` query values

## Current SDK Runtime

`packages/sdk/src/actions/media.ts`:
- defines `LiveKitTokenRequest` as `{ room: string; username: string }`
- defines `LiveKitTokenResponse` as `{ token: string }`
- uses `privateApiInstance.get('/api/media/livekit-token', { params: { room, username } })`
- normalizes Axios errors into `MediaActionError`
- no SDK-level room permission or participant validation exists
- no SDK-level retry, abort, or stale request handling exists for token acquisition

## Current Web Media Runtime

`src/lib/shared/features/media-room.tsx` owns:
- LiveKit component imports: `LiveKitRoom`, `VideoConference`
- LiveKit stylesheet import: `@livekit/components-styles`
- direct `livekit-client` imports: `MediaDeviceFailure`, `Room`
- creation of one `Room` instance with `useMemo(() => new Room(), [])`
- token loading state
- profile display-name derivation
- token request
- initial microphone/camera startup
- media device failure toasts
- intentional leave redirect detection

Token inputs:
- `room` is the `chatId` prop
- `username` is derived from `profile.name` through `getProfileName`
- if `profile?.name` is missing, no token request is made and the loading state remains

Room identity:
- server audio/video channel calls use `channel.id`
- private conversation calls use `conversation.id`
- the current runtime has no separate media-room/session id distinct from chat/channel/conversation ids

Client server URL:
- `LiveKitRoom` reads `process.env.NEXT_PUBLIC_LIVEKIT_URL`
- backend also validates `NEXT_PUBLIC_LIVEKIT_URL`, but the endpoint does not return it to the client

## Join / Leave Behavior

Join:
- `LiveKitRoom` renders only after a token exists
- `connect={true}`
- `video={false}` and `audio={false}` are passed to `LiveKitRoom`
- actual initial media publish is handled after `onConnected`
- `handleConnected` calls `startRequestedMedia()`
- `startRequestedMedia()` enables microphone and camera according to the `audio` and `video` props

Leave:
- user leave detection depends on click capture inside `VideoConference`
- if the clicked element is inside `.lk-disconnect-button`, `isLeaveRequestedRef` is set
- `onDisconnected` redirects only when `isLeaveRequestedRef` is true
- default redirect goes to the server general text channel if found, otherwise the server page
- private calls pass `leaveRedirectHref` back to the direct conversation route without `?video=true`
- non-user disconnects do not redirect through this path

## Device Startup / Error Handling

Device selection:
- `navigator.mediaDevices.enumerateDevices()` is used when available
- preferred device is the first matching device that is not `default` and not `communications`
- fallback is the first matching device

Microphone startup:
- uses `room.localParticipant.setMicrophoneEnabled(true, { deviceId?, echoCancellation: true, noiseSuppression: true })`
- if preferred device startup fails, retries with default capture options
- on failure, resets microphone with `setMicrophoneEnabled(false)` and shows a toast

Camera startup:
- uses `room.localParticipant.setCameraEnabled(true, deviceId ? { deviceId } : undefined)`
- if preferred device startup fails, retries with default camera
- on failure, resets camera with `setCameraEnabled(false)` and shows a toast

Error handling:
- device errors are classified through `MediaDeviceFailure.getFailure`
- handled failures include device in use, permission denied, and device not found
- `onError` shows a room connection toast
- `onMediaDeviceFailure` shows a device failure toast

## Mute / Camera / Screen Share Behavior

Initial state:
- channel `AUDIO` starts with `audio=true`, `video=false`
- channel `VIDEO` starts with `audio=true`, `video=true`
- private conversation video mode starts with `audio=true`, `video=true`
- `LiveKitRoom` itself is mounted with `audio={false}` and `video={false}`; initial publish is manual after connection

After join:
- mute/unmute, camera toggles, participant UI, and screen share controls are delegated to LiveKit `VideoConference`
- the app does not persist or emit project-owned participant media state
- the app does not model screen share as project-owned state
- there is no app-level publish/unpublish contract yet

## Reconnect / Disconnect Behavior

Current reconnect behavior:
- no project-owned reconnect state exists
- reconnect behavior is delegated to LiveKit runtime internals
- `MediaRoom` does not subscribe to explicit reconnecting/reconnected events
- there is no timeout, resume policy, participant session model, or backend reconnection decision

Current disconnect behavior:
- intentional disconnect is inferred through `.lk-disconnect-button` click capture
- `onDisconnected` only causes navigation when that intentional flag is set
- unexpected disconnects stay in the LiveKit/runtime state with no project-owned recovery model

## Channel Calls vs Private Conversation Calls

Server channel calls:
- entered by navigating to an existing server channel route
- route verifies auth, server, channel, and membership through server route guard data
- media room id is `channel.id`
- `AUDIO` channel publishes microphone only at startup
- `VIDEO` channel publishes microphone and camera at startup
- no explicit `leaveRedirectHref`; leave returns to general text channel if available or server page
- behaves like a persistent Discord-style room scoped to a channel

Private conversation calls:
- entered by toggling `?video=true` through `ChatVideoButton`
- route verifies auth/server membership and blocks calling yourself
- route creates or resolves a direct conversation before rendering media
- media room id is `conversation.id`
- private media mode always starts with microphone and camera enabled
- `leaveRedirectHref` returns to the same conversation route without video mode
- behaves like a transient call mode layered on top of the direct conversation page

Shared behavior:
- both paths use the same `MediaRoom`
- both paths use the same token endpoint and LiveKit room component
- both paths rely on `profile.name` as token identity
- neither path passes stable participant id, permission details, call mode, or room scope into the media token endpoint

## Dependencies and Env Surface

Explicit root dependencies in `package.json`:
- `@livekit/components-react`
- `@livekit/components-styles`
- `livekit-server-sdk`

Direct import surface:
- `src/lib/shared/features/media-room.tsx` imports `livekit-client` directly

Dependency classification:
- `livekit-client` is present in `bun.lock`
- `@livekit/components-react` lists `livekit-client` as a peer dependency in `bun.lock`
- `livekit-client` is not an explicit root dependency in `package.json`
- this is a review risk because active app code imports a package that is not explicitly declared by the app

Env names used by runtime:
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

Env handling note:
- env values were not changed and are not repeated in this inventory
- Stage 7 runtime inventory does not modify `.env`, Docker, PM2, Nginx, or production docs

## Current LiveKit Coupling Points

- `livekit-server-sdk` in `apps/api` token issuance
- `AccessToken` grant model: `room`, `roomJoin`, `canPublish`, `canSubscribe`
- `@livekit/components-react` UI/runtime ownership
- `@livekit/components-styles` global component styling
- `livekit-client` `Room` object ownership in `MediaRoom`
- `MediaDeviceFailure` error classification
- `room.localParticipant.setMicrophoneEnabled`
- `room.localParticipant.setCameraEnabled`
- `VideoConference` owning mute/camera/screen-share UI
- `.lk-disconnect-button` CSS selector for leave detection
- `NEXT_PUBLIC_LIVEKIT_URL` as public client server URL
- token endpoint shape named `/api/media/livekit-token`
- token response shape `{ token }`

## Behavior Future Mediasoup Control Plane Must Preserve

The future control plane must preserve:
- direct backend SDK access from the web runtime
- authenticated server/channel/conversation entry checks before media UI is shown
- domain room scoping by channel or conversation, even if a separate media-session id is introduced
- server channel audio mode: microphone initial intent, camera off
- server channel video mode: microphone and camera initial intent
- private conversation video mode: microphone and camera initial intent
- direct conversation leave behavior returning to the chat view
- channel leave behavior returning to a useful server text/general fallback
- local device startup with preferred device selection and default-device retry
- user-visible permission/device failure feedback
- distinction between intentional leave and unexpected disconnect
- browser-owned local capture and rendering
- future support for screen share as a first-class state

## Known Gaps / Risks

Review:
- `livekit-client` is directly imported but not explicitly declared in root `package.json`
- token identity uses display name, not stable profile/member/user id
- token endpoint accepts caller-provided `username`
- token endpoint accepts caller-provided `room`
- media controller has no explicit auth guard or domain permission check in the file
- backend does not verify server membership, channel access, conversation membership, channel type, or call mode before issuing a token
- token grants are broad: publish and subscribe are always allowed
- backend reads `NEXT_PUBLIC_LIVEKIT_URL` only to validate presence, while client separately reads the same env var
- token fetch has no abort/stale response handling
- loading can remain indefinitely when `profile.name` is absent or token fetch fails
- leave detection depends on LiveKit component internals and `.lk-disconnect-button`
- reconnect is not project-owned
- screen share is not project-owned
- mute/camera state is not project-owned after initial startup
- no backend participant/session lifecycle exists
- no media observability exists for ICE failures, reconnects, or packet loss

Block:
- contract/control-plane design should not proceed as implementation until auth, room scope, participant identity, permission model, reconnect model, and screen-share state are explicitly represented in contracts

Fail:
- none recorded for this docs-only inventory

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `media-contract-boundary-inventory`

Reason:
- current runtime behavior is now documented, so the next step is to compare it against `packages/app-core/src/contracts/media-provider.ts` and define the missing vendor-neutral contracts before designing the `apps/api` signaling/control plane.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
