# Segment Brief 158: SFU Camera Pause Remote Frame Fix

Branch: `wave/stage8-sfu-camera-pause-remote-frame-fix`

Status: `pass`

## Context

After the Stage 8 local completion closeout, manual product review found a scoped SFU UI bug:

- when a participant stops camera, the peer can continue seeing the last rendered video frame;
- the backend producer pause/resume path already exists;
- the issue is in client-side remote render state, where the remote `<video>` element can keep its last frame even after the camera producer is paused.

This does not change the Stage 8 production blockers:

- production default remains blocked;
- production SFU/TURN infra/runbook/monitoring/rollback remain missing;
- multi-process readiness remains blocked by process-local mediasoup/signaling state;
- LiveKit rollback/fallback remains required.

## Goal

Fix remote camera-off rendering for the SFU path without changing control-plane ownership, mediasoup transport behavior, production infra, or LiveKit fallback.

## Changed

- `src/lib/shared/features/media/sfu-private-call-adapter.tsx`
  - remote camera producers now track paused state separately from producer existence;
  - participant-grid video tiles detach the remote video element while camera producer is paused;
  - single/private layout hides the remote video element while camera producer is paused;
  - camera-off placeholder is rendered instead of leaving a frozen last frame visible;
  - resumed camera producers restore the remote video element.

- `tests/browser/private-sfu-two-user-smoke.spec.ts`
  - real-capture private SFU smoke now asserts that peer video hides after `Stop camera`;
  - asserts that the camera-off placeholder appears;
  - asserts that peer video returns after `Start camera`.

- `tests/browser/channel-video-sfu-smoke.spec.ts`
  - channel VIDEO SFU smoke now asserts the same remote camera pause/resume behavior in participant-grid mode.

## Guardrails

- No production default switch.
- No LiveKit removal.
- No Stage 6/Postgres production migration changes.
- No production media infra/env/deploy changes.
- No unbounded retry/reconnect loop.

## Verification

Completed:

- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `git diff --check`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`
- `bun.cmd run test:browser:channel-audio-sfu`
- `bun.cmd run test:browser:channel-video-sfu`

Guarded browser smoke:

- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`, `CHANNEL_VIDEO_SFU_SMOKE_USERS=2`, direct channel `VIDEO` SFU: `pass`
- `PRIVATE_SFU_BROWSER_SMOKE=1`, `PRIVATE_SFU_SMOKE_CAPTURE=real`, private SFU: `pass`

Note:

- the first channel smoke attempt against a pre-existing/stale web dev process did not reach the SFU UI;
- rerun after restarting web on the standard local origin `localhost:3001` passed.

## Classification

- SFU camera pause remote frozen-frame bug: `fixed and covered by guarded browser smoke`
- LiveKit fallback/default: `preserved`
- production readiness: `blocked as before`

## Recommended Next Step

After verification, ask the operator to rerun the narrow manual check:

- two users in private or channel VIDEO SFU;
- user A clicks `Stop camera`;
- user B should see camera-off/no-video placeholder, not the last frozen frame;
- user A clicks `Start camera`;
- user B should see video return.
