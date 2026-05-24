# SEGMENT BRIEF 156. Private SFU Controlled Product Review

Branch:
- `wave/stage8-private-sfu-controlled-product-review`

Base:
- `1a4793b docs(stage8): record private sfu long soak rerun`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-controlled-product-review`

## Goal

Evaluate whether the private SFU non-production default-candidate is ready for controlled product review.

This is a review/report segment, not a production rollout.

## Evidence Reviewed

Segment 151 implemented the private SFU non-production default-candidate gate:
- `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`

Segment 152 closed the initial run report:
- candidate direct smoke: `pass`.
- candidate screen-share smoke: `pass`.
- explicit private SFU regression: `pass`.
- LiveKit rollback preserved.

Segment 153 added bounded long-soak coverage and found client reconciliation bugs:
- route away/back: `fail / needs fix`.
- explicit leave/rejoin: `fail / needs fix`.
- optional offline/restore: `review / fail finding`.

Segment 154 fixed private SFU remote-track reconciliation:
- single-layout remote camera tracks are tracked by `producerId`.
- authoritative backend producer sync can repair missed remote producer consumption.
- route away/back and leave/rejoin restored `Remote tracks: 2`.

Segment 155 reran the long-soak:
- private `?video=true` default-candidate direct: `pass`.
- bounded Restart loop: `pass`.
- route away/back without Leave: `pass`.
- explicit Leave/rejoin: `pass`.
- optional offline/restore: `pass`.
- cleanup health: `pass after bounded convergence`.
- LiveKit rollback: `pass / preserved`.

## Product Review Classification

Private SFU non-production default-candidate:
- `pass for controlled product review`.

Direct private `?video=true` candidate UX:
- `pass for manual/product review`.
- ordinary private video enters SFU only in non-production, only under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`, and only when no explicit LiveKit rollback query is present.

Screen-share UX:
- `pass for review`.
- smoke evidence covers start/stop and no known blocking bug remains for controlled review.

Restart / route away/back / leave/rejoin:
- `pass for review`.
- no known blocking bug remains after Segment 154 and Segment 155 rerun.

Offline/restore:
- `pass for review`.
- bounded smoke evidence exists from Segment 155.

No-camera fallback:
- `not a blocker`.
- current behavior remains acceptable for controlled review.

LiveKit rollback:
- `preserved`.
- rollback remains available through:
  - `?mediaProvider=livekit`
  - `?livekit=true`
  - `?sfu=false`

Production default:
- `blocked`.

LiveKit removal:
- `blocked`.

Production media readiness:
- `blocked`.

## Manual Operator Checklist Before Broader/Default Decisions

For controlled product review, an operator should manually check:
- two real users can start ordinary private `?video=true` under `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE=1`.
- both users see/hear remote audio/video after initial join.
- mute/unmute and camera stop/start remain understandable and responsive.
- screen-share start/stop is visible to the peer and returns to normal camera/audio state after stop.
- Restart is understandable, bounded, and returns to connected state.
- one user can navigate away without pressing Leave, return, and both users recover expected remote tracks.
- explicit Leave returns the user to the conversation without `?video=true`, and rejoining restores remote tracks.
- temporary offline/restore or failed-state recovery does not leave the review session unrecoverable.
- no-camera fallback explains that audio can continue without camera.
- explicit LiveKit rollback query is easy to apply and visibly avoids the private SFU provider.
- local/dev health counters settle to zero active rooms/sessions/transports/producers/consumers after the review session closes.

## Non-Goals

This segment does not:
- enable production default.
- enable broader/default rollout beyond the existing non-production candidate gate.
- remove LiveKit.
- change runtime code.
- change env defaults.
- change production TURN/SFU infrastructure.
- change Stage 6/Postgres production migration docs.
- claim multi-process readiness.

## Remaining Blockers

- production default remains blocked.
- production media readiness remains blocked by process-local mediasoup/signaling state.
- multi-process readiness remains blocked until media/signaling state is externalized or otherwise made multi-process safe.
- no production SFU/TURN infrastructure.
- no production media runbook, monitoring, process management, or rollback plan.
- LiveKit fallback remains required.
- LiveKit removal remains blocked.
- broader/default decisions still need explicit follow-up readiness and implementation segments.

## Recommended Next Segment

Recommended:
- `stage8-media-mvp-local-completion-review`

Acceptable scoped alternative:
- `private-sfu-controlled-product-review-manual-run-report`

Not recommended next:
- production rollout.
- LiveKit removal.
- production TURN/SFU infrastructure work.
- Stage 6/Postgres production migration work.

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
