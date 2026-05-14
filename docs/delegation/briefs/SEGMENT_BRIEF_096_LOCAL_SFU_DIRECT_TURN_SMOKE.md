# SEGMENT BRIEF 096. Local SFU Direct TURN Smoke

Branch:
- `wave/stage8-local-sfu-direct-turn-smoke`

Segment:
- `local-sfu-direct-turn-smoke`

## Goal

Verify the local mediasoup SFU prototype path before any private/small-room replacement switch, while preserving the current LiveKit default path and avoiding production infra/env/deploy changes.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`

Docs/code read:
- `rules/*`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_095_MEDIASOUP_PRODUCE_CONSUME_PROTOTYPE.md`
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/turn-credential.service.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `src/lib/shared/features/media-room.tsx`

## Files Changed

Added:
- `src/app/(main)/(routes)/media/sfu-smoke/page.tsx`
- `src/lib/shared/features/media/sfu-smoke-harness.tsx`
- `docs/delegation/briefs/SEGMENT_BRIEF_096_LOCAL_SFU_DIRECT_TURN_SMOKE.md`

Changed:
- `apps/api/src/modules/media/media.module.ts`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Implementation Summary

Dev-only authenticated smoke route:
- added authenticated local route `/media/sfu-smoke` under the existing main app layout
- the route is disabled in `NODE_ENV=production`
- unauthenticated users are redirected to sign-in
- the route renders a manual smoke harness only; it does not switch `MediaRoom`, channel routes, private-call routes, or default media provider behavior

Smoke harness:
- exercises the authenticated SDK/SFU path in this order:
  - `getMediasoupPrototypeHealth`
  - create send transport
  - create receive transport
  - produce a local synthetic audio track through `SfuClientAdapter.produce(track)`
  - create consumer metadata through `SfuClientAdapter.createConsumerMetadata(...)`
  - consume the remote track through `SfuClientAdapter.consume(metadata)`
- uses a synthetic `AudioContext` track to avoid touching the known microphone/device symptom
- exposes separate `Direct` and `TURN` runs
- attaches the consumed track to a local audio element and waits for a live, unmuted remote track signal

TURN path support:
- `SfuClientAdapter.createTransport(...)` now accepts optional `iceTransportPolicy`
- the harness uses `iceTransportPolicy: "relay"` for the TURN run so local TURN smoke is not only "TURN credentials included"
- if local TURN credentials are unavailable, the harness marks the run as blocked with the backend reason

Backend runtime unblock:
- `MediaModule` now imports `AuthModule`
- without this, `RequireAuthGuard` could not resolve `AuthService` at Nest runtime, blocking all authenticated media prototype endpoints even though TypeScript compiled

Compatibility:
- current `MediaRoom` still renders `LiveKitClientAdapter` by default
- no current channel/private route was switched to SFU
- no LiveKit fallback was removed or weakened
- no production media infra/env/nginx/firewall/deploy changes were made
- no microphone bug fix was attempted

## Smoke Performed

Backend authenticated endpoint smoke was run locally with a dev `x-profile-id` header after starting `bun.cmd run dev:api`.

Observed:
- authenticated `GET /api/media/prototype/mediasoup/health`: `ready`
- authenticated direct send transport creation: `ready`, 2 ICE candidates
- authenticated direct receive transport creation: `ready`, 2 ICE candidates
- authenticated transport creation with TURN credential request: transport `ready`, TURN credentials `disabled`
- TURN disabled reason: `LOCAL_TURN_STATIC_AUTH_SECRET is not configured`

Full browser `SfuClientAdapter` direct/TURN media flow was not executed in this environment because no callable browser automation surface was available for the local app route. The route is in place for a manual authenticated run.

## Acceptance Result

Pass:
- authenticated backend media prototype health works after the `MediaModule` auth import fix.
- authenticated backend direct send/receive WebRTC transport metadata creation works.
- a local dev-only authenticated `SfuClientAdapter` smoke route exists.
- TURN relay mode can now be forced by the adapter/harness through `iceTransportPolicy: "relay"`.
- current LiveKit path remains unchanged and default.

Review:
- direct browser media flow is still review-only until `/media/sfu-smoke` is run in an authenticated browser and observes a live consumed remote track.
- the smoke harness uses synthetic audio only; camera/video and real microphone capture remain outside this segment.
- prototype endpoints are still local-only and not room/session-bound enough for replacement.

Blocked:
- TURN smoke is blocked in the current local environment because local TURN env is not configured.
- no local coturn relay availability was confirmed.

Fail:
- none found in the backend authenticated health/transport smoke.

## Handoff

Direct smoke:
- `review`
- backend authenticated health and direct transport creation passed
- browser `SfuClientAdapter` produce/consume route exists but was not executed to remote-track observation in this environment

TURN smoke:
- `blocked`
- local TURN credentials are disabled because `LOCAL_TURN_STATIC_AUTH_SECRET` is not configured
- relay-only browser smoke still needs local coturn/env

Blockers before `mvp-private-small-room-replacement`:
- run `/media/sfu-smoke` direct mode in an authenticated browser and record remote track observation
- configure local coturn env and run `/media/sfu-smoke` TURN mode with relay policy
- decide whether prototype producer/consumer endpoints must bind to room/session ownership before the controlled replacement gate

Recommended next segment:
- `local-sfu-browser-turn-smoke-rerun`

Reason:
- replacement should not start while direct browser smoke is only review and TURN relay smoke is blocked.

## Verification Performed

Verification performed during implementation:
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
- `bun.cmd run build:api` passed
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`
- `bun.cmd run build:web` passed with the same existing warning
- local `bun.cmd run dev:api` startup passed after importing `AuthModule` into `MediaModule`
- authenticated backend mediasoup health/direct transport/TURN credential-status smoke performed as documented above
