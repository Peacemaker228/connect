# Segment Brief 175: Production Media Staging Pre-Smoke Readiness Rerun

Branch: `wave/stage9-production-media-staging-pre-smoke-readiness-rerun`
Segment: `production-media-staging-pre-smoke-readiness-rerun`
Date: 2026-06-05

## Goal

Deploy the Segment 174 staging-safe server-only SFU gate to the separate staging VPS, enable it only in the staging API env, restart API, and rerun pre-smoke readiness checks through authenticated mediasoup health.

## Scope Guardrails

- Production VPS was not touched.
- Production env was not changed.
- `MEDIA_ENABLE_STAGING_SFU` was added only to the staging server-local API env.
- `MEDIA_ENABLE_STAGING_SFU` was confirmed absent from the staging web env.
- No real secrets, private keys, passwords, database URLs, generated TURN credentials, cookies, auth headers, or env values are recorded here.
- No full direct/TURN media smoke was run.
- No production SFU/default gate was enabled.
- LiveKit fallback was not removed.
- Stage 6/Postgres production migration path was not changed.

## Deployed Revision

- Deployed commit: `40dab370279a3d963c6e589201536bcfb65c09a9`
- Commit summary: `40dab37 Merge pull request #130 from Peacemaker228/wave/stage9-staging-safe-media-sfu-enable-gate`
- Staging repo path: `/var/www/ax-connect-staging`
- Staging API process: `ax-connect-staging-api`
- Staging web process: `ax-connect-staging-web`

## Actions Performed

### Baseline

- Confirmed staging was previously on `1496b4dc071e1390ea07f2738c4ca32695d0c05b`.
- PM2 web/API were online.
- HTTPS API health returned `status: ok`.
- Docker Postgres was healthy.
- Docker coturn was running.
- Nginx config test passed.
- Direct/TURN media smoke was not run.

### Deploy Segment 174 Gate

- Fetched `origin/core/reborn`.
- Checked out the merged Segment 174 commit in detached HEAD mode.
- Ran `bun install --frozen-lockfile`; no package changes were needed.
- Ran `bun x prisma generate`.
- Ran `bun run build:api`.
- Did not run schema migrations.
- Did not rebuild web because the gate is server-only and not browser-visible.

### Staging API Env Gate

- Backed up the staging API env file on the server.
- Added `MEDIA_ENABLE_STAGING_SFU=1` to the staging server-local API env.
- Confirmed `MEDIA_ENABLE_STAGING_SFU=1` is present in staging API env.
- Confirmed `MEDIA_ENABLE_STAGING_SFU` is absent from staging web env.
- Did not print env file contents or values.

### API Restart

- Restarted `ax-connect-staging-api` with `--update-env`.
- Saved the PM2 process list.
- API logs showed normal route mapping and startup.
- HTTPS API health passed after restart.
- Web was not restarted because the change is server-only.

### Mediasoup Worker Artifact Fix

- First authenticated mediasoup health after enabling the gate returned:
  - HTTP `200`
  - `enabled=true`
  - `stagingSfuEnabled=true`
  - `status=failed`
  - reason class: missing `mediasoup-worker` executable
- This confirmed the gate worked, but the native mediasoup worker artifact was missing from the staging install.
- Rebuilt the mediasoup worker artifact by running the package postinstall in `node_modules/mediasoup`.
- Confirmed the expected worker binary path is present and executable.
- Restarted `ax-connect-staging-api` again.
- HTTPS API health passed after the worker rebuild.

### Authenticated Readiness Rerun

- Created a fresh staging-only test user/session.
- Auth session returned:
  - HTTP `200`
  - authenticated: `true`
  - strategy: `access-token`
  - profile present
  - user present
- Authenticated mediasoup health returned:
  - HTTP `200`
  - status: `ready`
  - enabled: `true`
  - worker pid present
  - router id present
  - router closed: `false`
  - router codec count: `3`
  - `runtimeConfig.sfu.stagingSfuEnabled=true`
  - `runtimeConfig.sfu.stagingSfuGateSource=MEDIA_ENABLE_STAGING_SFU`
  - TURN URLs configured
  - TURN static auth secret configured
  - SFU announced address configured
  - SFU RTC range status: `ready`
- Cookies, tokens, auth headers, generated TURN credentials, and secret env values were not printed.

### Remaining Readiness Checks

- PM2 web/API remained online.
- HTTPS API health passed.
- Nginx config test passed.
- Docker Postgres remained healthy.
- Docker coturn remained running and not restarting.
- LiveKit token path returned HTTP `200`; token presence was confirmed without printing the token.
- LiveKit public URL env presence remained available through server-local web env.
- Storage remains explicitly deferred for media-only pre-smoke readiness.
- Full direct/TURN media smoke was not run.

## Final Classification

- deployed Segment 174 code to staging: `pass`
- staging API env gate: `pass / MEDIA_ENABLE_STAGING_SFU=1`
- staging web env gate absence: `pass`
- PM2/API health: `pass`
- authenticated app/session: `pass`
- authenticated mediasoup health: `pass / ready`
- mediasoup worker artifact: `pass / rebuilt on staging`
- coturn readiness: `pass / running`
- LiveKit rollback token path: `pass`
- Storage: `deferred / accepted for media-only pre-smoke`
- full direct/TURN media smoke: `not run / forbidden in this segment`
- production VPS/env/defaults: `untouched`
- final classification: `pre-smoke readiness pass for staging media smoke entry`

## Remaining Blockers Before Full Staging Smoke

- Full direct/TURN media smoke has not been run yet.
- Storage upload smoke remains out of scope until staging storage env is filled or the smoke scope explicitly excludes upload.
- Process-local mediasoup/signaling state remains a production and multi-process blocker; staging pass does not authorize production rollout.
- Production monitoring, rollback drill, and production canary decision remain future work.

## Recommended Next Segment

Recommended next: `production-media-staging-smoke-run-report`.

Run it only on staging/non-production, keep LiveKit fallback available, do not touch production VPS, and do not enable production SFU/default gates.
