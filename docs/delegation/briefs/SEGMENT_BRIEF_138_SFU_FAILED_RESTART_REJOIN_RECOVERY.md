# SEGMENT BRIEF 138. SFU Failed Restart Rejoin Recovery

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-soak-product-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-failed-restart-rejoin-recovery`

## Goal

Handle the rare operator-observed case where a user leaves a SFU call route, returns, lands in `failed`, and pressing Restart briefly enters `waiting` before failing again.

## Finding

The normal Restart button only restarted transports/producers inside the current participant session.

If the participant session had already been closed, superseded, or otherwise invalidated during route/page lifecycle cleanup, retrying inside the same session could fail repeatedly.

## Implementation

- `useMediaRoomController` now exposes `rejoinControlPlane()`.
- `rejoinControlPlane()` closes the active participant session with `transport-failure` when available, clears the current join, and starts a fresh backend `joinRoom`.
- `MediaRoom` passes this recovery callback to the SFU adapter.
- `SfuPrivateCallAdapter` keeps ordinary Restart behavior for non-terminal states, but when status is `failed`, Restart now triggers control-plane rejoin instead of trying to reuse the failed participant session.

## Guardrails

Unchanged:
- LiveKit fallback/default remains preserved.
- production remains blocked.
- channel `AUDIO`/`VIDEO` pilot gates remain unchanged.
- production media infra/runbook remains out of scope.

## Verification

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser:channel-video-sfu` without env safely skipped

Manual rerun:
- `pass / operator-confirmed once`

Operator result:
- the rare failed state was reproduced once.
- pressing Restart recovered the call through the new rejoin path.

Residual risk:
- the original issue is rare, so this remains a bounded manual confidence result, not a long-soak proof.
