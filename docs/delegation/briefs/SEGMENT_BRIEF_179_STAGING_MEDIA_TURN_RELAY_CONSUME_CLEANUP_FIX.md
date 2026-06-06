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

Pending operator-guided staging verification.

Required staging checks after deploy:

- deployed fixed commit on the separate staging VPS
- API/web rebuilt or restarted as affected
- authenticated mediasoup health before smoke: `ready`, counters zero
- smoke harness direct: pass
- smoke harness TURN: pass or clear blocker
- `Stop` / `Reset` cleanup: active rooms/transports/producers/consumers converge to zero
- coturn logs show authenticated relay activity, redacted
- no secrets printed

## Current Classification

- implementation: `pass / local verification complete`
- staging direct rerun: `pending`
- staging TURN rerun: `pending`
- cleanup convergence proof: `pending`
- production VPS/env/defaults: `untouched`
- final segment classification: `pending staging evidence`

## Recommended Next

Deploy this focused fix to staging and rerun only the smoke harness Direct + TURN plus cleanup convergence.

If direct, TURN, and cleanup pass, recommended next segment: `production-media-staging-smoke-run-report-rerun`.
