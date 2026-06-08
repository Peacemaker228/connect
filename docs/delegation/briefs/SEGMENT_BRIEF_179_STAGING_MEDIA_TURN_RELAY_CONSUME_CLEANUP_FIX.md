# Segment Brief 179: Staging Media TURN Relay Consume Cleanup Fix

Branch: `wave/stage9-staging-media-turn-relay-consume-cleanup-fix`
Segment: `staging-media-turn-relay-consume-cleanup-fix`
Date: 2026-06-06

## Goal

Fix the staging smoke harness TURN relay consume failure and mediasoup cleanup non-convergence without broad media rewrites, production rollout, or full manual private/channel smoke.

## Scope Guardrails

- Production VPS was not touched.
- Production env/defaults were not changed.
- LiveKit fallback was not removed.
- No full manual private/channel smoke was run in this segment.
- No real secrets, private keys, passwords, generated TURN credentials, cookies, auth headers, or env values are recorded here.
- Stage 6/Postgres production migration was not touched.

## Root Cause

Cleanup non-convergence root cause:

- The browser smoke harness created unscoped mediasoup prototype transports.
- The backend already had close endpoints for producers and consumers, but not for WebRTC transports.
- `SfuClientAdapter.close()` closed local browser transports, producers, and consumers, and requested backend producer/consumer close, but it could not explicitly close backend transports.
- `Stop` / `Reset` called async adapter cleanup without awaiting it, then allowed evidence collection while close calls could still be in flight.
- Because unscoped smoke resources are not session-scoped, `closeSession` and stale-session cleanup were not a reliable cleanup path for the harness.

TURN muted-track likely cause addressed:

- The client resumed the backend consumer and local consumer, so missing consumer resume was not the primary finding.
- The harness checked remote track flow without first proving the send and receive transports had reached a connected ICE/DTLS state.
- For relay-only TURN mode this can race the media flow more than direct mode.

## Implementation

Backend mediasoup prototype:

- Added a narrow authenticated transport close endpoint:
  - `POST /api/media/prototype/mediasoup/transports/:transportId/close`
- Added backend transport-to-producer and transport-to-consumer ownership maps.
- Transport close now closes/removes associated consumers and producers, then closes/removes the transport.
- Transport close preserves the existing scoped-owner checks; unscoped harness resources can be closed only as unscoped resources.
- Health counters still expose non-secret active resource counts.

SDK/client:

- Added SDK action for backend transport close.
- `SfuClientAdapter.close()` now requests backend producer/consumer close and backend transport close, then clears local mediasoup-client resources.
- Added bounded client wait for transport connection state before harness media-flow assertions.

Smoke harness:

- `Stop` and `Reset` now await cleanup.
- Added bounded cleanup convergence proof: health is polled with a fixed cap and fails if active rooms/transports/producers/consumers do not settle to zero.
- Direct/TURN runs now wait for send and receive transport connection before checking the remote track.
- Cleanup result is surfaced in the harness result panel without exposing secrets.

## Files Changed

- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media/sfu-client-adapter.ts`
- `src/lib/shared/features/media/sfu-smoke-harness.tsx`

## Local Verification

Local verification passed:

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`

Note: one initial `tsc` attempt failed while `next build` was concurrently regenerating `.next/types`; rerunning after `build:web` completed passed.

## Staging Verification

Operator-guided staging verification ran on 2026-06-08 on the separate staging VPS.

Deploy/update evidence:

- Deployed commit: `aa23925bd68aae5bd5c954ce601540de5eae8242`
- Commit summary: `aa23925 Merge pull request #132 from Peacemaker228/wave/stage9-staging-media-turn-relay-consume-cleanup-fix`
- API build: `pass`
- Web build: `pass`
- PM2 restart:
  - `ax-connect-staging-api`: online after restart
  - `ax-connect-staging-web`: online after restart
- HTTPS API health: `pass`
- Schema migration: not run
- Production VPS/env/defaults: untouched

Authenticated preflight before harness:

- Fresh staging-only auth session: `pass`
- `/media/sfu-smoke` authenticated entrypoint: HTTP `200`
- mediasoup health:
  - status: `ready`
  - enabled: `true`
  - worker pid present
  - router id present
  - active room count: `0`
  - active transport count: `0`
  - active producer count: `0`
  - active consumer count: `0`
  - runtime staging SFU enabled: `true`
  - TURN URLs configured: `true`
  - TURN secret configured: `true`
- coturn container: running and not restarting

Harness direct result:

- mode: `direct`
- status: `pass`
- health: `pass`
- create send transport: `pass`
- create recv transport: `pass`
- produce local track: `pass`
- send transport connected: `pass`
- create consumer metadata: `pass`
- recv transport connected: `pass`
- consume remote track: `pass`
- remote track: `live`
- raw transport/producer/consumer identifiers were present in the browser UI but are not recorded here

Direct cleanup:

- harness cleanup: `pass`
- browser cleanup evidence: `rooms=0 transports=0 producers=0 consumers=0`
- server health after direct cleanup:
  - status: `ready`
  - enabled: `true`
  - active room count: `0`
  - active transport count: `0`
  - active producer count: `0`
  - active consumer count: `0`

Harness TURN result:

- mode: `turn`
- status: `fail`
- health: `pass`
- create send transport: `pass`
- create recv transport: `pass`
- produce local track: `pass`
- send transport connected: `fail`
- failure: `mediasoup transport did not connect: new`
- consumer metadata was not reached in the failed TURN run
- raw transport/producer identifiers were present in the browser UI but are not recorded here

TURN cleanup:

- harness cleanup: `pass`
- browser cleanup evidence: `rooms=0 transports=0 producers=0 consumers=0`
- final authenticated mediasoup health:
  - HTTP `200`
  - status: `ready`
  - enabled: `true`
  - worker pid present
  - router id present
  - active room count: `0`
  - active transport count: `0`
  - active producer count: `0`
  - active consumer count: `0`

Coturn evidence:

- redacted coturn logs showed relay allocation activity during the run.
- allocation count returned to `0`.
- old invalid/no-auth lines were present in the coturn tail and remained redacted.
- no generated TURN credentials, cookies, auth headers, passwords, private keys, or env values were printed.

## Current Classification

- implementation: `pass / local verification complete`
- staging deploy: `pass`
- staging direct harness rerun: `pass`
- cleanup convergence: `pass`
- staging TURN harness rerun: `fail / relay transport connection blocker`
- production VPS/env/defaults: `untouched`
- final segment classification: `partial pass / cleanup fixed, TURN relay connection still blocked`

## Recommended Next

Do not proceed to full manual private/channel smoke yet.

Recommended next: focused staging TURN relay connection fix, because relay mode now fails before consume with send transport connection state staying `new`.

After that fix, rerun only the staging smoke harness Direct + TURN plus cleanup convergence. Proceed to `production-media-staging-smoke-run-report-rerun` only if Direct, TURN, and cleanup all pass.
