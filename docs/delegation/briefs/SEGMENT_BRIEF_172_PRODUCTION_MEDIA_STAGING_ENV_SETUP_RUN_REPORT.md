# Segment Brief 172: Production Media Staging Env Setup Run Report

Branch: `wave/stage9-production-media-staging-env-setup-run-report`
Segment: `production-media-staging-env-setup-run-report`
Date: 2026-06-04

## Goal

Run the operator-guided staging env/deploy setup on the separate staging VPS and record a redacted run report before any staging media smoke.

## Scope Guardrails

- Production VPS was not touched.
- Production `DATABASE_URL` was not used.
- No real secrets, private keys, passwords, generated TURN credentials, cookies, auth headers, or database URLs are recorded here.
- Real staging public IP remains outside repo docs.
- No production SFU/TURN/default gate was enabled.
- LiveKit fallback was not removed.
- Stage 6/Postgres production migration path was not changed.
- Direct/TURN media smoke was not run.

## Operator-Confirmed Source

- Source branch: `origin/core/reborn`
- Deployed commit: `1496b4dc071e1390ea07f2738c4ca32695d0c05b`
- Commit line: `1496b4d Merge pull request #128 from Peacemaker228/wave/stage9-production-media-staging-env-setup-run-report`
- App path: `/var/www/ax-connect-staging`

## Actions Performed

### Access And Bootstrap Continuity

- DNS for `staging.ax-connect.ru` resolved to the staging VPS.
- SSH as `deploy` via `staging.ax-connect.ru` passed with the operator-owned SSH key.
- Existing bootstrap guardrails remained in place: root/password SSH disabled, UFW active, Docker/PM2/Nginx available, no reboot required.

### Layout And Source

- Created/verified:
  - `/var/www/ax-connect-staging`
  - `/etc/ax-connect-staging`
  - `/opt/ax-connect-staging/postgres`
  - `/opt/ax-connect-staging/coturn`
  - `/var/log/ax-connect-staging`
- Cloned `https://github.com/Peacemaker228/connect.git`.
- Checked out detached `HEAD` at the operator-approved commit.

### Staging Database

- Created server-local `/etc/ax-connect-staging/postgres.env` with secret values redacted and file mode `root:deploy 640`.
- Started Docker Postgres:
  - container: `ax-connect-staging-postgres`
  - image: `postgres:16-alpine`
  - listener: `127.0.0.1:5433->5432/tcp`
  - health: `healthy`
- `pg_isready` passed inside the Postgres container.
- Schema migrations were not run.

### Env Files

- Created server-local env files:
  - `/etc/ax-connect-staging/web.env`
  - `/etc/ax-connect-staging/api.env`
  - `/etc/ax-connect-staging/coturn.env`
- File mode for server env files: `root:deploy 640`.
- Required app/API presence checks passed for:
  - `NODE_ENV`
  - `PORT`
  - `NEXT_PUBLIC_API_URL`
  - `API_PORT`
  - `DATABASE_URL`
  - `AUTH_TOKEN_SECRET`
  - `API_CORS_ALLOWED_ORIGINS`
  - `MEDIA_TURN_URLS`
  - `MEDIA_TURN_STATIC_AUTH_SECRET`
  - `MEDIA_SFU_LISTEN_IP`
  - `MEDIA_SFU_ANNOUNCED_ADDRESS`
