# SEGMENT BRIEF 099. MVP Private Small-Room Replacement

Branch:
- `wave/stage8-mvp-private-small-room-replacement`

Segment:
- `mvp-private-small-room-replacement`

## Goal

Begin controlled private-call SFU replacement after local direct and TURN smoke gates, without switching default media routes and without weakening the LiveKit fallback.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`

Docs and code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_098_LOCAL_COTURN_TURN_RELAY_UNBLOCK.md`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `apps/api/src/modules/media/*`

## Files Changed

Added:
- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
- `docs/delegation/briefs/SEGMENT_BRIEF_099_MVP_PRIVATE_SMALL_ROOM_REPLACEMENT.md`

Changed:
- `apps/api/src/modules/media/media-participant-session.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Gate

The private SFU path is explicit and non-production gated:
- route: existing private conversation call route
- query: `?video=true&mediaProvider=sfu`
- compatibility query: `?video=true&sfu=true`
- runtime guard: `process.env.NODE_ENV !== 'production'`
- scope guard: only `mediaEntry.scope.kind === 'conversation'`

Without that explicit gate, `MediaRoom` still renders `LiveKitClientAdapter`.

Channel and small-room routes were not switched to SFU.

## Backend Scope Boundary

The mediasoup prototype path now accepts optional scoped access:
- `roomId`
- `participantSessionId`

When either scoped field is present, the API requires both and validates them through the authenticated control-plane participant session before creating, connecting, or using mediasoup prototype resources.

Scoped bindings added:
- transport create/connect is bound to `{ roomId, participantSessionId }`
- producers are bound to `{ roomId, participantSessionId }`
- consumers are bound to `{ roomId, participantSessionId }`
- consuming a scoped producer requires the same room boundary

New authenticated producer discovery endpoint:
- `POST /api/media/prototype/mediasoup/producers/discover`
- returns scoped producers for the requested room
- requires a valid joined participant session

The existing unscoped prototype smoke path remains available for the local `/media/sfu-smoke` harness.

## Client Path

`SfuClientAdapter` now supports:
- scoped transport creation
- scoped transport connect
- scoped produce metadata through transport app data
- scoped consumer metadata creation
- scoped producer discovery

`SfuPrivateCallAdapter` uses the existing control-plane join result, creates scoped send/recv transports, produces a local synthetic audio track, discovers the scoped producer, consumes it through the receive transport, and renders the remote audio track.

The adapter preserves the existing `MediaRoom` leave path, so leaving the SFU-gated private call redirects back to the private conversation without `?video=true` or SFU query state.

## Smoke Result

Private SFU smoke:
- status: `review`
- authenticated private conversation route opened with `?video=true&mediaProvider=sfu`
- temporary local API/web ports: `4003` and `3004`
- backend control-plane joined a private-call room
- scoped SFU transports were created under the backend-resolved room/session
- local synthetic audio producer was created and discovered through scoped producer discovery
- local consumer metadata was created and consumed through the scoped receive transport
- UI status reached `review`
- leave redirect preserved: gated call URL returned to `/servers/:serverId/conversations/:memberId`

Observed smoke identifiers:
- server id: `b8019f4f-2988-4bc7-b2b8-2b2c6ceef814`
- target member id: `5c3fe94c-8082-4504-86c4-2e2f31452fd8`
- conversation id: `cf8b1f90-581d-4af7-bce4-9607aa8fa3d0`

Default LiveKit/fallback:
- status: `preserved`
- the normal private call URL `?video=true` does not request SFU
- channel audio/video routes remain on `LiveKitClientAdapter`
- LiveKit token/action/adapter paths were not removed or weakened

Full two-user private SFU smoke:
- status: `blocked / not complete`
- blocker: the gated private adapter currently proves scoped SFU produce/consume as a single-browser loopback, but there is no realtime producer announcement/subscription or polling lifecycle for a second authenticated browser participant
- blocker: real camera/microphone capture parity was intentionally not fixed in this segment
- decision: do not mark private replacement complete and do not begin channel/small-room replacement yet

TURN relay in the private gated path:
- status: `review`
- prior `/media/sfu-smoke` relay gate passed in Segment 098
- this segment's private route smoke used the direct local path; private TURN relay should be rerun after remote producer discovery/signaling exists

## Handoff

What enables SFU private path:
- `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`
- only for private conversations
- only outside production runtime

What remains LiveKit/default:
- private calls without the explicit SFU query
- all channel audio/video routes
- current LiveKit token endpoint
- current LiveKit client adapter and leave behavior

Private SFU smoke result:
- `review`
- scoped local produce/consume loopback passed in an authenticated private conversation route
- full two-user private media exchange remains blocked

Blockers before small-room/channel replacement:
- add producer discovery lifecycle for remote participants, preferably through the project media signaling boundary
- add subscribe/unsubscribe and cleanup behavior for remote producers/consumers
- run a full two-user private browser smoke
- decide how real device capture and the existing microphone issue are handled without making it an accidental side fix
- rerun private-path TURN relay after the two-user producer discovery path exists

Recommended next segment:
- `private-sfu-remote-producer-discovery-and-two-user-smoke`

Reason:
- the controlled gate and room/session boundary now exist, but replacement is not complete until a second authenticated participant can publish and subscribe through the SFU path.

## Verification Performed

Commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- Browser smoke used temporary local API/web processes on `4003/3004`; those processes were stopped after the smoke.
