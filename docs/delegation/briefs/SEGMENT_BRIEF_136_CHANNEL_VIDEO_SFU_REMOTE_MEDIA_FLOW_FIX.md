# SEGMENT BRIEF 136. Channel VIDEO SFU Remote Media Flow Fix

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-soak-product-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-remote-media-flow-fix`

## Goal

Fix the operator-found channel `VIDEO` SFU pilot regressions before any readiness/default decision.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_135_CHANNEL_VIDEO_SFU_LIMITED_PILOT_SOAK_PRODUCT_REVIEW.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Operator Finding

Manual channel `VIDEO` SFU review failed despite previous automated smoke pass:
- participants did not hear each other.
- remote camera video did not render; each participant only saw their own camera.
- remote screen-share rendered as an empty/black area.
- remote producer counts inflated or diverged across clients after restarts/retries.

This invalidates the Segment 135 manual/product review path until rerun.

## Implementation

Backend lifecycle:
- `MediaParticipantSessionService.createSession(...)` now returns superseded participant sessions for the same room identity.
- `MediaController.joinRoom(...)` immediately closes mediasoup resources for those superseded sessions.
- This prevents old session producers/transports/consumers from staying discoverable until TTL/sweeper cleanup.

Consumer flow:
- added backend consumer resume support at `POST /api/media/prototype/mediasoup/consumers/:consumerId/resume`.
- `SfuClientAdapter` now creates server consumers paused first, then creates the local mediasoup-client consumer, then resumes the backend consumer.
- This aligns the prototype with mediasoup guidance and avoids the known black-video / missing-keyframe race from unpaused server consumers.

Client render:
- SFU remote/local video, screen-share video, and remote audio elements now declare `autoPlay`.

## Guardrails

Unchanged:
- production default remains blocked.
- LiveKit fallback/default remains preserved.
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` pilot behavior is not intentionally changed.
- production TURN/SFU infra, runbooks, monitoring, and rollback remain out of scope.

## Status

Implementation:
- `done`

Verification:
- typecheck passed locally for web/root and API.

Manual rerun:
- `required`

The operator should rerun channel `VIDEO` SFU manual review after restarting API/web with this patch.

