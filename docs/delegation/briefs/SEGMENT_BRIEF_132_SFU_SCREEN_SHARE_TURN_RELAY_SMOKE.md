# SEGMENT BRIEF 132. SFU Screen-Share TURN Relay Smoke

Branch:
- `wave/stage8-sfu-screen-share-turn-relay-smoke`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `sfu-screen-share-turn-relay-smoke`

## Goal

Close SFU screen-share over TURN as pass/review/blocked for channel `VIDEO` and explicit private SFU, without a production/default switch and without weakening LiveKit fallback.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_130_SFU_SCREEN_SHARE_GUARDED_BROWSER_SMOKE_RERUN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_131_SFU_SCREEN_SHARE_PRIVATE_REGRESSION_SMOKE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Implementation

Test-only stability changes:
- channel `VIDEO` screen-share smoke now gives the screen-share `Remote producers: +1` assertion the same `45_000ms` timeout used by other SFU signaling/render assertions.
- private SFU screen-share smoke now does the same for its `Remote producers: +1` assertion.

Reason:
- the remote screen tile can render before `remoteProducerIds` updates because the UI counter is set after `waitForRemoteTrackFlow`.
- direct path was fast enough; TURN path exposed the shorter default Playwright expect timeout.
- this does not weaken screen-share proof: local preview, remote screen render, producer count increase, stop cleanup, count recovery, Restart, Leave, and LiveKit/default assertions still run.

No runtime media route/default changes were made.

## Local TURN Runtime

Docker:
- Docker Desktop was started locally.
- `connect-coturn-local` was started from `infra/coturn/docker-compose.local.yml`.

Final local-only coturn runtime env:
- `LOCAL_TURN_STATIC_AUTH_SECRET=replace-with-random-local-secret`
- `LOCAL_TURN_RELAY_MIN_PORT=49160`
- `LOCAL_TURN_RELAY_MAX_PORT=49240`

Reason for expanded relay range:
- the first channel `VIDEO` screen-share TURN attempt with the default `49160-49170` range showed authenticated relay usage but also coturn `508 Cannot create socket / no available ports`.
- the container was recreated with the wider local-only relay range.
- no repo config or production infra was changed.

API env:
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=replace-with-random-local-secret`
- `LOCAL_TURN_TTL_SECONDS=600`
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`

Local services:
- API: `http://localhost:4000/api`
- Web: `http://localhost:3001`

## Result

Channel `VIDEO` SFU screen-share TURN smoke:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`

Observed:
- two authenticated channel `VIDEO` SFU users connected in `sfuTransport=turn` mode.
- user A started screen share and saw local screen preview.
- user B saw remote screen-share render/video.
- user B remote producer count grew by `+1`.
- Stop screen share removed the remote screen render.
- remote producer count returned to baseline.
- Restart and Leave/rejoin cleanup remained pass.
- ordinary channel `VIDEO` without the full gate remained LiveKit/default.
- channel `AUDIO` without the video gate remained LiveKit/default.

Private explicit SFU screen-share TURN smoke:
- `pass`

Command:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_SCREEN_SHARE=1 PRIVATE_SFU_SMOKE_TRANSPORT=turn PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Observed:
- two authenticated explicit private SFU users connected in `sfuTransport=turn` mode.
- user A started screen share and saw local screen preview.
- user B saw remote screen-share render/video.
- user B remote producer count grew by `+1`.
- Stop screen share removed the remote screen render.
- remote producer count returned to baseline.
- Restart remained pass.
- Leave redirect remained `/servers/:serverId/conversations/:memberId`.
- ordinary private `?video=true` remained LiveKit/default.

Coturn logs:
- authenticated `ALLOCATE processed, success` entries were observed.
- authenticated `CREATE_PERMISSION processed, success` entries were observed.
- relay usage and peer usage entries were observed for peer `192.168.0.16`.
- after widening the local-only relay range, the passing runs did not show the earlier `508 Cannot create socket` port exhaustion blocker.

## Handoff

Screen-share TURN result:
- channel `VIDEO`: `pass`.
- explicit private SFU: `pass`.

Cleanup behavior:
- Stop screen share removes remote render and restores producer count.
- Restart and Leave/rejoin or Leave redirect remained pass in the guarded smokes.

Regression/default preservation:
- ordinary channel `VIDEO` remains LiveKit/default without the full explicit SFU gate.
- ordinary channel `AUDIO` remains LiveKit/default without its gated/pilot SFU path.
- ordinary private `?video=true` remains LiveKit/default.
- no production/default switch was made.
- LiveKit fallback/default was not removed or weakened.

Remaining blockers before broader/default decisions:
- process-local mediasoup/signaling state remains a production/multi-process blocker.
- production TURN/SFU infra, firewall, monitoring, runbook, and rollback remain out of scope.
- subjective screen-share UX/product review may still be required before product-facing video/private default decisions.

Recommended next segment:
- `sfu-screen-share-readiness-decision`

Suggested shape:
- classify screen-share parity across channel `VIDEO` and explicit private SFU after direct and TURN proof.
- decide whether channel `VIDEO`/private default readiness can move to a controlled non-production review, while keeping production blocked and LiveKit fallback intact.

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

Guarded TURN smoke:
- `PLAYWRIGHT_SCREEN_CAPTURE=1 CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2 CHANNEL_VIDEO_SFU_SMOKE_SCREEN_SHARE=1 CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT=3001 CHANNEL_VIDEO_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:channel-video-sfu`
- `PLAYWRIGHT_SCREEN_CAPTURE=1 PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_SCREEN_SHARE=1 PRIVATE_SFU_SMOKE_TRANSPORT=turn PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_API_PORT=4000 bun.cmd run test:browser:private-sfu`

Results:
- all standard verification commands passed.
- standard browser smoke commands skipped safely without env flags.
- both guarded TURN screen-share smoke commands passed.
