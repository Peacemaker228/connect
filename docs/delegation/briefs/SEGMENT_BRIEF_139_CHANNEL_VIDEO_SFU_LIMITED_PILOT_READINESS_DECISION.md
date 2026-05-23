# SEGMENT BRIEF 139. Channel VIDEO SFU Limited Pilot Readiness Decision

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-readiness-decision`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-limited-pilot-readiness-decision`

## Goal

Record the readiness decision for the channel `VIDEO` SFU limited non-production product-default pilot after automated checks, operator review, and the follow-up fixes from Segments 136-138.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_134_CHANNEL_VIDEO_SFU_LIMITED_NONPRODUCTION_DEFAULT_PILOT.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_135_CHANNEL_VIDEO_SFU_LIMITED_PILOT_SOAK_PRODUCT_REVIEW.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_136_CHANNEL_VIDEO_SFU_REMOTE_MEDIA_FLOW_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_137_CHANNEL_VIDEO_SFU_SCREEN_SHARE_RESTART_CLEANUP_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_138_SFU_FAILED_RESTART_REJOIN_RECOVERY.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

Allowed:
- docs-only readiness decision.
- update the media MVP implementation plan and stage status.
- classify pass/review/blocked outcomes for the current pilot and remaining rollout surfaces.

Out of scope:
- runtime code changes.
- env default changes.
- production/default rollout.
- LiveKit removal.
- TURN/SFU infrastructure changes.
- Stage 6 or Postgres production migration docs.
- production readiness or multi-process readiness claims.

## Pilot Gate And Rollback

The channel `VIDEO` SFU product-default pilot remains limited to non-production and only opens when:

- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`

Without that gate, ordinary channel `VIDEO` remains LiveKit/default.

Explicit rollback to LiveKit remains preserved:

- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

These rollback paths must remain available until a later scoped decision removes them. This segment does not remove or weaken LiveKit.

## Evidence Summary

Segment 134:
- introduced the non-production channel `VIDEO` pilot gate.
- kept production blocked, the env off by default, private defaults unchanged, and LiveKit rollback preserved.
- guarded direct and local Docker coturn TURN pilot smokes passed.

Segment 135:
- automated pilot review passed for 2-user direct, 3-user direct, and 2-user TURN guarded smoke.
- the automated pass was useful but insufficient for readiness because no human/operator product review had validated real perceived remote audio/video, screen-share UX, layout, controls, restart, and rejoin behavior.

Segments 136-138 closed the operator-found bugs:
- remote media flow: remote audio, remote camera render, blank remote screen-share, and inflated/divergent producer state were addressed through superseded-session cleanup, safer paused-then-resumed consumer creation, and `autoPlay` media elements.
- screen-share/latest-wins/local track cleanup: latest screen-share wins is enforced, older room screen producers are closed after the new producer is stored, Restart waits for previous backend cleanup, stale producers are reconciled, and the previous local screen owner stops its display track after takeover.
- confusing debug label: `Remote producers` was replaced by `Remote tracks` with `audio/camera/screen` breakdown.
- restart/rejoin recovery: when SFU status is already `failed`, Restart now performs a fresh backend control-plane rejoin instead of retrying transports/producers against the invalid participant session.

Latest manual/operator confirmation:
- remote audio/video works.
- screen-share takeover works.
- `Remote tracks` label is understandable.
- failed -> Restart recovery through rejoin worked once.

TURN status:
- channel `VIDEO` screen-share TURN and channel `VIDEO` pilot TURN previously passed through local Docker coturn.
- explicit private SFU screen-share TURN also previously passed through local Docker coturn.
- this is local relay confidence only; production TURN is not ready.

## Readiness Classification

Channel `VIDEO` limited non-production product-default pilot:
- `pass for controlled local/product review`

Reason:
- automated guarded smoke passed before manual review.
- manual review then found real bugs, which were fixed in Segments 136-138.
- bounded operator confirmation now covers remote audio/video, screen-share takeover, readable remote track labeling, and one failed -> Restart recovery through rejoin.

Broader product-facing default:
- `review / hold`

Reason:
- confidence is based on bounded local/operator checks, not production-like long-soak.
- observability, long-soak criteria, and broader default risk controls are not yet documented.

Production default:
- `blocked`

Reason:
- mediasoup/signaling state remains process-local.
- production SFU/TURN infrastructure, firewall, monitoring, runbook, process management, and rollback plan are missing.

Private default:
- `hold`

Reason:
- ordinary private `?video=true` remains LiveKit/default.
- private default readiness requires its own scoped decision.

LiveKit fallback:
- `preserved`

Reason:
- the current LiveKit default/fallback and explicit rollback query paths remain required and unchanged.

Process-local mediasoup/signaling:
- `blocker before production/multi-process`

Long-soak:
- `review`

Reason:
- current confidence comes from bounded local and operator checks, not production-like soak.

## Decision

The channel `VIDEO` SFU limited non-production product-default pilot is ready to stay available for controlled local/product review under `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT=1`.

This is not a broader product-facing default approval, not a private default approval, not a production default approval, and not a multi-process readiness claim.

The next runtime step must not be production rollout. It must keep LiveKit fallback/default intact and leave production/default routes unchanged.

## Remaining Blockers

- process-local mediasoup/signaling state.
- no production SFU/TURN infrastructure.
- no production firewall/process-management/runbook/monitoring/rollback plan for the media stack.
- no production-like long-soak result for the channel `VIDEO` pilot.
- private SFU default requires a separate readiness decision.

## Recommended Next Segment

Preferred:
- `channel-video-sfu-limited-pilot-observability-and-long-soak-plan`

Alternative:
- `private-sfu-default-readiness-decision`

Not recommended next:
- production default rollout.
- LiveKit removal.

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
- all standard verification commands passed.
- standard browser smoke commands without guarded env flags skipped safely.
