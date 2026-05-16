# SEGMENT BRIEF 127. Channel Audio SFU Limited Pilot Readiness Decision

Branch:
- `wave/stage8-channel-audio-sfu-limited-pilot-readiness-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-audio-sfu-limited-pilot-readiness-decision`

## Goal

Make a docs-only readiness decision for the channel `AUDIO` SFU limited non-production pilot after direct/TURN smoke, observability, and stale-session cleanup soak.

## Scope Boundary

Changed:
- summarized Segment 123 through Segment 126 evidence for the limited channel `AUDIO` SFU pilot.
- classified readiness for channel `AUDIO` limited pilot, channel `VIDEO` default, private default, production readiness, and long-soak/multi-process readiness.
- updated Wave 33 and Stage status.

Preserved:
- no runtime code changed.
- no production default was enabled.
- no channel `VIDEO` default switch was made.
- no private default switch was made.
- LiveKit fallback/default was not removed or weakened.
- no screen-share implementation was added.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6/Postgres production migration changes were made.

## Evidence Summary

Segment 123:
- channel `AUDIO` product default readiness was `pass for a limited non-production product-default pilot`.
- channel `VIDEO` default stayed `review/hold` because SFU screen-share remains deferred.
- private default stayed `review/hold`.
- production readiness stayed `blocked`.

Segment 124:
- added the limited channel `AUDIO` product-default pilot gate: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- direct 5-user pilot smoke passed without per-URL SFU query.
- TURN 3-user pilot smoke passed through local Docker coturn.
- explicit LiveKit rollback passed.
- channel `VIDEO`, ordinary private `?video=true`, and production remained LiveKit/default.

Segment 125:
- added local/dev observability through active mediasoup counters, lifecycle logs, and client-visible `Transport: direct|turn`.
- direct and TURN pilot smokes passed again.
- long-soak stayed `review` because raw process-local mediasoup counts could persist after smoke rooms/restarts/browser-context cleanup.

Segment 126:
- added non-production process-local heartbeat and stale-session cleanup for abandoned local SFU sessions/resources.
- direct 5-user pilot soak passed with cleanup assertions and counters settled to zero.
- TURN 3-user pilot soak passed with cleanup assertions and counters settled to zero.
- guarded private SFU direct regression passed after shared SFU lifecycle changes.
- channel `VIDEO`, ordinary private `?video=true`, and production remained LiveKit/default.

## Readiness Matrix

| Area | Direct | TURN | Offline/restore | Restart | Leave/rejoin | Cleanup/observability | Rollback/LiveKit | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Channel `AUDIO` limited non-production pilot | pass, 5 users | pass, 3 users | pass, 5 users | pass | pass | pass, counters settle to zero after context close | pass | `pass for controlled product review` |
| Channel `VIDEO` default | explicit/candidate SFU evidence exists | TURN evidence exists | evidence exists | pass in prior smokes | pass in prior smokes | not the target of this pilot | LiveKit default preserved | `review/hold` |
| Private default | gated private SFU regression pass | prior TURN evidence exists | prior evidence exists | pass | leave redirect pass | shared lifecycle regression pass | ordinary private remains LiveKit | `review/hold` |
| Local long-soak, single-process | pass for bounded pilot soak | pass for bounded pilot soak | pass in guarded smoke | pass | pass | pass with heartbeat/TTL/sweeper | rollback pass | `pass for limited pilot review; not production proof` |
| Multi-process/production | local only | local coturn only | local only | local only | local only | process-local only | LiveKit fallback remains | `blocked` |

## Decision

Channel `AUDIO` limited non-production pilot:
- `pass for controlled product review`.
- The pilot is ready to be reviewed by operators/product users in controlled non-production sessions with `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- This is not a broad product default and not production readiness.

Channel `VIDEO` default:
- `review / hold`.
- Channel `VIDEO` remains LiveKit by default because SFU screen-share is still deferred and this segment did not make a video readiness decision.

Private default:
- `review / hold`.
- Gated private SFU remains healthy enough as a regression path, but ordinary private `?video=true` stays LiveKit until a separate private default decision.

Production readiness:
- `blocked`.
- Production still requires non-process-local media/signaling state design, production TURN/SFU infra, runbook, monitoring, firewall/process management, rollback, and operational ownership.

Long-soak / multi-process readiness:
- bounded local single-process soak is `pass for limited pilot review`.
- multi-process and production soak are `blocked` because the current mediasoup/signaling registry is still process-local.

## What Can Happen Next

Recommended next segment:
- `channel-audio-sfu-limited-pilot-controlled-product-review`

Allowed shape:
- run controlled non-production channel `AUDIO` pilot sessions with the pilot env enabled.
- collect operator/product feedback on audio quality, reconnect/restart behavior, permission UX, rollback clarity, and observability usefulness.
- keep explicit LiveKit rollback available.
- keep channel `VIDEO`, private default, and production on LiveKit/default.

Alternative next segment if production readiness is the priority:
- `media-sfu-process-state-and-production-runbook-design`

## What Cannot Happen Yet

- no production SFU default.
- no channel `VIDEO` default switch.
- no private default switch.
- no LiveKit removal.
- no broad product default beyond the controlled channel `AUDIO` non-production pilot review.
- no production readiness claim while mediasoup/signaling state is process-local.
- no production TURN/SFU infra assumption without a separate runbook and deployment plan.
- no screen-share parity claim for SFU.

## Handoff

Readiness decision:
- channel `AUDIO` limited non-production pilot: `pass for controlled product review`
- channel `VIDEO` default: `review/hold`
- private default: `review/hold`
- production readiness: `blocked`
- long-soak/multi-process readiness: `local bounded pass / multi-process blocked`

Remaining blockers:
- process-local mediasoup/signaling state.
- production TURN/SFU infra, runbook, monitoring, firewall/process management, and rollback procedure.
- SFU screen-share remains deferred for channel `VIDEO` and private parity.
- human/operator subjective quality signoff has not been completed for the limited pilot.

Recommended next segment:
- `channel-audio-sfu-limited-pilot-controlled-product-review`

## Verification Performed

Commands:
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
- all verification commands passed.
- guarded browser scripts skipped safely without smoke env flags.
