# SEGMENT BRIEF 075. Media Stack Technology Decision

Branch:
- `wave/stage7-media-stack-technology-decision`

Segment:
- `media-stack-technology-decision`

## Goal

Document the Stage 7 media technology decision before runtime inventory and implementation planning.

## Result

Target stack is fixed as:

- `mediasoup` for SFU/media routing
- `coturn` for TURN/STUN/NAT traversal
- `apps/api` for project-owned signaling/control plane
- `packages/app-core` for vendor-neutral media contracts/events
- `packages/sdk` for client access
- web/desktop for local capture/render/UI orchestration only

Self-hosted LiveKit is explicitly not the target architecture. It remains only a possible temporary bridge if a no-subscription short-term path is ever needed.

The product interaction model is also fixed:

- Discord-like persistent server voice/video channels
- private direct calls
- future Zoom-like structured meetings/conferences
- future large-room/stage behavior through the same media engine

These modes must share one media control-plane. Differences belong in room scope and domain permissions, not separate media implementations.

## Explanation

`mediasoup` is for server-side media routing. It handles WebRTC transports and routes participant audio/video/screen-share streams through an SFU model, while the application owns rooms, permissions, signaling, and participant state.

`coturn` is for network traversal. It provides STUN/TURN so WebRTC can work through NAT, firewalls, mobile networks, corporate networks, and restrictive routers. It does not replace an SFU.

## Files Changed

- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_075_MEDIA_STACK_TECHNOLOGY_DECISION.md`

## Guardrails

No runtime code changed.

No dependencies added.

No LiveKit deletion.

No `MediaRoom` edits.

No production deploy/env/infra changes.

No Stage 6 production cutover work.

## Recommended Next Segment

Recommended next segment:
- `media-runtime-inventory`

Reason:
- the target media stack is now fixed, so the next step is to inventory current LiveKit runtime behavior before designing contracts and control-plane APIs.
