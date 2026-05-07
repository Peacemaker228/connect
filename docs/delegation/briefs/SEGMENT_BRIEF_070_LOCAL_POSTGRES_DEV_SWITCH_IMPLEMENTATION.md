# Segment 070. Local Postgres Dev Switch Implementation

Branch:
- `wave/stage6-local-postgres-dev-switch-implementation`

Segment:
- `local-postgres-dev-switch-implementation`

## Goal

Switch local development to Postgres without preserving local MySQL data.

This segment is local-development only. It does not target staging or production, does not preserve or migrate local MySQL data, does not run production migration, does not delete local MySQL data, and does not create a production cutover runbook.

## Changed Files

Tracked files:
- `prisma/schema.prisma`
- `infra/postgres/postgres-dev.env.example`
- `infra/postgres/README.md`
- `prisma/postgres-validation/README.md`
- `scripts/stage6/README.md`
- `docs/waves/LOCAL_POSTGRES_DEV_SWITCH.md`
- `docs/waves/POSTGRES_PROVIDER_SWITCH_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_070_LOCAL_POSTGRES_DEV_SWITCH_IMPLEMENTATION.md`

Local ignored env files updated for this workspace:
- `.env`
- `.env.local`

Not changed:
- `.env.production`
- active runtime code
- active Prisma migrations
- local MySQL data

## Implementation Summary

Active Prisma provider:
- changed `prisma/schema.prisma` datasource provider from `mysql` to `postgresql`
- kept `url = env("DATABASE_URL")`
- kept `relationMode = "prisma"`

Local env:
- added `infra/postgres/postgres-dev.env.example`
- local `DATABASE_URL` now points to the local Postgres service at `localhost:5433`
- `.env` and `.env.local` were updated in the workspace to use the local Postgres `DATABASE_URL`
- `.env.production` was not touched

Local database:
- local Postgres service `connect-postgres-validation` was used as the disposable local dev database
- clean active schema was applied with `prisma db push --force-reset`
- local Postgres data was reset
- local MySQL data was not deleted or migrated

Prisma client:
- Prisma client generation completed successfully

## Commands Run

Start local Postgres:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml up -d
```

Apply clean local Postgres schema:

```bash
bun.cmd x prisma db push --force-reset --accept-data-loss
```

Result:
- PostgreSQL database `connect_validation`, schema `public`, at `localhost:5433` was reset
- database is in sync with `prisma/schema.prisma`
- Prisma Client generated successfully

Generate Prisma client explicitly:

```bash
bun.cmd x prisma generate
```

Result:
- Prisma Client v5.22.0 generated successfully

Validate active schema:

```bash
bun.cmd x prisma validate
```

Result:
- active `prisma/schema.prisma` is valid

## Local Setup / Reset Commands

Use these commands for local disposable Postgres development:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml up -d
```

PowerShell local env:

```powershell
$env:DATABASE_URL="postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public"
```

Reset and apply active schema:

```bash
bun.cmd x prisma db push --force-reset --accept-data-loss
```

Regenerate Prisma client:

```bash
bun.cmd x prisma generate
```

Stop local Postgres without deleting the volume:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down
```

Destroy local Postgres volume:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down -v
```

## Local Runtime Readiness

Local app runtime is ready for smoke from a schema/client/env perspective:
- active Prisma provider is `postgresql`
- local `DATABASE_URL` points to local Postgres
- clean local Postgres schema is applied
- Prisma client is generated

Expected smoke state:
- database is empty after reset
- local product flows should create fresh auth/profile/server/channel/message data
- local MySQL data is intentionally not preserved

## Blockers Before `local-postgres-dev-smoke`

Blocking items:
- none at schema/client/env setup level

Smoke prerequisites:
- start local API/web with the updated local Postgres `DATABASE_URL`
- create or seed minimal disposable local data through product flows
- verify auth/session/profile, servers, members, channels, messages, direct messages, invites, storage metadata, and realtime-adjacent paths where practical

Out of scope for smoke:
- production migration
- staging/prod cutover
- local MySQL data cleanup
- production runbook creation

## Recommended Next Segment

Recommended next segment:
- `local-postgres-dev-smoke`

Goal:
- run local API/web against Postgres and document compatibility findings before local MySQL assumptions are retired.

Required constraints:
- do not target staging or production
- do not preserve/migrate local MySQL data
- do not delete local MySQL data
- keep production migration and production runbook work separate

## Verification Performed

Verification performed:
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
- `bun.cmd x prisma validate` passed
- provider/env grep confirmed active `prisma/schema.prisma` now uses `provider = "postgresql"` and `env("DATABASE_URL")`; remaining `mysql` mentions are historical docs, production-oriented docs, or migration/rehearsal tooling references
