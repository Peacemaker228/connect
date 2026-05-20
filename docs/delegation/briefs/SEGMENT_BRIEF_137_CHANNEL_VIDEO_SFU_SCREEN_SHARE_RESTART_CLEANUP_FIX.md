# SEGMENT BRIEF 137. Channel VIDEO SFU Screen Share / Restart Cleanup Fix

Branch:
- `wave/stage8-channel-video-sfu-limited-pilot-soak-product-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-video-sfu-screen-share-restart-cleanup-fix`

## Goal

Fix operator-found channel `VIDEO` SFU pilot issues around screen-share policy, restart cleanup, and inflated remote producer UI state.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_136_CHANNEL_VIDEO_SFU_REMOTE_MEDIA_FLOW_FIX.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Operator Finding

- More than one participant could appear to share screen at the same time.
- After restarts/retries, `Remote producers` could remain inflated.
- A restarted participant could temporarily lose an existing remote screen-share.

## Decision

Current MVP policy remains:
- one active screen-share per room.
- latest screen-share wins.

Multiple concurrent screen-share is not accepted for this pilot.

## Implementation

Backend:
- screen producer cleanup now runs after the new screen producer is created and stored.
- this closes older room screen producers while preserving the newly-created one, avoiding the previous race where two near-simultaneous screen-share starts could both survive.

Client:
- Restart now waits for the previous `SfuClientAdapter.close()` backend cleanup before publishing new producers.
- `SfuClientAdapter.close()` now awaits backend consumer/producer close requests instead of fire-and-forget cleanup only.
- producer snapshots now reconcile local consumed producer state and remove stale producers if a close event was missed during reconnect/restart.
- if the backend closes the local screen producer because another participant became the latest active screen-share owner, the client now stops its local display track and removes `You are sharing your screen`.
- the UI now shows `Remote tracks` plus an `audio/camera/screen` breakdown instead of the misleading `Remote producers` label.

Smoke coverage:
- channel `VIDEO` screen-share smoke now covers takeover: user A shares, user B starts sharing, A's local screen-share UI disappears, A sees B's remote screen-share, and B does not see A's old remote screen-share.
- browser smoke assertions were updated to the new `Remote tracks` wording.

## Guardrails

Unchanged:
- production remains blocked.
- LiveKit fallback/default remains preserved.
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` pilot behavior is not intentionally changed.
- production TURN/SFU infra remains out of scope.

## Status

Implementation:
- `done`

Verification:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser:channel-video-sfu` without env safely skipped

Manual rerun:
- `required`
