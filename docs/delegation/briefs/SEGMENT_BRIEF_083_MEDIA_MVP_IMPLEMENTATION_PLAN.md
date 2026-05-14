# SEGMENT BRIEF 083. Media MVP Implementation Plan

Branch:
- `wave/stage7-media-mvp-implementation-plan`

Segment:
- `media-mvp-implementation-plan`

## Goal

Turn Stage 7 media design into an ordered implementation roadmap for the future LiveKit replacement.

This segment is docs-only. It does not change runtime code, does not change `packages/app-core` or `packages/sdk` code, does not add `mediasoup`/`coturn` dependencies, does not add infra/env, does not delete LiveKit, does not fix the microphone/media symptom, and does not touch production deploy/cutover.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_080_MEDIA_CLIENT_BOUNDARY_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_082_LIVEKIT_ADAPTER_CONTAINMENT.md`

Docs added:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

Branch note:
- the requested branch was not present locally or on `origin`; this docs-only branch was created locally from the current Stage 7 LiveKit containment head.

## MVP Objective

MVP objective:
- deliver the first working project-owned media path without LiveKit for private/small-room flow
- keep current LiveKit runtime as fallback/bridge until parity passes
- preserve existing product behavior while moving media ownership behind app contracts, SDK commands, backend control-plane, and client provider adapters

MVP does not mean:
- production rollout
- distributed SFU
- full large-room/stage scalability
- removing LiveKit
- fixing the current microphone/media symptom as a side task

## Implementation Order

The implementation plan is documented in `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`.

Ordered implementation segments:
1. `app-core-media-contracts-code`
2. `sdk-media-command-surface`
3. `backend-livekit-adapter-containment`
4. `client-livekit-adapter-containment`
5. `livekit-parity-smoke`
6. `backend-media-control-plane-implementation`
7. `client-media-controller-boundary`
8. `local-mediasoup-dependency-prototype`
9. `local-coturn-turn-credential`
10. `browser-sfu-adapter`
11. `mvp-private-small-room-replacement`
12. `final-media-mvp-parity-load-smoke`

Implementation rule:
- these must be small scoped PRs, not one rewrite
- each segment must preserve the current LiveKit path unless it is the explicit controlled replacement segment

## Dependency Summary

Dependencies:
- app-core contracts must land before SDK/backend/client code consumes vendor-neutral media shapes
- SDK command surface depends on app-core contracts
- backend/client LiveKit containment can happen before mediasoup work so fallback is clean
- parity smoke depends on backend/client LiveKit containment
- backend control-plane depends on app-core contracts and SDK command shape
- client controller boundary depends on backend control-plane and client LiveKit adapter
- local mediasoup prototype depends on backend control-plane and SFU/TURN topology design
- local coturn/TURN credential work depends on local mediasoup prototype and security decisions
- mediasoup client adapter depends on backend provider access/signaling and local SFU/TURN smoke
- private/small-room replacement depends on the new backend/client provider path and preserved LiveKit fallback
- final parity/load smoke depends on controlled replacement

## Acceptance Criteria

Current behavior must remain intact until replacement is accepted:
- channel `AUDIO` starts microphone only
- channel `VIDEO` starts microphone and camera
- private video calls work
- private and channel leave redirects work
- preferred device fallback remains
- device permission/in-use/not-found errors remain user-visible
- mute/camera controls remain working
- screen-share has a plan and no unplanned regression
- reconnect baseline is visible and reviewable
- LiveKit fallback remains available until the new path passes parity

MVP replacement acceptance:
- first private/small-room non-LiveKit path works end-to-end locally
- backend owns room/session/permission/control decisions
- client consumes app media boundary instead of direct provider concepts
- provider adapters hide LiveKit and mediasoup details behind app-shaped contracts
- local direct and TURN-relayed paths can be smoked before production planning

## Rollback / Fallback

Rollback rule:
- current LiveKit runtime remains the fallback/bridge until new media path parity passes.

Fallback requirements:
- do not remove `/api/media/livekit-token` until a scoped deprecation segment
- use feature/route/runtime gates for the new path during replacement
- no media data migration should be required to fall back
- parity smoke must compare new behavior against current LiveKit behavior

## Production Rollout Boundary

Production media rollout is separate and later.

Out of scope for this implementation plan:
- production media service rollout
- production network/Nginx/systemd/Docker config
- production TURN secrets
- production monitoring/alerting rollout
- production LiveKit removal
- Stage 6 production database cutover

## Blockers Before First Code Segment

Before `app-core-media-contracts-code`:
- accept Segment 078 contract vocabulary as the code target
- choose app-core media contract file split
- keep provider access metadata transitional
- avoid LiveKit/mediasoup/coturn imports in app-core contracts
- keep first PR contracts-only

Before runtime replacement:
- LiveKit containment and parity smoke must pass
- backend auth/domain checks must be implemented in the control-plane path
- local SFU/TURN smoke must pass before production infra planning

## Stage 7 Planning Closure

Stage 7 planning can close after this segment with status:
- `planning complete / implementation queued`

Next active work:
- first code segment `app-core-media-contracts-code`

Reason:
- the stack decision, runtime inventory, contract design, backend control-plane design, client boundary design, SFU/TURN topology, LiveKit containment, and ordered MVP implementation plan are all documented.

## Verification Performed

Verification performed:
- `git diff --check` passed with Git CRLF warnings on touched docs.
- `rg -n "mediasoup|coturn" package.json bun.lock apps src packages infra --glob "*.ts" --glob "*.tsx" --glob "package.json" --glob "*.yml" --glob "*.yaml"` returned no matches, which is expected because this segment added no media runtime dependencies or infra.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
