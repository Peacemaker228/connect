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
- recorded operator direct-channel observations and a scoped runtime follow-up fix for mute/route cleanup/speaking visibility.
- updated Wave 33 and Stage status.

Preserved:
- no production default was enabled.
- no channel `VIDEO` default switch was made.
- no private default switch was made.
- LiveKit fallback/default was not removed or weakened.
- no screen-share parity claim was made.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6/Postgres production migration changes were made.

Scoped runtime follow-up:
- after the initial checklist, operator review found unreliable mute behavior and likely continued audio after channel/server navigation.
- local mute now also pauses/resumes the mediasoup producer instead of only toggling `MediaStreamTrack.enabled`.
- leave now performs immediate local SFU cleanup before route navigation.
- SFU adapter instances are keyed by backend room/session to force clean remounts across channel/session changes.
- closed remote audio producers now remove their audio track from the remote audio stream.
- local/remote speaking indicators were added for review visibility.

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
- status: `review`
- evidence: two clients reached channel `AUDIO` SFU connected state in direct mode with `Remote producers: 1`, `Capture mode: real`, `Transport: direct`, and `Requested media: audio on, video off`.
- issue: operator reported unreliable mute/unmute behavior and likely continued audio after navigating away from the channel/server before the scoped runtime fix.
- follow-up: scoped fix added for producer pause/resume, immediate leave cleanup, route/session remounting, remote audio track removal, and speaking indicators.

Direct manual audio quality:
- status: `review`
- evidence: direct channel `AUDIO` connected with real capture; operator reported audio was present enough to notice mute/navigation issues.

TURN manual audio quality:
- status: `not tested / invalid run`
- reason: `?sfuTransport=turn` was tried without a running coturn container. Setting `LOCAL_TURN_URLS` and `LOCAL_TURN_STATIC_AUTH_SECRET` without coturn does not constitute a valid TURN relay review.

Rollback manual confidence:
- status: `requires operator`

## Decision

Controlled product review status:
- `review / scoped fix added`

Interpretation:
- the limited channel `AUDIO` SFU pilot remains technically ready for controlled non-production product review.
- automated direct/TURN/cleanup/regression evidence is strong enough to start operator review.
- the first operator review found direct connectivity, but mute/navigation cleanup required a scoped runtime fix before the checklist can be rerun for pass/fail.

## What Remains LiveKit

- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default.
- explicit LiveKit rollback for channel `AUDIO` remains available through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`.

## Remaining Blockers

- operator manual product review must be rerun after the scoped mute/cleanup/speaking-indicator fix.
- subjective real microphone audio quality signoff remains incomplete.
- optional TURN manual review remains incomplete because coturn was not running for the attempted TURN URL.
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
- verify mute/unmute reliability, navigation cleanup, and local/remote speaking indicators after the scoped fix.
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
