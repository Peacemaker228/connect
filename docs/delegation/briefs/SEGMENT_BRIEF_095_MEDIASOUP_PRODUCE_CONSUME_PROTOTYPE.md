# SEGMENT BRIEF 095. Mediasoup Produce Consume Prototype

Branch:
- `wave/stage8-mediasoup-produce-consume-prototype`

Segment:
- `mediasoup-produce-consume-prototype`

## Goal

Add a narrow local prototype for publish/consume on top of the existing mediasoup WebRTC transports, without switching routes to the SFU path by default, removing LiveKit, changing production infra/env/network config, rolling out relay service deployment, doing full room replacement, or fixing microphone/media symptoms.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_094_BROWSER_SFU_ADAPTER.md`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `src/lib/shared/features/media-room.tsx`

Local package type references checked:
- mediasoup server `Transport.produce`
- mediasoup server `Transport.consume`
- mediasoup server `Router.canConsume`
- mediasoup-client `Transport.produce`
- mediasoup-client `Transport.consume`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_095_MEDIASOUP_PRODUCE_CONSUME_PROTOTYPE.md`

Changed:
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Implementation Summary

Backend prototype registry:
- added in-memory producer registry to `MediasoupPrototypeService`
- added in-memory consumer registry to `MediasoupPrototypeService`
- producer/consumer state remains process-local prototype state
- registries are cleared when the local worker/router prototype resets or the API module is destroyed

Backend produce:
- added authenticated `POST /api/media/prototype/mediasoup/producers`
- accepts `transportId`, `kind`, `rtpParameters`, and optional `paused`
- validates that the transport exists and is a `send` transport
- creates a mediasoup producer from RTP parameters
- returns producer metadata: `producerId`, `transportId`, `kind`, and `paused`
- production runtime remains disabled through the same local prototype service guard

Backend consume:
- added authenticated `POST /api/media/prototype/mediasoup/consumers`
- accepts `transportId`, `producerId`, `rtpCapabilities`, and optional `paused`
- validates that the transport exists and is a `recv` transport
- validates producer existence
- checks `router.canConsume`
- creates a mediasoup consumer and returns consumer metadata for the browser adapter:
  - `consumerId`
  - `producerId`
  - `kind`
  - `rtpParameters`
  - `type`
  - `paused`
  - `producerPaused`

SDK prototype surface:
- added `produceMediasoupPrototypeTrack`
- added `consumeMediasoupPrototypeTrack`
- added typed producer and consumer response shapes
- existing LiveKit token and media control-plane actions are unchanged

Browser adapter:
- `SfuClientAdapter.produce(track)` now publishes a local track through an existing `send` transport
- the adapter handles mediasoup-client transport `produce` by calling the backend producer endpoint
- producer metadata is retained in the adapter until close
- `SfuClientAdapter.createConsumerMetadata(...)` asks the backend for consumer metadata from a `recv` transport and loaded device RTP capabilities
- `SfuClientAdapter.consume(metadata)` creates a mediasoup-client consumer from backend metadata and returns the remote track
- prototype consumers default to unpaused because no consumer resume command exists yet
- current `MediaRoom` still renders `LiveKitClientAdapter` by default

Compatibility:
- no default route switched to SFU
- no full private/small-room replacement was done
- LiveKit remains the active fallback/default path
- no production media infra/env/deploy config was changed

## Acceptance Result

Pass:
- backend can accept RTP parameters and create a producer.
- backend can create compatible consumer metadata for an existing receive transport.
- SDK has prototype calls for producer and consumer flows.
- browser adapter has `produce(track)` and `consume(metadata)` methods.
- current LiveKit path remains unchanged.

Review:
- authenticated browser/server end-to-end media smoke was not executed in this segment.
- producer/consumer registry is intentionally in-memory and local-only.
- route/runtime gate for trying the SFU path is still missing.
- prototype endpoints are authenticated but not yet bound to room/session ownership; this is acceptable for the local-only prototype but must be tightened before replacement.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `local-sfu-direct-turn-smoke`

Reason:
- backend transports, produce/consume metadata, SDK calls, and browser adapter methods now exist behind non-default boundaries, but the plan requires local direct/TURN smoke before any controlled private/small-room replacement switch.

## Verification Performed

Verification performed:
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed during implementation.
- `bun.cmd run typecheck:api` passed during implementation.
- `git diff --check` passed.
- `bun.cmd run build:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
- `bun.cmd run build:web` passed with the same existing warning.
