# SEGMENT BRIEF 082. LiveKit Adapter Containment

Branch:
- `wave/stage7-livekit-adapter-containment`

Segment:
- `livekit-adapter-containment`

## Goal

Design the docs-only containment plan for current LiveKit usage.

The target is to describe how current LiveKit runtime can be wrapped behind backend and client adapter boundaries without deleting LiveKit and without changing product behavior. This segment does not change runtime code, does not edit `MediaRoom`, does not change `packages/app-core` or `packages/sdk` code, does not add `mediasoup`/`coturn` dependencies, does not change env/infra/production docs, and does not fix the current microphone/media symptom.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_080_MEDIA_CLIENT_BOUNDARY_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`

Runtime/dependency files read:
- `apps/api/src/modules/media/media.controller.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `package.json`

Branch note:
- the requested branch was not present locally or on `origin`; this docs-only branch was created locally from the current Stage 7 SFU/TURN architecture head.

## Current LiveKit Coupling

Backend coupling:
- `apps/api/src/modules/media/media.controller.ts` imports `AccessToken` from `livekit-server-sdk`
- `GET /api/media/livekit-token` accepts caller-provided `room` and `username`
- `username` becomes LiveKit token identity
- the endpoint reads `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL`
- token grants are LiveKit-shaped: `roomJoin`, `canPublish`, `canSubscribe`
- there is no backend media provider adapter, room/session service, or permission service in the current media module

SDK coupling:
- `packages/sdk/src/actions/media.ts` exposes `getLiveKitToken`
- request shape is `{ room: string; username: string }`
- response shape is `{ token: string }`
- endpoint path is `/api/media/livekit-token`
- SDK media error type is request/HTTP oriented, not the Segment 078 media error taxonomy

Client coupling:
- `src/lib/shared/features/media-room.tsx` imports `LiveKitRoom` and `VideoConference` from `@livekit/components-react`
- `src/lib/shared/features/media-room.tsx` imports global LiveKit styles through `@livekit/components-styles`
- `src/lib/shared/features/media-room.tsx` imports `Room` and `MediaDeviceFailure` from `livekit-client`
- `MediaRoom` owns the LiveKit `Room` instance
- `MediaRoom` reads `NEXT_PUBLIC_LIVEKIT_URL`
- `MediaRoom` owns token loading through `getLiveKitToken`
- `MediaRoom` starts microphone/camera through LiveKit local participant APIs
- `MediaRoom` maps device errors through LiveKit `MediaDeviceFailure`
- `MediaRoom` delegates mute/camera/screen-share controls to `VideoConference`
- intentional leave depends on `.lk-disconnect-button` click detection

Dependency coupling:
- `package.json` explicitly lists `@livekit/components-react`
- `package.json` explicitly lists `@livekit/components-styles`
- `package.json` explicitly lists `livekit-server-sdk`
- active client code imports `livekit-client` directly, while root `package.json` does not explicitly list `livekit-client`

## Containment Principles

LiveKit remains the transitional provider until a later scoped replacement wave.

Containment must:
- move LiveKit-specific imports behind adapter boundaries over staged implementation segments
- preserve current product behavior before replacing provider internals
- stop letting feature/UI code treat LiveKit room/token/component concepts as product media contracts
- avoid deleting LiveKit until parity checks pass
- avoid adding `mediasoup`, `coturn`, or infra in containment segments

Containment must not:
- turn into a media rewrite
- fix the microphone/media symptom as a side effect
- change current token behavior without a scoped backend bridge segment
- break current channel/private call entry behavior

## Backend Containment Target

Target backend shape:

```text
MediaModule
  MediaController
  MediaAccessService
  MediaRoomService
  MediaParticipantSessionService
  MediaPermissionService
  MediaProviderAdapter
    LiveKitMediaProviderAdapter
```

`MediaProviderAdapter` responsibilities:
- create provider access metadata from a backend-approved media room/session
- map app-level permissions into provider-specific grants
- hide provider token creation
- hide provider endpoint/token metadata from domain services
- map provider failures into app media errors

`LiveKitMediaProviderAdapter` responsibilities:
- own `livekit-server-sdk` import
- own `AccessToken` construction
- own LiveKit grant mapping
- read LiveKit env/config through backend config boundaries when implemented
- return adapter access metadata such as token and endpoint only after backend access is approved

