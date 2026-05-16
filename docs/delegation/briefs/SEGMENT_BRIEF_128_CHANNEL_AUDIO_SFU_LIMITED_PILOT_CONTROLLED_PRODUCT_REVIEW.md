# SEGMENT BRIEF 128. Channel Audio SFU Limited Pilot Controlled Product Review

Branch:
- `wave/stage8-channel-audio-sfu-limited-pilot-controlled-product-review`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-audio-sfu-limited-pilot-controlled-product-review`

## Goal

Prepare and record a controlled non-production product review for the channel `AUDIO` SFU limited pilot.

This segment does not perform a production rollout, broad default switch, channel `VIDEO` switch, or private-call switch.

## Scope Boundary

Changed:
- added the operator checklist for controlled channel `AUDIO` SFU pilot review.
- classified direct/TURN/manual quality review status using the existing Segment 124-127 evidence.
- updated Wave 33 and Stage status.

Preserved:
- no runtime code changed.
- no production default was enabled.
- no channel `VIDEO` default switch was made.
- no private default switch was made.
- LiveKit fallback/default was not removed or weakened.
- no screen-share parity claim was made.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6/Postgres production migration changes were made.

## Review Environment

Required local/dev profile:
- API: `http://localhost:4000/api`
- web: `http://localhost:3001`
- database: local development database, normally `connect-postgres-validation` on `localhost:5433`
- pilot env: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`
- optional TURN env:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=<local-only secret>`
  - optional `LOCAL_TURN_TTL_SECONDS=<local ttl>`

Operational note:
- `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1` is a browser bundle flag. The web dev server must be restarted or the web bundle rebuilt after changing it.

## Operator Checklist

Preparation:
- confirm local API is running.
- confirm local web is running with `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`.
- confirm at least two authenticated users are available.
- confirm real microphone permission is available for each user/context.
- for TURN review, confirm local Docker coturn is running and local TURN env is present in the API process.

Direct channel `AUDIO` pilot:
- open a channel `AUDIO` route without SFU query parameters.
- confirm the page uses the channel `AUDIO` SFU pilot path, not LiveKit.
- confirm status reaches `connected`.
- confirm `Transport: direct`.
- confirm expected remote producer count is shown for other participants.
- confirm real microphone audio is heard in the other client.
- toggle mute/unmute and confirm remote audible state follows.
- click restart and confirm the session returns to `connected`.
- leave and rejoin, then confirm no stale remote producer inflation.
- close/reopen browser contexts and confirm health counters settle after cleanup.

Rollback:
- open the same channel `AUDIO` route with `?mediaProvider=livekit`.
- confirm the SFU adapter does not render.
- confirm the route uses the existing LiveKit fallback/default path.

Optional TURN channel `AUDIO` pilot:
- open the channel `AUDIO` route without SFU query parameters while forcing TURN through the smoke/review profile.
- confirm status reaches `connected`.
- confirm `Transport: turn`.
- confirm real microphone audio is heard in the other client.
- confirm local coturn logs show authenticated relay allocation/usage/cleanup.
- confirm leave/rejoin and cleanup still work.

Default preservation:
- confirm channel `VIDEO` without its full SFU gate remains LiveKit/default.
- confirm ordinary private `?video=true` remains LiveKit/default.
- confirm production is not part of this review.

## Review Result

Automated/local evidence:
- direct channel `AUDIO` pilot smoke: `pass` from Segment 124 and Segment 126.
- TURN channel `AUDIO` pilot smoke: `pass` from Segment 124 and Segment 126.
- stale cleanup / health counters settle: `pass` from Segment 126.
- private SFU regression after shared lifecycle changes: `pass` from Segment 126.
- LiveKit rollback/default preservation: `pass` from Segment 124 through Segment 127.

Manual/operator product review:
- status: `blocked / requires operator`
- reason: no operator manual review result was provided in this segment, so real microphone audio quality, subjective latency, permission UX, and human rollback confidence cannot be honestly marked pass.

Direct manual audio quality:
- status: `requires operator`

TURN manual audio quality:
- status: `requires operator`

Rollback manual confidence:
- status: `requires operator`

## Decision

Controlled product review status:
- `review / requires operator`

Interpretation:
- the limited channel `AUDIO` SFU pilot remains technically ready for controlled non-production product review.
- automated direct/TURN/cleanup/regression evidence is strong enough to start operator review.
- the product review itself is not complete until an operator performs the checklist and records pass/review/fail for real audio quality and UX.

## What Remains LiveKit

- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default.
- explicit LiveKit rollback for channel `AUDIO` remains available through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`.

## Remaining Blockers

- operator manual product review is not completed.
- subjective real microphone audio quality signoff is not completed.
- process-local mediasoup/signaling state remains a multi-process/production blocker.
- production TURN/SFU infra, runbook, monitoring, firewall/process management, and rollback procedure remain out of scope.
- SFU screen-share remains deferred for channel `VIDEO` and private parity.

## Recommended Next Segment

- `channel-audio-sfu-limited-pilot-operator-review-rerun`

Expected shape:
- run the checklist with two or more authenticated users.
- capture direct manual audio quality status.
- capture optional TURN manual audio quality status if local coturn is available.
- capture rollback confidence.
- keep production, channel `VIDEO`, private default, and LiveKit fallback unchanged.

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
