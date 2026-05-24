# SEGMENT BRIEF 157. Stage 8 Media MVP Local Completion Review

Branch:
- `wave/stage8-media-mvp-local-completion-review`

Base:
- `db60cd9 docs(stage8): align media mvp completion next step`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `stage8-media-mvp-local-completion-review`

## Goal

Decide whether the Stage 8 Media MVP local track can close, or whether a specific scoped runtime blocker remains.

This is a short docs/report-only completion review. It is not a production rollout.

## Completion Decision

Local Stage 8 Media MVP:
- `pass`.

Rationale:
- channel `AUDIO`, channel `VIDEO`, and private SFU paths have gated/local or non-production default-candidate coverage.
- direct, TURN, screen-share, restart/rejoin, route-away/back, offline/restore, LiveKit rollback, and cleanup health have pass evidence within the local/dev MVP boundary.
- no specific scoped runtime blocker remains that should keep the local Stage 8 Media MVP open.

Production readiness:
- `blocked`.

LiveKit removal:
- `blocked`.

Stage 6/Postgres production migration:
- `deferred`.

## Track Status

Channel `AUDIO` SFU:
- `pass for limited non-production controlled review`.
- direct channel `AUDIO` pilot evidence passed after scoped mute, route cleanup, speaking-state, and stale startup fixes.
- TURN channel `AUDIO` local evidence passed in the earlier guarded runs.
- LiveKit rollback/default remained preserved.

Channel `VIDEO` SFU:
- `pass for broader non-production default-candidate`.
- direct local smoke passed.
- local TURN smoke passed with a relay-range review note.
- screen-share, route away/back, failed Restart recovery, and cleanup health passed.
- production default and multi-process readiness remain blocked.

Private SFU:
- `pass for controlled product review`.
- private `?video=true` enters SFU only in non-production under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.
- direct candidate, screen-share, bounded Restart, route away/back, explicit Leave/rejoin, offline/restore, LiveKit rollback, and cleanup health passed after the remote-track reconciliation fix and rerun.

Screen-share:
- `pass locally`.
- direct screen-share evidence exists for channel `VIDEO` and private SFU.
- TURN screen-share evidence passed for channel `VIDEO` and explicit private SFU through local Docker coturn.
- production TURN readiness is not claimed.

Restart / rejoin / route-away / offline:
- `pass locally`.
- channel `VIDEO` has bounded failed/offline Restart recovery and route away/back coverage.
- private SFU has bounded Restart, route away/back, Leave/rejoin, and offline/restore rerun coverage.
- channel `AUDIO` has leave/rejoin, route cleanup, mute, reload/pagehide, and stale-session cleanup coverage from its limited pilot track.

Cleanup health:
- `pass after bounded local convergence`.
- local/dev health snapshots in the relevant run reports settled active rooms/sessions/transports/producers/consumers back to `0`.
- this remains process-local prototype evidence, not production monitoring.

LiveKit rollback/fallback:
- `preserved`.
- rollback remains available through:
  - `?mediaProvider=livekit`
  - `?livekit=true`
  - `?sfu=false`
- LiveKit fallback remains required until a later scoped removal decision.

## Production Blockers

Production readiness remains blocked by:
- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production TURN credentials/secrets rollout.
- no production firewall/Nginx/process-management/runbook.
- no production monitoring/alerting.
- no production rollback plan for SFU rollout.
- no production-like soak.
- LiveKit fallback still required.

Multi-process readiness:
- `blocked` until media/signaling state is externalized or otherwise made multi-process safe.

## What We Are Not Doing Now

This closeout does not:
- enable production default.
- remove LiveKit.
- switch production media runtime.
- build production TURN/SFU infrastructure.
- change env defaults.
- add new smoke helpers.
- start another long readiness loop.
- change Stage 6/Postgres production migration.
- claim production or multi-process readiness.

## Recommended Next Track

Recommended next:
- production media infrastructure/runbook planning as a separate track, if production rollout is the next business goal.

Acceptable alternatives:
- scoped manual product-review run reports for channel `AUDIO`, channel `VIDEO`, or private SFU.
- Stage 8 media documentation cleanup/closeout.
- Stage 6/Postgres production migration planning, still separate from this media MVP closeout.

Not recommended next:
- production rollout without production SFU/TURN infra/runbook/monitoring/rollback.
- LiveKit removal.
- broad ungated default switch.

## Verification Performed

Standard commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`
- `bun.cmd run test:browser:channel-audio-sfu`
- `bun.cmd run test:browser:channel-video-sfu`

Results:
- standard verification passed.
- standard browser smoke scripts without guarded env flags skipped safely as expected.