Target backend flow:

```text
client asks to join app media room
  -> RequireAuthGuard / CurrentProfileId
  -> MediaAccessService resolves scope and domain access
  -> MediaRoomService resolves app room
  -> MediaParticipantSessionService creates participantSessionId
  -> MediaPermissionService evaluates join/publish/subscribe/moderate
  -> LiveKitMediaProviderAdapter creates provider access metadata
  -> client receives app room/session state plus provider access metadata
```

Compatibility path:
- the existing `/api/media/livekit-token` endpoint should stay until a scoped compatibility/deprecation segment changes it
- first backend containment can keep the current endpoint but delegate token construction to `LiveKitMediaProviderAdapter`
- a later control-plane segment should replace caller-provided `room`/`username` with backend-resolved scope, identity, and participant session before provider token creation

Backend target rule:
- LiveKit token creation must sit behind the provider adapter, but backend auth/domain/session decisions must sit above the adapter.

## Client Containment Target

Target client shape:

```text
media route / feature shell
  -> media entry mapper
  -> useMediaRoomController
  -> SDK media commands + realtime subscription
  -> LiveKitClientAdapter
  -> LiveKit runtime/components as transitional internals
```

`LiveKitClientAdapter` responsibilities:
- own `@livekit/components-react` imports
- own `@livekit/components-styles` import or isolated style-loading strategy
- own `livekit-client` imports
- own LiveKit `Room` object creation
- own `LiveKitRoom` and transitional `VideoConference` rendering when wrapping remains necessary
- accept provider access metadata from the controller
- expose app-shaped actions for connect, disconnect, publish/unpublish, screen share, and resume
- map LiveKit device/provider errors into app media error codes
- keep `.lk-disconnect-button` dependence internal while parity requires `VideoConference`

Feature/controller responsibilities:
- consume app media state and actions
- pass room scope, mode, initial desired state, and leave redirect
- call SDK/control-plane commands
- subscribe to Segment 078 server events
- decide intentional leave versus unexpected disconnect at app-controller level
- own route navigation after leave

Provider access metadata:
- may include transitional `token` and `endpoint`
- must be treated as adapter input, not as product identity
- should not be assembled by feature UI once the control-plane join command exists

Client target rule:
- feature UI should not import LiveKit packages directly after containment; direct LiveKit imports belong under the adapter.

## Staged Implementation Plan

No implementation is performed in this segment.

### 1. App-Core Contract Code Segment

Goal:
- implement the accepted Segment 078 vendor-neutral shapes in `packages/app-core`

Expected work:
- add room scope/mode types
- add participant/session identity types
- add permission snapshot types
- add desired/published media state and track types
- add command/event names and payload shapes
- add media error taxonomy
- keep transitional provider access metadata optional

Out of scope:
- LiveKit runtime changes
- SDK HTTP/WebSocket implementation
- backend media service implementation

### 2. SDK Command Segment

Goal:
- add SDK media command surface without deleting current `getLiveKitToken` compatibility path

Expected work:
- add `resolveRoomAccess`
- add `joinRoom`
- add `leaveRoom`
- add `updateDesiredMediaState`
- add publish/unpublish/screen-share/reconnect/resume command shapes where route support exists
- add media error normalization toward Segment 078 taxonomy
- preserve `getLiveKitToken` until backend/client migration no longer calls it

Out of scope:
- provider implementation
- changing current MediaRoom runtime behavior

### 3. Backend LiveKit Adapter Segment

Goal:
- move `livekit-server-sdk` token creation behind `LiveKitMediaProviderAdapter`

Expected work:
- add backend provider adapter interface
- add `LiveKitMediaProviderAdapter`
- keep existing `/api/media/livekit-token` behavior delegating to the adapter initially
- prepare but do not force backend-resolved scope/identity if the full control-plane is not ready in the same segment
- document endpoint deprecation state in code comments or docs if needed

Parity expectation:
- existing token response remains compatible until client migration happens

Out of scope:
- removing LiveKit
- adding mediasoup/coturn
- changing production env

### 4. Client LiveKit Adapter Segment

Goal:
- move LiveKit client imports and component/runtime ownership behind `LiveKitClientAdapter`

