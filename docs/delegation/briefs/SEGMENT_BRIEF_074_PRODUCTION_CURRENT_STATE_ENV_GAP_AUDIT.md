# Segment 074. Production Current State Inventory Env Gap Audit

Branch:
- `wave/stage6-production-current-state-env-gap-audit`

Segment:
- `production-current-state-inventory-env-gap-audit`

## Goal

Compare known production state with current reborn/runtime requirements and document gaps before a future maintenance deploy and Postgres cutover.

This segment is docs-only. It does not connect to the server, does not change server `.env`, does not change `.env.production`, does not change Prisma provider/schema/migrations/runtime, does not deploy, does not export/import data, does not delete MySQL data, does not repeat secrets, and does not address the microphone/media follow-up.

## Known Production Facts Used

Known from operator context:
- production runs on a VPS
- production uses PM2 and Nginx
- current deploy shape is `git pull`, build, `pm2 restart`, and desktop upload
- MySQL is manually installed on the same server
- target Postgres is likely on the same server; Docker may be decided later
- production env file is server `.env`
- known non-secret production env values include `NODE_ENV=production` and `PORT=3000`
- maintenance/write-freeze mechanism is not defined yet
- production env is from an older Clerk/UploadThing-era runtime and still has obsolete vars
- secrets were previously exposed in chat, so controlled rotation is required, but no values are repeated or changed in this segment

## Runtime Env Requirements Found

Code/docs scan sources:
- `apps/api/src/common/config/app.config.ts`
- `apps/api/src/common/config/storage.config.ts`
- `apps/api/src/common/database/prisma.service.ts`
- `apps/api/src/modules/auth/auth-tokens.service.ts`
- `apps/api/src/modules/auth/auth-cookies.service.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `packages/app-core/src/api/backend-api-url.ts`
- `src/lib/shared/utils/backend-api.ts`
- `src/lib/shared/utils/public-api-url.ts`
- `src/lib/shared/utils/auth-middleware.ts`
- `next.config.mjs`
- `server.ts`

Required or operationally required for current reborn runtime:
- `NODE_ENV=production`
- `PORT` for web process when using `server.ts` or equivalent PM2 web process
- `API_PORT`
- `API_GLOBAL_PREFIX` optional; default is `api`
- `API_CORS_ALLOWED_ORIGINS` or legacy alias `API_CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `API_INTERNAL_URL`
- optional `API_EXTERNAL_URL`
- `DATABASE_URL` with `postgresql` scheme for current reborn runtime
- `AUTH_TOKEN_SECRET`
- optional `AUTH_ACCESS_TOKEN_TTL_SECONDS`
- optional `AUTH_REFRESH_TOKEN_TTL_SECONDS`
- `STORAGE_BUCKET`
- `STORAGE_PUBLIC_BASE_URL`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- optional `STORAGE_ACTIVE_PROVIDER`
- optional `STORAGE_TARGET_PROVIDER`
- optional `STORAGE_MANAGED_CLOUD`
- optional `STORAGE_S3_REGION`
- optional `STORAGE_S3_FORCE_PATH_STYLE`
- optional `STORAGE_KEY_PREFIX`
- optional staged sweeper vars: `STORAGE_STAGED_SWEEPER_ENABLED`, `STORAGE_STAGED_SWEEPER_INTERVAL_MINUTES`, `STORAGE_STAGED_SWEEPER_MAX_AGE_HOURS`, `STORAGE_STAGED_SWEEPER_MAX_OBJECTS`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`
- optional `NEXT_PUBLIC_APP_VERSION`
- optional `NEXT_PUBLIC_APP_ENV`
- optional `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL`

Cookie/runtime assumptions:
- backend auth cookies are `ax-access-token` and `ax-refresh-token`
- cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`
- cookies become `Secure` when `NODE_ENV=production`
- API CORS uses `credentials: true`, so production origins must be explicit and exact

## Gap Table