- Missing before smoke:
  - `NEXT_PUBLIC_LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `STORAGE_BUCKET`
  - `STORAGE_S3_ENDPOINT`

### Install And Build

- `bun install --frozen-lockfile` initially failed because `mediasoup` had to build its worker locally and Ubuntu lacked `python3-pip`.
- Installed `python3-pip`; reran `bun install --frozen-lockfile` successfully.
- `bun x prisma generate` passed.
- `bun run build:api` passed.
- `bun run build:web` passed.
- No migrations were run.
- API build entrypoint for this commit is `apps/api/dist/apps/api/src/main.js`.

### PM2

- Started PM2 processes:
  - `ax-connect-staging-api`
  - `ax-connect-staging-web`
- API command shape:
  - source `/etc/ax-connect-staging/api.env`
  - run `node apps/api/dist/apps/api/src/main.js`
  - port `4000`
- Web command shape:
  - source `/etc/ax-connect-staging/web.env`
  - run `bun next start -p 3001`
  - port `3001`
- PM2 status: both staging processes online.
- PM2 startup was enabled for user `deploy`; process list was saved.
- API health through localhost passed.
- Web localhost returned the expected auth redirect.

### Nginx And TLS

- Created Nginx staging site:
  - `/etc/nginx/sites-available/ax-connect-staging`
  - `/etc/nginx/sites-enabled/ax-connect-staging`
- Proxy shape:
  - `/` -> `127.0.0.1:3001`
  - `/api/` -> `127.0.0.1:4000`
  - `/socket.io/` -> `127.0.0.1:4000` with WebSocket headers
- Operator approved opening `80/tcp` for Let's Encrypt HTTP-01 and renewal.
- Installed certbot and Nginx plugin.
- Issued TLS for `staging.ax-connect.ru`.
- Certificate expiry observed: 2026-09-02.
- HTTPS API health passed.
- HTTPS web returned expected `307` redirect to `/sign-in`.
- UFW active with `80/tcp`, `443/tcp`, SSH, coturn candidate ports, and mediasoup RTC candidate range.

### Coturn Config

- Prepared `/opt/ax-connect-staging/coturn/docker-compose.yml`.
- Created `/etc/ax-connect-staging/coturn.env` with secret values redacted.
- Added matching `MEDIA_TURN_STATIC_AUTH_SECRET` presence to `/etc/ax-connect-staging/api.env`.
- `docker compose config` passed.
- Coturn container was not started.
- TURN/media smoke was not run.

### Health Checks

- PM2: web/API online.
- HTTPS API: health returned `status: ok`, `service: apps/api`.
- HTTPS web: `307` redirect to `/sign-in`.
- Nginx: config test passed; service active.
- Postgres: container healthy; `pg_isready` passed.
- Coturn: compose config passed; container not running.
- Mediasoup health unauthenticated check returned HTTP `401`, confirming auth gate; authenticated media health was not run.
- Direct media smoke: not run.
- TURN media smoke: not run.
- LiveKit rollback query smoke: not run.

## Readiness Classification

- staging source checkout: `pass`
- staging DB container: `pass / healthy`
- staging DB schema/migrations: `blocked / not run`
- server-local env files: `partial pass / required app/API and media names present; LiveKit and Storage missing`
- app/API build: `pass`
- PM2 web/API: `pass / online`
- Nginx staging site: `pass`
- TLS: `pass`
- coturn config: `pass / prepared only`
- coturn process: `blocked / not started`
- LiveKit rollback availability: `blocked / env missing`
- Storage upload readiness: `blocked / env missing`
- mediasoup health: `blocked for smoke / auth required and authenticated smoke not run`
- staging direct/TURN media smoke: `blocked / not run in this segment`
- production rollout/default: `blocked`

## Remaining Blockers Before Staging Smoke

- Fill or provide a separate staging LiveKit rollback source outside repo docs:
  - `NEXT_PUBLIC_LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- Fill or explicitly defer staging Storage values outside repo docs.
- Decide and apply the staging Postgres schema path without touching Stage 6 production migration.
- Start coturn container only in an approved follow-up run and verify no-open-relay behavior without exposing credentials.
- Run authenticated app/session checks using staging-only cookies and secrets.
- Run authenticated mediasoup health check.
- Run direct and TURN media smoke only in the next staging smoke run-report segment.
- Keep LiveKit fallback available and prove rollback query behavior before any production canary.

## Recommended Next Segment

Recommended next segment: `production-media-staging-smoke-run-report`, after the operator resolves the remaining staging-only LiveKit, Storage, DB schema, coturn process, and authenticated session gates.