Expected work:
- move `LiveKitRoom`, `VideoConference`, styles, `Room`, and `MediaDeviceFailure` imports into adapter-owned files
- keep current `MediaRoom` behavior through an app-shaped boundary
- preserve initial media startup and preferred-device fallback
- preserve leave redirects and `.lk-disconnect-button` behavior internally while `VideoConference` remains wrapped
- preserve device error toasts
- keep mute/camera/screen-share behavior working through the wrapped LiveKit component

Out of scope:
- replacing `VideoConference` controls with custom controls unless explicitly scoped
- removing LiveKit styles
- fixing microphone/media bug beyond preserving current behavior

### 5. Parity Smoke Segment

Goal:
- verify containment did not change product behavior

Expected work:
- run manual or automated smoke through current entry points
- capture pass/review/fail results for channel audio, channel video, private video, leave, device fallback, and LiveKit controls
- confirm no new media dependencies or infra were added
- decide whether adapter containment is enough to proceed to MVP implementation planning

Out of scope:
- mediasoup implementation
- production deploy changes

## Parity Checklist

Required parity checks:
- channel `AUDIO` starts microphone only
- channel `AUDIO` does not start camera
- channel `VIDEO` starts microphone and camera
- private conversation video mode starts microphone and camera
- private conversation leave returns to the conversation route without `?video=true`
- channel leave returns to general text channel fallback or server fallback
- preferred microphone device is attempted before default fallback
- preferred camera device is attempted before default fallback
- device permission denied remains user-visible
- device in use remains user-visible
- device not found remains user-visible
- room connection error remains user-visible
- mute/unmute still works through current controls
- camera toggle still works through current controls
- screen share still works through current controls
- unexpected disconnect is not treated as intentional route leave
- current LiveKit token flow still reaches the active backend endpoint until the control-plane replacement is ready
- no `mediasoup`, `coturn`, or media infra dependency is added during containment

Pass condition:
- no product behavior regression from current LiveKit runtime.

## Risks / Open Decisions

Review:
- whether the first client adapter wraps `VideoConference` whole or splits controls into project-owned UI earlier
- whether to add explicit root `livekit-client` dependency during containment because active client code imports it directly today
- how to contain `@livekit/components-styles`, which is currently a global style import
- how and when `/api/media/livekit-token` is deprecated after `joinRoom` provider access exists
- when to add explicit `RequireAuthGuard` and domain access checks to media token/control-plane endpoints
- whether backend containment first delegates current caller-provided `room`/`username` unchanged or blocks until backend-resolved identity is ready
- whether `NEXT_PUBLIC_LIVEKIT_URL` remains a public client env during transitional adapter containment or moves into provider access metadata returned by backend
- how to avoid duplicating desired/published state while LiveKit `VideoConference` still owns some UI state
- how to test `.lk-disconnect-button` behavior if it remains a temporary implementation detail

Block:
- app-core contract shapes must land before feature/controller code can depend on vendor-neutral media state
- SDK command names and backend route names must be fixed before client/controller migration
- backend control-plane auth/domain checks must be designed into the replacement join/access path before deprecating the current token endpoint
- parity smoke must pass before LiveKit can be considered contained enough for replacement planning

## Acceptance Criteria

Pass:
- current LiveKit coupling points are listed
- backend containment target describes `MediaProviderAdapter` and `LiveKitMediaProviderAdapter`
- client containment target describes `LiveKitClientAdapter`
- provider access metadata is separated from app identity/state
- staged implementation plan is defined without executing it
- parity checklist preserves current channel/private/media behavior
- risks/open decisions are explicit
- LiveKit is not removed and product behavior is not changed

Out of scope:
- runtime implementation
- `MediaRoom` edits
- `packages/app-core` code changes
- `packages/sdk` code changes
- removing LiveKit
- microphone/media bug fix
- `mediasoup`/`coturn` dependency or infra changes
- env/production/deploy changes

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `media-mvp-implementation-plan`

Reason:
- Stage 7 planning now has stack decision, current runtime inventory, contract shapes, backend control-plane design, client boundary design, SFU/TURN topology, and LiveKit containment plan. The next docs-only slice should turn this into a scoped MVP implementation plan with ordered implementation segments and explicit guardrails.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
