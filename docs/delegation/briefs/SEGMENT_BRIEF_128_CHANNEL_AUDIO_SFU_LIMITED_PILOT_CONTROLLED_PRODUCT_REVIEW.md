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
- follow-up operator review confirmed the speaking indicator no longer stayed permanently silent after unmute, but audio could still continue after route navigation.
- root cause was broadened from button-level mute state to control-plane lifecycle ownership: ordinary route change cancelled React state updates but did not leave the previous backend participant session.
- `useMediaRoomController` now closes the active participant session on room change/unmount, including joins that resolve after cancellation.
- channel `AUDIO` smoke now includes a route-change/rejoin path that navigates away without pressing Leave and expects remote producer counts to drop before rejoin.
- subsequent operator review confirmed route-change cleanup was fixed, but mute still leaked audio before using the Restart button.
- root cause was broadened again from client track state to SFU producer ownership: mute must pause/resume the scoped backend mediasoup producer, not only toggle the browser `MediaStreamTrack` and client-side producer.
- backend local mediasoup producer pause/resume endpoints were added and wired through the SDK and SFU client adapter.
- channel `AUDIO` smoke now asserts backend producer `paused` state after mute/unmute through scoped producer discovery.
- operator screenshot also showed `Remote producers: 2` in a two-user channel, which means stale initial producer duplication could leave an unmuted producer outside the current adapter.
- SFU startup now treats async startup as run-owned resources: stale runs close their own adapter/tracks and cannot publish/keep producers after a newer run or cleanup.
- follow-up operator review confirmed muted audio was no longer audible, but remote speaking visibility still showed `Remote voice: speaking` after the remote participant muted.
- pause/resume now emits scoped `producer.paused` / `producer.resumed` signaling events, and remote speaking detection ignores paused remote audio tracks.
- page reload/pagehide now sends a keepalive control-plane leave so browser refresh is not dependent on ordinary async React cleanup.
- channel `AUDIO` smoke now includes page reload/rejoin coverage and checks that remote speaking becomes silent after remote mute.

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
- confirm backend producer `paused` changes to `true` on mute and `false` on unmute.
- click restart and confirm the session returns to `connected`.
- leave and rejoin, then confirm no stale remote producer inflation.
- navigate to another channel/server without pressing Leave and confirm the other client stops hearing audio.
- return to the channel `AUDIO` room and confirm the SFU session reconnects without stale producer inflation.
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
- status: `review / direct rerun materially improved`
- evidence: two clients reached channel `AUDIO` SFU connected state in direct mode with `Remote producers: 1`, `Capture mode: real`, `Transport: direct`, and `Requested media: audio on, video off`.
- issue: operator reported unreliable mute/unmute behavior and continued audio after navigating away from the channel/server before the scoped runtime fix.
- follow-up: first scoped fix added producer pause/resume, immediate leave cleanup, route/session remounting, remote audio track removal, and speaking indicators.
- follow-up rerun: permanent `Local voice: silent` after unmute was resolved, but navigation cleanup still failed.
- second scoped fix: control-plane ownership was corrected so route change/unmount closes the backend participant session, and the browser smoke now covers route-change/rejoin without pressing Leave.
- third scoped fix: mute now calls backend mediasoup producer pause/resume endpoints; browser smoke asserts the scoped producer paused state.
- fourth scoped fix: startup now prevents stale async initial runs from leaving duplicate producers after reload/React dev re-run races.
- fifth scoped fix: producer pause/resume signaling now drives remote speaking visibility, and pagehide keepalive leave covers browser refresh cleanup.
- review hardening: backend mediasoup `producer.pause()` / `producer.resume()` is awaited before logging, returning metadata, or publishing producer paused/resumed signaling.
- operator rerun after the scoped fixes confirmed muted audio was no longer audible, route-change cleanup no longer leaked audio, remote speaking delay was minor/acceptable, and the duplicate `Remote producers` issue was not reproduced.
- pagehide keepalive is treated as local/dev refresh cleanup support, not a production-grade unload guarantee; normal route change/unmount and explicit Leave remain the primary cleanup paths.

Direct manual audio quality:
- status: `review / acceptable for continued controlled review`
- evidence: direct channel `AUDIO` connected with real capture; after the scoped fixes, operator reported the remaining speaking-indicator delay as minor enough to continue.

TURN manual audio quality:
- status: `not tested / invalid run`
- reason: `?sfuTransport=turn` was tried without a running coturn container. Setting `LOCAL_TURN_URLS` and `LOCAL_TURN_STATIC_AUTH_SECRET` without coturn does not constitute a valid TURN relay review.

Rollback manual confidence:
- status: `pass / operator confirmed`
- evidence: operator confirmed that opening the channel `AUDIO` route with `?mediaProvider=livekit` disables the SFU adapter and returns the route to the LiveKit fallback/default path while the channel `AUDIO` SFU pilot env is enabled.

## Decision

Controlled product review status:
- `review / direct operator rerun improved after scoped fixes`

Interpretation:
- the limited channel `AUDIO` SFU pilot remains technically ready for controlled non-production product review.
- automated direct/TURN/cleanup/regression evidence is strong enough to start operator review.
- the first operator review found direct connectivity, then mute/navigation/speaking cleanup issues; scoped fixes were added and the latest operator rerun no longer reproduced the audio leak or duplicate-producer issue.

## What Remains LiveKit

- channel `VIDEO` remains LiveKit by default.
- ordinary private `?video=true` remains LiveKit by default.
- production remains LiveKit/default.
- explicit LiveKit rollback for channel `AUDIO` remains available through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`.

## Remaining Blockers

- full operator manual product review remains `review`, because optional TURN and broader permission/audio-quality signoff are intentionally not closed in the same final manual pass.
- subjective real microphone audio quality signoff remains incomplete beyond the latest direct two-user observation.
- page refresh cleanup remains `review`: pagehide keepalive is useful for local/dev reload cleanup, but not a production-grade unload guarantee.
- optional TURN manual review remains incomplete because coturn was not running for the attempted TURN URL; this can stay deferred for now, but it must be closed as `pass` or explicit `review` before any broader/default decision.
- process-local mediasoup/signaling state remains a multi-process/production blocker.
- production TURN/SFU infra, runbook, monitoring, firewall/process management, and rollback procedure remain out of scope.
- SFU screen-share remains deferred for channel `VIDEO` and private parity, and is now the next scoped parity gap to address.

## Recommended Next Segment

- `sfu-screen-share-parity-prototype`

Expected shape:
- implement the first non-production SFU screen-share parity prototype behind explicit gates.
- add source-aware screen producer metadata and cleanup.
- prove direct screen-share start/stop/remote render in guarded smoke where browser automation supports it.
- keep optional TURN screen-share as review/deferred unless local coturn is explicitly run in this segment.
- keep production, default channel `VIDEO`, private default, channel `AUDIO` pilot, and LiveKit fallback unchanged.

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
- guarded browser scripts skipped safely without smoke env flags in the standard command set.
- additional guarded channel `AUDIO` pilot smoke was run locally after the scoped fixes with cleanup/mute/rejoin assertions and passed.
