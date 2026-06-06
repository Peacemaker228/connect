# Segment Brief 178: Production Media Staging Smoke Run Report Rerun

Branch: `wave/stage9-production-media-staging-smoke-run-report-rerun`
Segment: `production-media-staging-smoke-run-report-rerun`
Date: 2026-06-06

## Goal

Deploy the staging-safe web SFU smoke gate to the separate staging VPS, enable it only in staging web env, rebuild web, and run the first real staging media smoke with redacted evidence.

## Scope Guardrails

- Production VPS was not touched.
- Production env was not changed.
- No production SFU/default gate was enabled.
- No smoke gate was added to production env.
- LiveKit fallback was not removed.
- No real secrets, private keys, passwords, database URLs, generated TURN credentials, cookies, auth headers, or env values are recorded here.
- Storage upload smoke was not run because staging storage env remains deferred.
- Stage 6/Postgres production migration path was not changed.
- Runtime bugs were not fixed in this segment.

## Deployed Revision

- Deployed commit: `d756894f322d2bd355233a00143810755b401039`
- Commit summary: `d756894 Merge pull request #131 from Peacemaker228/wave/stage9-staging-safe-web-sfu-smoke-gate`
- Staging repo path: `/var/www/ax-connect-staging`
- Staging API process: `ax-connect-staging-api`
- Staging web process: `ax-connect-staging-web`

## Gate Deployment

Operator-guided staging deploy/update completed:

- Fetched `origin/core/reborn`.
- Checked out the merged Segment 177 commit in detached HEAD mode.
- Confirmed `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE` code presence.
- Confirmed `MEDIA_ENABLE_STAGING_SFU=1` remains present in staging API env.
- Confirmed `MEDIA_ENABLE_STAGING_SFU` remains absent from staging web env.
- Added `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE=1` only to staging web env.
- Confirmed `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE` remains absent from staging API env.
- Ran `bun install --frozen-lockfile`; no package changes were needed.
- Rebuilt web with staging web env loaded.
- Restarted `ax-connect-staging-web` and saved the PM2 process list.
- API was not restarted and no schema migration was run.

## Post-Deploy Readiness

Post-deploy readiness passed before media smoke:

- Fresh staging-only test session was created.
- Auth session returned authenticated with `access-token` strategy.
- HTTPS API health returned `status: ok`.
- `/media/sfu-smoke` returned HTTP `200` for the authenticated session.
- Authenticated mediasoup health returned:
  - HTTP `200`
  - status: `ready`
  - enabled: `true`
  - worker pid present
  - router id present
  - router closed: `false`
  - router codec count: `3`
  - active room count: `0`
  - active transport count: `0`
  - active producer count: `0`
  - active consumer count: `0`
  - runtime staging SFU enabled: `true`
  - TURN URLs configured
  - TURN secret configured
  - SFU announced address configured
  - SFU RTC range status: `ready`
- LiveKit token path returned HTTP `200`; token presence was confirmed without printing the token.
- Docker coturn was running and not restarting.

## Smoke Evidence

### A. Smoke Harness Direct

Browser harness: `https://staging.ax-connect.ru/media/sfu-smoke`

Result:

- mode: `direct`
- status: `pass`
- health: `pass`
- send transport creation: `pass`
- recv transport creation: `pass`
- local synthetic audio produce: `pass`
- consumer metadata creation: `pass`
- remote track consume: `pass`
- remote track state: `live`
- transport/producer/consumer identifiers were present but are not recorded here.

Classification: `pass`.

### B. Smoke Harness TURN

Browser harness TURN run result:

- mode: `turn`
- status: `fail`
- health: `pass`
- send transport creation: `pass`
- recv transport creation: `pass`
- local synthetic audio produce: `pass`
- consumer metadata creation: `pass`
- remote track consume: `fail`
- failure class: `remote track stayed muted after consume`
- transport/producer/consumer identifiers were present but are not recorded here.

Classification: `fail / TURN media flow blocker`.

### C. Manual Private/Channel Smoke

Manual private SFU, channel `AUDIO`, channel `VIDEO`, screen-share, route-away/back, Restart, Leave/rejoin, and manual TURN relay smoke were not run.

Reason: the TURN harness failed and cleanup did not converge fully after Stop/Reset, so the segment stopped instead of continuing with broader manual smoke.

## Cleanup / Post-Failure Health

After browser Stop/Reset:

- mediasoup health returned HTTP `200`.
- status remained `ready`.
- enabled remained `true`.
- active room count: `0`.
- active transport count: `14`.
- active producer count: `1`.
- active consumer count: `1`.
- coturn container was running and not restarting.
- redacted coturn logs showed authenticated allocation activity and allocation count returning to `0` after the TURN run.
- no generated TURN credentials, cookies, auth headers, secrets, or env values were printed.

Cleanup classification: `block / mediasoup resources did not converge to zero`.

## LiveKit Rollback

LiveKit token path was verified before smoke and returned HTTP `200` with token presence confirmed without printing the token.

Explicit rollback route checks after the TURN failure were not run because the segment stopped on the TURN/cleanup blocker. LiveKit fallback remains configured and must be rechecked in the follow-up fix/rerun segment.

## Scenario Matrix

| Scenario | Result | Notes |
| --- | --- | --- |
| Web smoke gate deploy | pass | Staging web env only; web rebuilt and restarted. |
| API health | pass | HTTPS health returned `status: ok`. |
| Authenticated session | pass | Fresh staging-only session authenticated. |
| Mediasoup pre-smoke health | pass | Status `ready`, worker/router present, counters initially zero. |
| Smoke harness direct | pass | Synthetic audio produce/consume completed; remote track `live`. |
| Smoke harness TURN | fail | Remote track stayed muted after consume. |
| Direct private SFU manual | not run | Stopped after TURN blocker. |
| Direct channel `AUDIO` manual | not run | Stopped after TURN blocker. |
| Direct channel `VIDEO` manual | not run | Stopped after TURN blocker. |
| Screen-share | not run | Stopped after TURN blocker. |
| TURN relay private/channel manual | not run | Harness TURN failed first. |
| Cleanup convergence | block | Active transports/producers/consumers did not converge to zero. |
| LiveKit token path | pass | Token presence confirmed before smoke; token not printed. |
| LiveKit rollback query routes | not run | Deferred after TURN/cleanup blocker. |

## Final Classification

- staging web smoke gate: `pass`
- staging API gate: `pass`
- pre-smoke health: `pass`
- smoke harness direct: `pass`
- smoke harness TURN: `fail`
- cleanup convergence: `block`
- full manual private/channel/TURN smoke: `not run`
- production VPS/env/defaults: `untouched`
- final classification: `partial pass / blocked by TURN media flow and cleanup non-convergence`

## Blockers Before Production Canary

- TURN relay media flow fails in the browser harness with remote track muted after consume.
- Mediasoup cleanup did not converge after failed TURN run; active transports/producers/consumers remained non-zero.
- Manual private/channel/video/screen-share smoke has not run.
- LiveKit rollback query route checks must be rerun after the focused fix.
- Process-local mediasoup/signaling state remains a production and multi-process blocker.
- No production rollback drill, monitoring, or production-like soak has passed.

## Recommended Next Segment

Recommended next: focused fix segment for staging TURN relay consume and cleanup convergence.

Suggested name: `staging-media-turn-relay-consume-cleanup-fix`.

After the fix, rerun `production-media-staging-smoke-run-report-rerun` from the post-deploy health gate.
