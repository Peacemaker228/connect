# Segment 171. Production Media Staging Env Setup Plan

Branch: `wave/stage9-production-media-staging-env-setup-plan`

## Goal

Prepare an operator-facing staging env/deploy setup plan after the successful separate staging VPS bootstrap and before any real deploy or smoke run.

This is docs-only. It does not connect to the VPS, does not deploy app/API, does not create real env files, does not start PM2/Nginx/coturn/media services, does not run migrations, does not run smoke, does not change production, does not enable SFU/TURN/default gates, and does not remove LiveKit.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_168_PRODUCTION_MEDIA_STAGING_VPS_OPERATOR_INPUTS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_169_PRODUCTION_STAGING_VPS_BOOTSTRAP_BRIEF.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_170_PRODUCTION_STAGING_VPS_BOOTSTRAP_RUN_REPORT.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/ax-connect_runbook.md`

## Scope

Allowed:
- document staging repo checkout/deploy layout
- document PM2 process names for web and API
- document app/API ports
- document Nginx staging site and TLS plan for `staging.ax-connect.ru`
- document env inventory without values
- document staging database decision/options
- document coturn Docker config plan without secret values
- document `MEDIA_TURN_*` / `MEDIA_SFU_*` mapping
- document LiveKit rollback env/check
- document smoke readiness gates

Forbidden:
- connect to the VPS
- execute deploy
- create real `.env` files
- write real IPs, passwords, private keys, secret values, TURN credentials, cookies, or auth headers
- start coturn, app, API, PM2 processes, or media workers
- change runtime code
- change the production VPS
- enable production SFU/TURN/default gates
- remove LiveKit
- touch Stage 6/Postgres production migration

## Current Bootstrap Input

Staging VPS bootstrap is complete with redacted evidence:
- separate staging VPS is available at `staging.ax-connect.ru`
- non-root deploy user exists
- SSH key login works
- root/password SSH login is disabled
- UFW baseline is active
- Docker, Bun, Node.js, PM2, and Nginx are installed
- Nginx default listener exists on `80/tcp`; `443/tcp` is allowed but TLS site is not configured
- no app/API, coturn, env, migrations, or smoke were run

## 1. Staging Layout Plan

Proposed staging app path:

```text
/var/www/ax-connect-staging
```

Ownership:
- owner: `deploy`
- group: `deploy`
- repo files should be writable by `deploy`
- runtime secret/env files should not be committed and should be stored outside git-controlled paths or as server-local files with restricted permissions

Proposed non-repo runtime config roots:

```text
/etc/ax-connect-staging
/etc/ax-connect-staging/app.env
/etc/ax-connect-staging/coturn.env
/opt/ax-connect-staging/coturn
```

Source/branch strategy:
- clone the repository into `/var/www/ax-connect-staging`
- checkout an explicit staging deploy branch or commit SHA approved by the operator
- do not use the production working tree or production deploy path
- do not run `git pull` in production paths
- do not deploy from local dirty worktree state
- future staging deploy run report must record branch and commit SHA without secrets

Build plan, not executed in this segment:
- install dependencies with `bun install`
- build API with `bun run build:api`
- build web with `bun run build:web`
- generate Prisma client only against the staging env source when the staging DB decision is filled
- do not run migrations in this segment

## 2. Process Model Plan

Recommended PM2 process names:

```text
ax-connect-staging-web
ax-connect-staging-api
```

Recommended ports:

```text
web: 127.0.0.1:3001
api: 127.0.0.1:4000
```

Rationale:
- production PM2 process uses the existing `ax-connect` naming and web port `3000`; staging should not collide with it.
- API default is `4000` in `apps/api`, so use `4000` unless a later operator check finds a conflict.
- web uses `3001` because root `start:web` currently hardcodes `next start -p 3000`; staging PM2 should either call `bun next start -p 3001` directly or use a staging-specific ecosystem file in a later deploy segment.

Process command shape for a later run segment:

```text
web cwd: /var/www/ax-connect-staging
web command: bun next start -p 3001
api cwd: /var/www/ax-connect-staging
api command: node apps/api/dist/main.js
```

PM2 status/log commands:

```bash
pm2 status
pm2 describe ax-connect-staging-web
pm2 describe ax-connect-staging-api
pm2 logs ax-connect-staging-web --lines 100
pm2 logs ax-connect-staging-api --lines 100
pm2 save
```

Health commands after deploy, not now:

```bash
curl -fsS http://127.0.0.1:3001/ >/dev/null
curl -fsS http://127.0.0.1:4000/api/health
curl -fsS http://127.0.0.1:4000/api/media/prototype/mediasoup/health
```

## 3. Nginx Staging Site + TLS Plan

Public origin:

```text
https://staging.ax-connect.ru
```

Nginx ownership:
- staging site config path candidate: `/etc/nginx/sites-available/ax-connect-staging`
- enabled symlink candidate: `/etc/nginx/sites-enabled/ax-connect-staging`
- do not edit production site config
- do not enable the site until web/API env and processes are ready

Proxy model:
- `/` proxies to web at `http://127.0.0.1:3001`
- `/api/` proxies to API at `http://127.0.0.1:4000`
- Socket.IO realtime uses path `/socket.io/` and namespace `/realtime`; proxy `/socket.io/` to API with WebSocket headers
- if a future raw `/realtime` HTTP/WSS endpoint exists, proxy it to the API upstream in the same Nginx site

