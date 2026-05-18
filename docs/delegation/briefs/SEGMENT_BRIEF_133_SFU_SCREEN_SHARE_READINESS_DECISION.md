# SEGMENT BRIEF 133. SFU Screen-Share Readiness Decision

Branch:
- `wave/stage8-sfu-screen-share-readiness-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-screen-share-readiness-decision`

## Goal

Record the SFU screen-share readiness decision after direct and TURN proof for channel `VIDEO` and explicit private SFU, without runtime/code changes, default switches, production assumptions, or LiveKit fallback changes.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_129_SFU_SCREEN_SHARE_PARITY_PROTOTYPE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_130_SFU_SCREEN_SHARE_GUARDED_BROWSER_SMOKE_RERUN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_131_SFU_SCREEN_SHARE_PRIVATE_REGRESSION_SMOKE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_132_SFU_SCREEN_SHARE_TURN_RELAY_SMOKE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Decision Matrix

Channel `VIDEO` explicit SFU screen-share:
- `pass`

Evidence:
- direct guarded screen-share smoke passed in Segment 130.
- TURN guarded screen-share smoke passed in Segment 132.
- coverage includes local preview, remote screen render, remote producer count `+1`, Stop cleanup, producer count recovery, Restart, Leave/rejoin cleanup, and LiveKit/default assertions.

Explicit private SFU screen-share:
- `pass`

Evidence:
- direct guarded private SFU screen-share smoke passed in Segment 131.
- TURN guarded private SFU screen-share smoke passed in Segment 132.
- coverage includes local preview, remote screen render, remote producer count `+1`, Stop cleanup, producer count recovery, Restart, Leave redirect, and ordinary private `?video=true` LiveKit/default assertion.

Direct screen-share:
- `pass`

Evidence:
- channel `VIDEO` direct smoke passed.
- explicit private SFU direct smoke passed.

TURN screen-share:
- `pass`

Evidence:
- channel `VIDEO` TURN smoke passed.
- explicit private SFU TURN smoke passed.
- local coturn logs showed authenticated `ALLOCATE`, `CREATE_PERMISSION`, relay usage, and peer usage for peer `192.168.0.16`.

LiveKit fallback/default:
- `preserved`

Evidence:
- ordinary channel `VIDEO` without the full explicit SFU gate remains LiveKit/default.
- ordinary channel `AUDIO` remains LiveKit/default unless its scoped gates/pilot are used.
- ordinary private `?video=true` remains LiveKit/default.
- no LiveKit removal or weakening occurred.

Ordinary channel `VIDEO` and private defaults:
- `unchanged`

Evidence:
- all SFU screen-share proof remains behind explicit non-production SFU gates.
- no default switch happened in Segments 129-133.

Production readiness:
- `blocked`

Reason:
- mediasoup/signaling state remains process-local.
- production TURN/SFU infra, firewall, monitoring, runbook, process management, and rollback remain out of scope and not implemented.
- no production default or product-facing default claim is made.

Process-local mediasoup/signaling:
- `still blocker`

Reason:
- local/dev smokes prove current single-process behavior only.
- multi-process/distributed room/session/producer state remains unimplemented.

Subjective product UX review:
- `optional/review`

Reason:
- automated and guarded browser proof covers functional screen-share lifecycle.
- product review can still assess visual layout, operator expectations, latency tolerance, copy, and polish before a broader product-facing pilot.

## What Screen-Share Now Unblocks

- SFU screen-share is no longer the blocking parity gap for controlled non-production channel `VIDEO` review.
- SFU screen-share is no longer the blocking parity gap for explicit private SFU review.
- A later channel `VIDEO` limited non-production product-default pilot can be considered, provided it remains gated, reversible, non-production, and has LiveKit rollback.
- Private SFU readiness can be revisited with screen-share parity marked `pass`, while ordinary private defaults still remain LiveKit until a separate default decision.

## What Remains Blocked

- Production readiness remains blocked.
- Any production/product default switch remains blocked until process-local state, production media infra, monitoring, runbook, and rollback are solved.
- Multi-process readiness remains blocked.
- Screen-share product UX/polish can remain `review` until an operator/product review segment signs it off.

## Recommended Next Runtime Segment

- `channel-video-sfu-limited-nonproduction-default-pilot`

Suggested scope:
- channel `VIDEO` only.
- non-production only.
- off by default.
- explicit env-gated product-default pilot, analogous to the channel `AUDIO` limited pilot.
- LiveKit rollback override preserved.
- private default remains LiveKit.
- production remains blocked.

Alternative if product review is preferred before runtime:
- `sfu-screen-share-controlled-product-review`

## Verification

Docs-only segment:
- no runtime/code changes were made.

Verification command:
- `git diff --check`
