# SEGMENT BRIEF 120. Channel SFU Default Switch Readiness Decision

Branch:
- `wave/stage8-channel-sfu-default-switch-readiness-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-sfu-default-switch-readiness-decision`

## Goal

Make a docs-only readiness decision for channel SFU default-switch work without changing runtime defaults.

## Scope Boundary

Changed:
- documented readiness matrix for private SFU, channel `AUDIO` SFU, and channel `VIDEO` SFU.
- separated local/dev confidence, product-facing default readiness, and production readiness.
- updated Wave 33 and Stage 8 status.

Preserved:
- channel `VIDEO` remains LiveKit by default.
- channel `AUDIO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- LiveKit fallback/default was not removed or weakened.
- no runtime code was changed.
- no SFU default switch was enabled.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.
- no screen-share runtime implementation was added.

## Readiness Matrix

| Area | Direct | TURN | Offline/restore | Restart | Leave/rejoin | Physical device | LiveKit fallback | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Private SFU | pass | pass/review | pass | pass | pass | pass/review | pass | `pass for gated local/dev; review for broader default` |
| Channel `AUDIO` SFU | pass, 5 users | pass, 3 users | pass, 5 users | pass | pass | audio path covered by real mic/private and channel fake-device smoke | pass | `pass for gated local/dev` |
| Channel `VIDEO` SFU | pass, 5 users | pass, 3 users; pass, 2-user physical TURN | pass, 5 users | pass | pass | pass, 2-user headed Android 13 / Windows Virtual Camera | pass | `pass for gated local/dev` |
| Screen-share parity | not implemented | not implemented | not implemented | not implemented | not implemented | not applicable | LiveKit still covers ordinary/default routes | `deferred / blocker for product-facing parity default` |
| Production/multi-process | local process only | local coturn only | local process only | local process only | local process only | local only | LiveKit rollback remains | `blocked for production default` |

## Decision

Readiness decision:
- `review / proceed only to a controlled non-production default-candidate gate`

Meaning:
- The accumulated local/dev evidence is strong enough to start a next narrow implementation segment that introduces a controlled non-production default-candidate gate for channels.
- The next step must still be reversible and explicitly non-production.
- This is not approval to switch product-facing defaults broadly.
- This is not production readiness.

Allowed next controlled step:
- add a non-production-only channel SFU default-candidate gate, for example an env/dev flag that makes channel `AUDIO` and/or channel `VIDEO` choose SFU without per-URL `mediaProvider=sfu`, while preserving an easy LiveKit fallback/rollback.
- keep the gate off by default.
- keep channel `VIDEO` stricter than channel `AUDIO` if needed, because video still depends on real capture/browser permissions and screen-share is deferred.

Not allowed yet:
- production default switch.
- broad product-facing default switch.
- removing LiveKit fallback.
- removing the existing explicit query gates.
- switching screen-share to SFU.
- multi-process or distributed SFU claims.

## Rationale

Local/dev confidence:
- private SFU has direct, TURN, reconnect/offline, restart, real-capture, no-camera fallback, and leave redirect coverage.
- channel `AUDIO` SFU has 2-user pilot, 3-user direct/TURN, 5-user direct load, offline/restore, restart, leave/rejoin, stale cleanup, and LiveKit fallback coverage.
- channel `VIDEO` SFU has 2-user layout, 3-user direct/TURN, 5-user direct load, offline/restore, restart, leave/rejoin, stale tile cleanup, physical camera direct, physical camera TURN, and LiveKit fallback coverage.
- ordinary channel `AUDIO`, ordinary channel `VIDEO`, and ordinary private `?video=true` remain LiveKit.

Product-facing default readiness:
- `review`, not pass.
- SFU screen-share is explicitly deferred while LiveKit still provides default-route screen-share coverage.
- subjective audio/video quality signoff is optional but still useful before product-facing rollout.
- a default-candidate gate should be tested before any broader default decision.

Production readiness:
- `blocked`.
- current mediasoup/signaling state is process-local.
- production TURN/SFU infrastructure, firewall, process management, monitoring, runbook, and rollback procedure are intentionally out of scope and not implemented.
- production rollout needs a separate production media infra/runbook wave.

## Handoff

Readiness decision:
- `review`
- proceed only to a controlled non-production default-candidate gate.

What can happen next:
- implement a non-production-only, reversible channel SFU default-candidate gate.
- keep LiveKit fallback/default available.
- rerun the existing guarded matrix with the candidate gate enabled.

What cannot happen before production/multi-process/media infra:
- no production default switch.
- no product-facing broad default switch without a later decision.
- no LiveKit removal.
- no screen-share parity claim.
- no multi-process readiness claim while mediasoup/signaling state remains process-local.
- no production TURN/SFU infra assumptions without a separate runbook.

Recommended next segment:
- `channel-sfu-nonproduction-default-candidate-gate`

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
- guarded browser scripts skipped safely without their smoke env flags.