Nginx config shape for later implementation, not applied now:

```nginx
server {
  listen 80;
  server_name staging.ax-connect.ru;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

TLS plan:
- preferred path for staging: `certbot` with the Nginx plugin once the staging site is ready.
- HTTP-01 issuance requires inbound `80/tcp`; UFW currently does not allow `80/tcp` as part of the media bootstrap baseline.
- later deploy segment must either temporarily allow `80/tcp` for cert issuance/renewal or choose DNS-01 with the DNS provider.
- after TLS, `443/tcp` remains the public app/API/WSS entrypoint.
- do not issue certificates in this segment.

Nginx validation commands for later implementation:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

## 4. Env Inventory Plan Without Values

Use server-local env source only. Do not commit values.

Recommended staging env classification:
- `NODE_ENV=production` for optimized Next/Nest runtime behavior.
- staging identity should be recorded through deployment path/origin and optional non-secret `APP_ENV=staging` only if a later runtime segment introduces or approves it.
- do not set `NODE_ENV=staging` unless a later runtime review proves framework behavior remains correct.

Required staging env presence checklist:

| Env item | Public? | Secret? | Required? | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | no | no | yes | Recommended value class: production-mode runtime, not a secret. |
| `NEXT_PUBLIC_API_URL` | yes | no | yes | Shape: staging public origin, e.g. `https://staging.ax-connect.ru`; requires web rebuild. |
| `API_INTERNAL_URL` | no | no | yes/review | Shape: local API origin, e.g. `http://127.0.0.1:4000`. |
| `API_PORT` | no | no | yes | Candidate: `4000`. |
| `API_CORS_ALLOWED_ORIGINS` | no | no | yes | Must include exact staging public origin for credentialed API usage. |
| `AUTH_TOKEN_SECRET` | no | yes | yes | Presence only; must not use default dev secret. |
| `DATABASE_URL` | no | yes | yes | Presence only; must point to separate staging DB, never production. |
| `STORAGE_ACTIVE_PROVIDER` / `STORAGE_TARGET_PROVIDER` | no | no | review | Record shape only if needed for staging storage. |
| `STORAGE_BUCKET` | no | no | yes for uploads | Presence only; staging bucket/prefix should be separate from production. |
| `STORAGE_S3_ENDPOINT` | no | no | yes for uploads | Presence only. |
| `STORAGE_S3_REGION` | no | no | review | Presence/shape only. |
| `STORAGE_S3_ACCESS_KEY_ID` | no | yes | yes for uploads | Presence only. |
| `STORAGE_S3_SECRET_ACCESS_KEY` | no | yes | yes for uploads | Presence only. |
| `STORAGE_PUBLIC_BASE_URL` | no/public URL | no | yes for image host/build | Shape only; may affect `next.config.mjs` remote image patterns. |
| `LIVEKIT_API_KEY` | no | yes | yes for rollback | Presence only. |
| `LIVEKIT_API_SECRET` | no | yes | yes for rollback | Presence only. |
| `NEXT_PUBLIC_LIVEKIT_URL` | yes | no | yes for rollback | Public URL only; requires web rebuild. |
| `MEDIA_TURN_URLS` | no/server config | no | yes for TURN phases | Shape only; no credentials. |
| `MEDIA_TURN_STATIC_AUTH_SECRET` | no | yes | yes for TURN phases | Presence only; must match coturn. |
| `MEDIA_TURN_TTL_SECONDS` | no | no | yes for TURN phases | Short-lived TTL; value approval later. |
| `MEDIA_TURN_RELAY_MIN_PORT` | no | no | yes for TURN phases | Candidate `49160`. |
| `MEDIA_TURN_RELAY_MAX_PORT` | no | no | yes for TURN phases | Candidate `49240`. |
| `MEDIA_SFU_LISTEN_IP` | no | no | yes for SFU phases | Candidate bind shape: `0.0.0.0` or reviewed interface bind. |
| `MEDIA_SFU_ANNOUNCED_ADDRESS` | no | no/sensitive | yes for SFU phases | Staging FQDN or public address; real IP stays private. |
| `MEDIA_SFU_RTC_MIN_PORT` | no | no | yes for SFU phases | Candidate `40000`. |
| `MEDIA_SFU_RTC_MAX_PORT` | no | no | yes for SFU phases | Candidate `40100`. |