| Area | Required current state | Known production state | Classification | Gap / decision |
| --- | --- | --- | --- | --- |
| Production env file | server `.env` carries current reborn vars | server `.env` exists but is old-runtime shaped | missing/review | inventory and rewrite plan required; do not expose values |
| `NODE_ENV` | `production` | known as `production` | pass/review | required for secure cookies; keep in reviewed env update |
| Web `PORT` | web PM2 process listens on expected Nginx upstream, likely `3000` | known env value is `3000`; current Nginx/PM2 likely points to one app process | needs verification | confirm whether `server.ts`/`start:web` is used and whether Nginx upstream matches |
| `API_PORT` | Nest API process listens, default `4000` | old deploy may not run separate API process | missing/decision | PM2 topology must add/confirm API process |
| `API_GLOBAL_PREFIX` | optional, default `api` | unknown | review | leave default unless Nginx/API paths require override |
| `NEXT_PUBLIC_API_URL` | browser-facing backend API base URL, may include `/api` | likely absent in old same-origin runtime | missing | required for direct backend mode |
| `API_INTERNAL_URL` | server/middleware internal API URL, usually `http://127.0.0.1:<API_PORT>` | likely absent | missing | required for Next server utilities and auth middleware |
| `API_CORS_ALLOWED_ORIGINS` | exact production web origins | likely absent | missing | required because API enables credentialed CORS |
| Nginx | routes web, API, and realtime consistently | known Nginx exists, old config likely web-only | decision | define `/api` and `/realtime` proxy strategy or public API origin strategy |
| PM2 | process topology for web and API | current deploy uses `pm2 restart` and likely one process | decision | define process names, restart order, logs, and save behavior |
| `DATABASE_URL` | `postgresql` for current reborn runtime | production source is MySQL before cutover | blocker for open traffic | reborn DB-backed runtime cannot be publicly enabled before Postgres import/cutover |
| MySQL source | preserved as source-of-truth until cutover completion | manually installed on same VPS | review | backup/restore/source access plan needed |
| Postgres target | provisioned and reachable before cutover | likely same VPS; Docker undecided | decision/blocker | choose same-server package vs Docker and backup/monitoring strategy |
| `AUTH_TOKEN_SECRET` | strong production secret, not default | likely absent in old Clerk runtime | missing/blocker | must be created and rotated; default dev secret is not acceptable |
| Auth TTL vars | optional explicit policy | unknown | review | decide default vs explicit TTLs |
| Backend cookies | HTTPS, secure cookies, Lax same-site, credentialed CORS | Nginx HTTPS exists | needs verification | confirm domains, proxy headers, and CORS origins |
| S3 storage vars | `STORAGE_*` managed-cloud S3-compatible config | old env may still have UploadThing-era vars | missing/review | ensure all required S3 vars exist before reborn deploy |
| UploadThing vars | obsolete for active runtime | old env has UploadThing-era vars | obsolete | remove only during controlled env update; keep historical URL compatibility in data |
| Clerk vars | obsolete for active runtime | old env has Clerk-era vars | obsolete | remove only during controlled env update |
| LiveKit vars | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` | likely present | review/rotation | rotate because secrets were exposed; do not change in this segment |
| `NEXT_PUBLIC_*` rebuild | public vars are compiled into web bundle | current deploy includes build | review | deploy plan must rebuild after env update |
| Desktop upload | current deploy includes desktop upload | known current step | review | keep separate from DB cutover and record exact artifact step |
| Maintenance/write-freeze | defined, tested mechanism | not defined | blocker | required before maintenance deploy and DB cutover |
| Secret rotation | rotation plan required | secrets were exposed in chat | blocker | rotate DB, auth, storage, LiveKit, and old vendor secrets through controlled plan |

## Obsolete Env Vars

Obsolete for active reborn runtime:
- `CLERK_*`
- `NEXT_PUBLIC_CLERK_*`
- `CLERK_SECRET_KEY`
- `UPLOADTHING_*`
- `UT_*`

Handling:
- do not repeat values
- do not delete ad hoc
- remove from production `.env` only in a reviewed maintenance env update
- rotate old vendor secrets even if no longer active, because they were exposed
- keep historical UploadThing file URL compatibility in data/runtime where current storage access supports it

## Required Secret Rotation Plan

Rotation is required because production secrets were shown in chat.

Rotate or replace:
- production MySQL password or migration-specific MySQL user password
- future production Postgres password
- `AUTH_TOKEN_SECRET`
- `STORAGE_S3_ACCESS_KEY_ID` / `STORAGE_S3_SECRET_ACCESS_KEY`
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
- obsolete Clerk secrets
- obsolete UploadThing secrets
- any deployment token used for desktop upload, if it was exposed

Rules:
- no secret values in docs, commits, tickets, or assistant messages
- rotate in a maintenance window or with a staged dual-secret strategy where supported
- record only secret owner, rotation timestamp, and non-secret confirmation output
- expect auth token rotation to invalidate active backend auth sessions

## Future Maintenance Sequence

Recommended high-level sequence:
1. Prepare reviewed production `.env` inventory without values in docs.
2. Define maintenance/write-freeze mechanism.
3. Enter maintenance/write-freeze on the current production runtime.
4. Backup current server `.env`, PM2 config, Nginx config, and MySQL.
5. Merge/deploy reborn code and build artifacts while public writes remain frozen.
6. Apply reviewed env update without exposing values.
7. Start/verify PM2 process topology for web and API.
8. Run maintenance/process smoke only: PM2 status, Nginx status, API health if it does not require DB writes, web maintenance response, logs.
9. Perform final MySQL backup/export and Postgres import/cutover under the DB migration runbook.
10. Run full DB-backed runtime smoke only after Postgres import and `DATABASE_URL` cutover.
11. Lift maintenance only after parity and smoke gates pass.

Important nuance:
- current reborn backend Prisma runtime uses the Postgres driver adapter and expects a `postgresql` `DATABASE_URL`
- therefore, pre-cutover smoke cannot be treated as full product smoke against MySQL
- full auth/server/channel/message/storage DB-backed smoke belongs after Postgres import/cutover

## Blockers Before Maintenance Deploy

Blockers:
- maintenance/write-freeze mechanism is undefined
- production `.env` inventory and reviewed env update plan are missing
- PM2 process topology for separate web/API runtime is not documented
- Nginx routing strategy for direct backend API/realtime is not documented
- `AUTH_TOKEN_SECRET` production value/rotation plan is missing
- required S3-compatible storage vars need confirmation
- `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`, and `API_CORS_ALLOWED_ORIGINS` need production decisions
- secret rotation plan is required before using exposed secrets further

## Blockers Before Postgres Cutover

Blockers:
- Postgres target installation/hosting strategy is not decided
- production-safe import/export command path is not approved
- staging rehearsal has not passed
- production MySQL backup and restore verification have not passed
- final parity query pack for production has not been approved
- rollback procedure has not been drilled
- data divergence handling after any Postgres writes is not decided
- full DB-backed smoke cannot happen until Postgres import and `DATABASE_URL` cutover

## Classification

Pass:
- docs-only current-state/env gap audit is complete
- required reborn runtime env vars are listed
- obsolete Clerk/UploadThing vars are classified
- secret rotation requirement is documented without repeating values
- maintenance-before-cutover sequence is documented

Review:
- exact production PM2/Nginx topology is still unknown because this segment did not connect to the server
- exact production env presence/absence is based on known operator facts and code requirements, not live server inspection

Fail:
- none recorded

Block:
- maintenance deploy is blocked until maintenance/write-freeze, env, PM2/Nginx, and rotation plans are defined
- Postgres cutover is blocked until staging rehearsal, backup/restore verification, production-safe tooling, and rollback are ready

Overall:
- `pass-with-blockers`

## Recommended Next Segment

Recommended next segment:
- `production-reborn-maintenance-deploy-plan`

Goal:
- define the exact maintenance/write-freeze mechanism, reviewed server `.env` inventory template, PM2 process topology, Nginx routing plan, secret rotation order, and non-DB smoke checklist before any server deploy.

## Verification Performed

Verification performed:
- `git diff --check` passed with existing CRLF warnings on touched docs
- `rg -n "CLERK|UPLOADTHING|DATABASE_URL|NEXT_PUBLIC_API_URL|API_INTERNAL_URL|API_PORT|API_CORS_ALLOWED_ORIGINS|LIVEKIT|STORAGE|S3|COOKIE|CORS|PM2|Nginx|maintenance|write-freeze|rollback|secret" docs apps src packages infra prisma --glob "*.md" --glob "*.ts" --glob "*.tsx" --glob "*.example" --glob "*.yml"` passed
- `bun.cmd x prisma validate` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
