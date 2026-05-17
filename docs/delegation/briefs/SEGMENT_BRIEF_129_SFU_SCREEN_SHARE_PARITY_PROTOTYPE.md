# SEGMENT BRIEF 129. SFU Screen-Share Parity Prototype

Branch:
- `wave/stage8-sfu-screen-share-parity-prototype`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-screen-share-parity-prototype`

## Goal

Implement the first non-production SFU screen-share parity prototype without a production rollout, product default switch, channel `VIDEO` default switch, private default switch, or weakening the LiveKit fallback.

## Scope Boundary

Changed:
- added source-aware mediasoup prototype producer metadata: `microphone`, `camera`, and `screen`.
- allowed camera video and screen-share video to coexist from the same participant.
- added client `getDisplayMedia` screen-share start/stop on the shared SFU adapter path.
- rendered remote screen-share video in a separate screen-share area instead of the camera grid.
- added guarded channel `VIDEO` screen-share smoke assertions behind an explicit env flag.

Preserved:
- channel `VIDEO` remains LiveKit by default unless the existing explicit non-production full SFU gate is used.
- channel `AUDIO` pilot behavior remains scoped to its existing gates.
- ordinary private `?video=true` remains LiveKit/default.
- LiveKit fallback/default was not removed or weakened.
- no production media infra/env/nginx/firewall/deploy changes were made.
- no Stage 6/Postgres production migration work was touched.

## Implementation

Backend/API:
- `ProduceMediasoupPrototypeBody` now accepts `source?: microphone | camera | screen`.
- `LocalMediasoupProducerMetadata` and discovery metadata now include `source`.
- producer discovery dedupes by `participantSessionId + kind + source`, not only participant and kind.
- screen-share policy MVP is `latest screen share wins`: when a new `screen` producer is created in a room, existing room screen producers are closed before the new one is published.
- stale session cleanup, explicit producer close, producer paused/resumed signaling, and producer closed signaling continue to use the same scoped room/session checks.

SDK/client adapter:
- `ProduceMediasoupPrototypeRequest` and producer discovery/event metadata now carry `source`.
- `SfuClientAdapter.produce(...)` can publish with a track source.
- camera/microphone controls pause/resume only their matching source, so stopping camera does not pause a screen-share producer.
- `SfuClientAdapter.closeProducer(...)` can close a single producer for manual screen-share stop.

UI/runtime:
- `SfuPrivateCallAdapter` now exposes a screen-share control on video-enabled SFU rooms.
- start uses `navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })`.
- screen share publishes as a separate video producer with `source=screen`.
- manual stop, browser track `ended`, Restart, Leave, route change/unmount, and stale session cleanup are covered by the existing producer/session lifecycle.
- remote screen-share render is separate from camera tiles.
- local screen-share preview is shown while sharing.

## Smoke / Review Status

Direct screen-share result:
- `review`

Reason:
- guarded smoke support was added behind `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1`.
- the standard browser test command remains safe and skips without smoke env flags.
- a live headed/local screen-capture run still needs a local web/API profile and browser screen-capture support enabled through `PLAYWRIGHT_SCREEN_CAPTURE=1`.
- no full screen-share parity pass is claimed until that guarded/manual run proves start, remote render, stop, restart, and leave cleanup.

Recommended guarded smoke profile:
- `PLAYWRIGHT_SCREEN_CAPTURE=1`
- `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- `CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1`
- local API/web ports matching the running dev profile.

## Cleanup Behavior

Expected cleanup:
- manual Stop screen share closes the scoped screen producer and stops the local display track.
- browser display-track `ended` triggers the same stop path.
- Restart and Leave close the adapter/session and stop the display track.
- route change/unmount uses the existing control-plane leave cleanup.
- backend stale-session cleanup closes abandoned screen producers together with other session producers.

## Regression Status

Expected preservation:
- channel `AUDIO` pilot remains unchanged and still has LiveKit rollback.
- existing channel `VIDEO` explicit SFU gate continues to publish/consume camera audio+video.
- private SFU can naturally use the shared adapter screen-share control when explicitly gated, but private default remains LiveKit.
- ordinary channel `VIDEO`, ordinary channel `AUDIO`, ordinary private `?video=true`, and production remain LiveKit/default.

## Remaining Blockers

- direct screen-share guarded/manual proof is still required before claiming SFU screen-share parity pass.
- TURN screen-share was not in this prototype result and should remain review/deferred until direct is proven.
- production readiness remains blocked by process-local mediasoup/signaling state and missing production media infra/runbook/monitoring/rollback.
- broader channel `VIDEO` or private default decisions remain blocked until screen-share parity is proven or explicitly excluded by a later product decision.

## Recommended Next Segment

- `sfu-screen-share-guarded-browser-smoke-rerun`

Expected shape:
- run the headed/local screen-capture smoke profile.
- classify direct screen-share as `pass`, `review`, or `blocked`.
- if direct passes, optionally add TURN screen-share smoke/review.
- keep LiveKit fallback/default and all production/default gates unchanged.

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
- all standard verification commands passed.
- guarded browser scripts skipped safely without smoke env flags in the standard command set.
- direct screen-share guarded/manual proof remains `review` until the screen-capture smoke profile is run.