Do not enable broad production SFU/default gates. Any `NEXT_PUBLIC_MEDIA_*` candidate gate must remain explicit, reversible, and scoped to staging/non-production review.

## 5. Staging Database Decision / Options

Hard rules:
- staging DB must be separate from production.
- do not use production `DATABASE_URL`.
- do not point staging at the production MySQL database.
- do not run migrations in this segment.
- Stage 6/Postgres production migration remains deferred and untouched.

Current repo direction:
- active local Prisma provider is PostgreSQL.
- staging media setup should use a separate staging PostgreSQL database unless a later runtime review explicitly chooses another isolated path.

Options:

| Option | Fit | Tradeoffs |
| --- | --- | --- |
| Docker-managed Postgres on staging VPS | Good for isolated staging media rehearsal and no managed DB dependency. | Needs volume path, backup/reset policy, credentials outside repo, and resource monitoring; not production migration evidence. |
| Managed staging Postgres | Better durability/operations if provider exists. | Needs separate managed instance, network allowlist, secret source, and cost/ops ownership. |
| Production DB reuse | Forbidden. | Would mix staging smoke with production data and violates this segment. |

Recommended first staging media rehearsal direction:
- use a separate staging PostgreSQL database.
- choose Docker-managed Postgres on the staging VPS only if the operator accepts local VPS storage/backup limitations for staging smoke.
- choose managed staging Postgres if the operator wants cleaner backup/isolation and has a separate managed DB available.
- record only presence/source/owner in repo docs; never record `DATABASE_URL`.

## 6. Coturn Docker Config Plan

Direction:
- Docker-managed coturn is preferred for staging.
- do not start the container in this segment.
- do not generate or record TURN static auth secret values in repo docs.

Proposed non-repo config path:

```text
/opt/ax-connect-staging/coturn/docker-compose.yml
/etc/ax-connect-staging/coturn.env
```

Container naming:

```text
ax-connect-staging-coturn
```

Port plan:

```text
3478/udp
3478/tcp
49160-49240/udp
49160-49240/tcp
```

