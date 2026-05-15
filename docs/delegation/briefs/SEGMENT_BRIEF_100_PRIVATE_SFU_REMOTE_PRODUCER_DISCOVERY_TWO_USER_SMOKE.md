# SEGMENT BRIEF 100. Private SFU Remote Producer Discovery Two-User Smoke

Branch:
- `wave/stage8-private-sfu-remote-producer-discovery-two-user-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-remote-producer-discovery-and-two-user-smoke`

## Goal

Move the gated private SFU path from single-browser loopback/review to a real two-user private smoke, while keeping LiveKit as the default/fallback and without switching channel or small-room routes.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_099_MVP_PRIVATE_SMALL_ROOM_REPLACEMENT.md`

Code read:
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
- `apps/api/src/modules/media/*`

Rules read:
- `rules/rules.md`
- `rules/realtime-media.md`

## Files Changed

Changed:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `package.json`
- `bun.lock`

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_100_PRIVATE_SFU_REMOTE_PRODUCER_DISCOVERY_TWO_USER_SMOKE.md`
- `playwright.config.ts`

## What Changed

Private SFU client lifecycle:
- `SfuPrivateCallAdapter` now publishes the local scoped producer, then runs a remote producer discovery loop.
- Remote discovery excludes self producers with `participantSessionId !== own participantSessionId`.
- Remote producers are consumed through the scoped receive transport.
- Remote tracks are attached to a shared remote audio stream.
- The UI reaches `connected` only after a remote producer is discovered and consumed.

Backend producer lifecycle:
- Added scoped backend producer close support.
- `SfuClientAdapter.close()` now asks the backend to close known producers, preventing stale backend producer registry entries during client teardown/remount.
- Producer discovery now returns only the latest producer per `participantSessionId + kind`, which makes dev StrictMode/remount duplicates safe without exposing stale producers to subscribers.

TURN/private path:
- `MediaRoom` can pass relay-only mode to the gated private SFU adapter with `sfuTransport=turn` or `sfuIce=relay`.
- This does not open SFU by itself; the SFU gate is still only `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`, conversation-only, non-production.

Preserved:
- normal private `?video=true` remains LiveKit
- channel `AUDIO` and `VIDEO` remain LiveKit
- LiveKit token endpoint and client adapter remain available
- current leave redirect behavior is preserved
- no production infra/env/nginx/firewall/deploy changes were made
- no microphone bug fix was attempted

Browser smoke tooling:
- `@playwright/test` is now a root dev dependency instead of being installed ad hoc in temporary smoke directories.
- `playwright.config.ts` defines the shared Chromium browser-smoke defaults.
- `bun run test:browser` runs Playwright through the repo dependency.
- `bun run test:browser:install` installs the Chromium browser binary explicitly when a local dev or CI environment needs it.

## Direct Two-User Smoke

Status:
- `pass`

Runtime:
- local API: `4004`
- local web: `3006`
- two independent authenticated browser contexts
- two temporary password-auth users
- one private conversation shared by both users

Observed:
- user one SFU status: `connected`
- user two SFU status: `connected`
- user one remote producer count: `1`
- user two remote producer count: `1`
- normal private URL without SFU query did not render `private-sfu-provider`
- leave redirected to `/servers/:serverId/conversations/:memberId`

Observed identifiers:
- server id: `26c06c9d-1e9b-4634-b7f2-0e83d50f0964`
- member one id: `7f5f92fc-a8a0-4664-907f-b7d31784d6fe`
- member two id: `b71c08cd-4a83-4e88-9189-adcb006cf953`
- conversation id: `a91a42b4-7b23-4bb4-8643-56df8bb19968`

Direct smoke covered:
- authenticated private control-plane join for both participants
- scoped send/recv transports for both participants
- local producer publish for both participants
- remote producer discovery across participant sessions
- self-producer exclusion
- remote consumer metadata creation
- remote track consume
- LiveKit default preservation for non-SFU private call URL
- leave redirect preservation

## Private TURN Relay Smoke

Status:
- `pass`

Local-only runtime:
- Docker coturn raised with `infra/coturn/docker-compose.local.yml`
- shell-only `LOCAL_TURN_STATIC_AUTH_SECRET`
- API env used:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=<local-only secret>`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- gated URL added `sfuTransport=turn`, which forced `iceTransportPolicy: "relay"`

Observed:
- user one SFU status: `connected`
- user two SFU status: `connected`
- user one remote producer count: `1`
- user two remote producer count: `1`
- normal private URL without SFU query did not render `private-sfu-provider`
- leave redirected to `/servers/:serverId/conversations/:memberId`
- coturn logs showed authenticated `ALLOCATE` and `CREATE_PERMISSION` success for peer `192.168.0.16`

Observed identifiers:
- server id: `f6ad7633-1312-41f6-898b-9b017ef0bf97`
- member one id: `efb68018-de43-422d-b21d-98ea27bdeeb2`
- member two id: `21c13428-2e31-49d6-bd6a-5433a247c41f`
- conversation id: `f4740dd7-b860-4a01-89d7-304fae470b15`

## Acceptance Result

Pass:
- ordinary private calls without SFU query remain LiveKit.
- channel audio/video routes remain LiveKit.
- gated private SFU opens only for conversation entries and only outside production runtime.
- two-user private SFU smoke shows remote producer discovery and remote track consume.
- self-consume is excluded in the two-user private adapter path.
- leave redirect remains `/servers/:serverId/conversations/:memberId`.
- private TURN relay path passed locally with authenticated coturn allocation and peer permission.

Review:
- smoke still uses synthetic audio, not real microphone/camera capture.
- backend mediasoup state is still process-local prototype state.
- producer discovery is polling-based in this segment; moving it to the project media signaling/event boundary remains the next architectural step.

Fail:
- none found in the direct or TURN two-user private smoke.

Blocked:
- none for the private two-user smoke gate.

## Handoff

What changed:
- remote producer discovery/subscription lifecycle was added to the gated private SFU path.
- backend producer close and latest-per-participant discovery were added to avoid stale producer discovery.
- relay-only private SFU smoke can be triggered with `sfuTransport=turn` under the existing SFU gate.

Two-user smoke:
- `pass`

TURN private-path result:
- `pass`

Blockers before small-room/channel replacement:
- replace polling discovery with project-owned media signaling events.
- add explicit unpublish/consumer cleanup commands beyond the minimal producer close.
- add real device capture parity and user controls without making the existing microphone bug an accidental side fix.
- define participant UI/state beyond the current smoke-focused adapter surface.

Recommended next segment:
- `private-sfu-signaling-lifecycle-and-controls`

Reason:
- private two-user SFU media now passes locally, including TURN relay. The next risk is lifecycle/control-plane maturity before broadening to small-room/channel replacement.

## Verification Performed

Commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd x playwright --version`
- `bun.cmd run test:browser`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- Temporary local API/web processes and local coturn were stopped after smoke.
