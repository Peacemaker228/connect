# SEGMENT BRIEF 091. Local Mediasoup Dependency Prototype

Branch:
- `wave/stage8-local-mediasoup-dependency-prototype`

Segment:
- `local-mediasoup-dependency-prototype`

## Goal

Add the first local-only mediasoup server prototype behind backend media provider/prototype boundaries, without switching UI runtime, without adding coturn, and without production infra changes.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- official mediasoup v3 installation docs: https://mediasoup.org/documentation/v3/mediasoup/installation/
- official mediasoup v3 API docs: https://mediasoup.org/documentation/v3/mediasoup/api/
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_090_CLIENT_MEDIA_CONTROLLER_BOUNDARY.md`
- `apps/api/src/modules/media/*`
- `package.json`
- `bun.lock`

Official docs findings:
- mediasoup v3 installs through the `mediasoup` server package.
- the package attempts to fetch a prebuilt `mediasoup-worker` binary during install and builds locally if needed.
- current package requirements include Node.js `>= v22.0.0`.
- `createWorker()` creates the server-side worker process.
- a `Worker` handles routers, and a `Router` exposes `rtpCapabilities`.

Local environment check:
- `node -v` returned `v24.11.1`.
- `bun.cmd -v` returned `1.3.3`.
- `bun.cmd add mediasoup@3` installed `mediasoup@3.19.22`.
- Bun initially blocked lifecycle scripts; `bun.cmd pm trust mediasoup` ran the mediasoup postinstall only for the mediasoup package.
- one-off worker/router smoke using Node succeeded with mediasoup `3.19.22`.

## Files Changed

Added:
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_091_LOCAL_MEDIASOUP_DEPENDENCY_PROTOTYPE.md`

Changed:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `package.json`
- `bun.lock`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Implementation Summary

Dependency:
- added server-side `mediasoup@3`.
- added Bun `trustedDependencies` entry for `mediasoup` so the required worker postinstall can run.
- did not add `mediasoup-client`.
- did not add coturn.

Backend prototype:
- added `MediasoupPrototypeService`.
- prototype lazily creates a mediasoup worker and router on debug health request.
- prototype uses local audio/video codec capabilities for router creation.
- prototype closes worker/router on Nest module destroy.
- prototype is disabled when `NODE_ENV === 'production'`.

Debug path:
- added authenticated `GET /api/media/prototype/mediasoup/health`.
- endpoint returns local prototype status, mediasoup version, worker binary path, worker pid, router id, router closed state, and codec count.
- endpoint does not switch the active provider and is not called by UI.

Compatibility:
- `GET /api/media/livekit-token` remains unchanged.
- `LiveKitMediaProviderAdapter` remains the active provider adapter.
- `MediaRoom` and client runtime path are unchanged in this segment.
- no production env, Docker, PM2, Nginx, firewall, or deploy docs were changed.

## Acceptance Result

Pass:
- mediasoup dependency installed and postinstall ran locally.
- one-off local worker/router smoke succeeded.
- mediasoup-specific code is isolated in `MediasoupPrototypeService`.
- current LiveKit path is unchanged.
- no coturn, `mediasoup-client`, UI switch, or production infra was added.

Review:
- authenticated HTTP call to the new debug endpoint was not executed.
- prototype is local-only and not a complete WebRTC transport/signaling implementation.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `local-coturn-turn-credential`

Reason:
- the local server-side mediasoup worker/router prototype can start behind a backend boundary, so the next planned dependency/infrastructure slice is local TURN credential support without production rollout.

## Verification Performed

Verification performed:
- `node -e "import('mediasoup')..."` created a worker/router and printed mediasoup `3.19.22`.
- `bun.cmd run typecheck:api` passed after prototype code fixes.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- `rg -n "coturn|mediasoup-client" apps packages src package.json bun.lock` returned no matches.
- `git diff --check` passed.
