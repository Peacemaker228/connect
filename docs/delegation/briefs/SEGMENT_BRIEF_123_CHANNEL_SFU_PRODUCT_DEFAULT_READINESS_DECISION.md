# SEGMENT BRIEF 123. Channel SFU Product Default Readiness Decision

Branch:
- `wave/stage8-channel-sfu-product-default-readiness-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-sfu-product-default-readiness-decision`

## Goal

Make a docs-only decision on product-facing channel SFU default readiness without changing runtime defaults.

## Scope Boundary

Changed:
- documented the final readiness matrix after explicit gates, candidate gates, direct/TURN reruns, physical camera signoff, offline/restore, and rollback checks.
- made separate readiness decisions for channel `AUDIO`, channel `VIDEO`, private calls, and production.
- updated Wave 33 and Stage 8 status.

Preserved:
- no runtime code changed.
- no SFU default was enabled.
- LiveKit fallback/default was not removed or weakened.
- ordinary private `?video=true` remains LiveKit by default.
- channel `AUDIO`/`VIDEO` remain LiveKit by default unless a later segment changes runtime.
- no production infra/env/nginx/firewall/deploy changes were made.
- no screen-share runtime implementation was added.
- process-local mediasoup/signaling state was not changed.

## Final Readiness Matrix

| Area | Direct | TURN | Offline/restore | Restart | Leave/rejoin | Physical device | Rollback/LiveKit | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Private SFU | pass | pass | pass | pass | pass | pass/review | pass | `review for default; keep LiveKit default` |
| Channel `AUDIO` SFU | pass, 5 users | pass, 3 users | pass, 5 users | pass | pass | real microphone path covered by candidate real-capture smoke and private/manual QA | pass | `pass for limited non-production product-default pilot` |
| Channel `VIDEO` SFU | pass, 5 users explicit; pass, 3 users candidate | pass, 3 users candidate; pass, 2-user physical TURN | pass, 5 users explicit | pass | pass | pass, Android 13 / Windows Virtual Camera | pass | `review/hold for product default because screen-share is deferred` |
| Candidate gate | pass | pass | pass for `AUDIO`; explicit/candidate restart coverage for `VIDEO` | pass | pass | channel `VIDEO` physical signoff exists | pass | `pass for local/dev confidence` |
| Screen-share parity | not implemented | not implemented | not implemented | not implemented | not implemented | not applicable | LiveKit covers default routes | `blocker for channel VIDEO/private product default parity` |
| Production/multi-process | local only | local coturn only | local only | local only | local only | local only | LiveKit rollback remains | `blocked` |

## Decisions

Channel `AUDIO` product default readiness:
- `pass for a limited non-production product-default pilot`
- Rationale: channel `AUDIO` has direct/TURN, 5-user direct load, offline/restore, restart, leave/rejoin, real-capture mode, stale cleanup, and explicit LiveKit rollback coverage. Screen-share is not part of channel `AUDIO` parity.
- Boundary: this is not production readiness and not approval to remove LiveKit fallback.

Channel `VIDEO` product default readiness:
- `review / hold for broad product default`
- Rationale: channel `VIDEO` has strong local/dev SFU media evidence, including physical camera and TURN, but default channel `VIDEO` currently benefits from LiveKit screen-share coverage. SFU screen-share is explicitly deferred, so a broad product-facing `VIDEO` default would be a parity regression.
- Allowed later path: a narrow non-production pilot may be considered only if it is explicitly scoped as no-screen-share parity and keeps an obvious LiveKit rollback.

Private default readiness:
- `review / keep LiveKit default`
- Rationale: private SFU is stable enough for gated local/dev use and regression coverage, but ordinary private `?video=true` still relies on LiveKit as the user-facing default and rollback path. Private default should not move before a separate private default decision that accounts for screen-share and product parity.

Production readiness:
- `block`
- Rationale: mediasoup/signaling state remains process-local, and production TURN/SFU infra, runbook, process management, monitoring, firewall rules, rollback procedure, and operational ownership are not implemented.

## What Can Happen Next

Recommended next runtime segment:
- `channel-audio-sfu-limited-nonproduction-default-pilot`

Allowed shape for that later segment:
- channel `AUDIO` only.
- non-production only.
- off by default unless an explicit product-default pilot env is enabled.
- retain explicit `?mediaProvider=livekit` rollback.
- keep channel `VIDEO`, private calls, and production defaults on LiveKit.
- run direct/TURN and rollback smoke again after the runtime pilot switch.

Alternative next work if product wants broader parity first:
- `sfu-screen-share-parity-design-and-prototype`

Alternative next work if production readiness is the target:
- `media-sfu-process-state-and-production-runbook-design`

## What Cannot Happen Yet

- no production SFU default.
- no channel `VIDEO` broad product default while SFU screen-share remains deferred.
- no private broad product default without a separate private default decision.
- no LiveKit removal.
- no production readiness claim while mediasoup/signaling state remains process-local.
- no production TURN/SFU infra assumption without a runbook and deployment plan.

## Handoff

Readiness decision:
- channel `AUDIO` product default: `pass for limited non-production pilot`
- channel `VIDEO` product default: `review/hold`
- private default: `review/hold`
- production default: `block`

Recommended next segment:
- `channel-audio-sfu-limited-nonproduction-default-pilot`

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