Config requirements:
- no open relay
- no anonymous relay allocation
- TURN REST shared-secret auth through `MEDIA_TURN_STATIC_AUTH_SECRET`
- coturn `static-auth-secret` source outside repo
- realm must be explicit and aligned with backend-issued credentials
- external/public address must match the reachable staging host value held in private operator inventory
- relay min/max must match UFW and Docker published ports
- logs must be accessible without exposing credentials

Docker status/log commands for later run:

```bash
docker compose -f /opt/ax-connect-staging/coturn/docker-compose.yml config
docker compose -f /opt/ax-connect-staging/coturn/docker-compose.yml ps
docker logs ax-connect-staging-coturn --tail 100
docker inspect ax-connect-staging-coturn
```

No-open-relay checks are reserved for the next run-report/smoke segment after coturn is configured.

## 7. Mediasoup Staging Mapping

Ownership:
- `apps/api` owns MVP/staging mediasoup lifecycle.
- mediasoup remains process-local inside the API/backend media runtime for this MVP/staging run.
- process-local state remains a production/multi-process blocker.

Required mapping:
- `MEDIA_SFU_LISTEN_IP`: bind/listen address, candidate shape `0.0.0.0` or reviewed interface bind.
- `MEDIA_SFU_ANNOUNCED_ADDRESS`: staging reachable FQDN or public address held in private operator inventory.
- `MEDIA_SFU_RTC_MIN_PORT`: `40000`
- `MEDIA_SFU_RTC_MAX_PORT`: `40100`

Firewall relation:
- UFW already allows `40000-40100/udp`.
- Docker/coturn relay range remains separate: `49160-49240`.
- do not proxy mediasoup RTC through Nginx.

Health/log commands after API process exists:

```bash
curl -fsS http://127.0.0.1:4000/api/media/prototype/mediasoup/health
pm2 logs ax-connect-staging-api --lines 100
```

## 8. LiveKit Rollback Env / Check

LiveKit fallback remains required.

Required presence without values:
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

Rollback checks after staging deploy, not now:

```text
https://staging.ax-connect.ru/?mediaProvider=livekit
https://staging.ax-connect.ru/?livekit=true
https://staging.ax-connect.ru/?sfu=false
```

Pass criteria:
- LiveKit token path remains available through `apps/api`.
- explicit LiveKit query overrides remain usable.
- disabling any future SFU/TURN staging gate leaves LiveKit available.

## 9. Smoke Readiness Gates

Do not run smoke in this segment.

Required gates before the next smoke run report:
- app/API health: web and API reachable through Nginx and localhost checks
- auth/session: staging login/session path works without production cookies or production auth secrets
- LiveKit rollback: rollback query checks pass
- mediasoup health: API media health endpoint reports ready or a clear non-secret block reason
- coturn credential/no-open-relay: valid credentials issued, unauth/invalid/expired relay attempts fail
- direct private/channel media smoke: next run-report only
- TURN relay private/channel media smoke: next run-report only
- cleanup health: next run-report only

## Acceptance Criteria

- staging layout is documented
- PM2 process names and app/API ports are documented
- Nginx staging site/TLS plan is documented without applying config
- env inventory is documented without values
- staging DB decision/options are documented and production DB reuse is forbidden
- coturn Docker config plan is documented without secrets or container start
- `MEDIA_TURN_*` / `MEDIA_SFU_*` mapping is documented
- LiveKit rollback env/check is preserved
- smoke remains blocked until deploy/env/coturn/process/log readiness exists
- production rollout/default remains blocked
- Stage 6/Postgres production migration remains untouched

## Verification

Expected verification for this docs-only segment:

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`

## Handoff Format

Report:
- files changed
- setup plan classification
- exact remaining blockers before staging deploy/run
- what the operator must provide manually
- recommended next segment: `production-media-staging-env-setup-run-report` or `production-media-staging-deploy-run-report`

## Classification

- staging env/deploy setup plan: `pass / documented`
- staging deploy execution: `blocked until operator-approved run segment`
- staging env values: `blocked / not filled`
- staging coturn config: `blocked / planned only`
- staging smoke: `blocked until deploy/env/coturn/process/log readiness exists`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`
