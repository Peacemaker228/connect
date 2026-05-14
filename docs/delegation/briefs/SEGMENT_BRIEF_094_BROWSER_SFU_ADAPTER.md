# SEGMENT BRIEF 094. Browser SFU Adapter

Branch:
- `wave/stage8-browser-sfu-adapter`

Segment:
- `browser-sfu-adapter`

## Goal

Add a browser-side SFU provider adapter behind the existing client media boundary without switching current routes to the SFU path by default, removing LiveKit, changing production infra/env/network config, rolling out relay service deployment, or fixing microphone/media symptoms.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `rules/rules.md`
- `rules/realtime-media.md`
- `rules/task.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_093_BACKEND_MEDIASOUP_TRANSPORT_PROTOTYPE.md`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/livekit-client-adapter.tsx`
- `src/lib/shared/features/media/use-media-room-controller.ts`

Official docs/package checks:
- mediasoup-client v3 documentation: https://mediasoup.org/documentation/v3/mediasoup-client/
- mediasoup-client v3 API: https://mediasoup.org/documentation/v3/mediasoup-client/api/
- mediasoup client/server communication guide: https://mediasoup.org/documentation/v3/communication-between-client-and-server/
- current published package version checked through package metadata: `mediasoup-client@3.20.0`

Docs findings:
- browser code should use `mediasoup-client` v3.
- a browser `Device` must be loaded with router RTP capabilities before send/receive transports can be created.
- send and receive transports are separate client-side transports.
- client transports are created from server-side WebRTC transport metadata: id, ICE parameters, ICE candidates, DTLS parameters, and optional SCTP parameters.
- the transport `connect` event must signal DTLS parameters back to the server.
- TURN credentials belong in the transport `iceServers` option when available.

## Files Changed

Added:
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_094_BROWSER_SFU_ADAPTER.md`

Changed:
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `packages/sdk/src/actions/media.ts`
- `package.json`
- `bun.lock`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Implementation Summary

Dependency choice:
- added `mediasoup-client@3.20.0`
- choice is fixed for browser SFU adapter work because it is the official client library for mediasoup v3 and matches the backend transport metadata shape already produced by the prototype endpoints

Backend prototype metadata:
- extended mediasoup prototype health with `routerRtpCapabilities`
- this allows the browser adapter to load a `Device` without adding a new production endpoint or switching runtime behavior

SDK prototype surface:
- added typed SDK calls for:
  - `getMediasoupPrototypeHealth`
  - `createMediasoupPrototypeTransport`
  - `connectMediasoupPrototypeTransport`
- kept these calls scoped to prototype endpoints
- did not change `getLiveKitToken`, `joinRoom`, or current route entry behavior

Browser adapter:
- added `SfuClientAdapter` next to the current LiveKit adapter
- loads a mediasoup `Device` from prototype router RTP capabilities
- creates `send` and `recv` transports through backend prototype endpoints
- maps backend transport metadata into mediasoup-client transport options
- wires transport `connect` to the backend connect skeleton
- maps local TURN credential metadata into `iceServers` when credentials are enabled
- owns and closes adapter-created transports

Compatibility:
- `LiveKitClientAdapter` remains the default rendered provider in `MediaRoom`
- current channel/private routes are not switched to the SFU path
- no full room replacement was done
- no produce/consume or remote rendering flow was implemented in this segment
- current LiveKit fallback remains untouched

## Acceptance Result

Pass:
- browser adapter boundary exists.
- adapter can consume backend router and transport metadata shapes.
- adapter can create send/receive mediasoup-client transports through backend prototype endpoints once invoked by a future gated path.
- adapter can pass backend-issued local TURN credentials into transport `iceServers`.
- default UI runtime still renders `LiveKitClientAdapter`.
- LiveKit fallback is untouched.

Review:
- authenticated browser endpoint smoke was not executed in this segment.
- end-to-end media replacement is not complete.
- producer/consumer server endpoints and client publish/consume/render wiring are still missing before a private/small-room replacement can be attempted.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `mediasoup-produce-consume-prototype`

Reason:
- the browser can now create and connect mediasoup transports behind a non-default adapter, but actual audio/video publish and subscribe still need narrow backend producer/consumer prototype endpoints plus client adapter methods before any private/small-room replacement segment.

## Verification Performed

Verification performed:
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed during implementation.
- `bun.cmd run typecheck:api` passed during implementation.
- `git diff --check` passed.
- required forbidden-string scan returned no matches after docs wording cleanup.
- `bun.cmd run build:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
