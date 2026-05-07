# Postgres

Local Postgres artifacts live here.

This directory is for local Stage 6 Postgres development and validation only. It must not target staging or production.

## Validation Service

Files:
- `docker-compose.validation.yml` starts a local-only Postgres validation service.
- `postgres-validation.env.example` documents validation env names.
- `postgres-dev.env.example` documents the local active `DATABASE_URL` value for disposable Postgres development.
- `../../prisma/postgres-validation/schema.prisma` defines the validation-only Prisma schema path.
- `../../prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql` contains the generated clean local validation baseline for review.
- `../../scripts/stage6/mysql-postgres-local-import-rehearsal.ts` provides local-only preflight, reset, import, and parity tooling.

Default local settings:
- service/container: `connect-postgres-validation`
- database: `connect_validation`
- user: `connect_validation`
- host port: `5433`
- active local dev URL env name: `DATABASE_URL`
- validation URL env name: `POSTGRES_VALIDATION_DATABASE_URL`
- optional shadow URL env name: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

After `Wave 30 / LOCAL_POSTGRES_DEV_SWITCH`, active local development uses Postgres through `DATABASE_URL`.

Local data is disposable. The local switch does not preserve local MySQL data and is not the production migration path.

## Setup

Start with built-in safe defaults:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml up -d
```

Start with explicit values from the example file:

```bash
docker compose --env-file infra/postgres/postgres-validation.env.example -f infra/postgres/docker-compose.validation.yml up -d
```

Check status:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml ps
```

Set local active Prisma/runtime database URL:

```bash
set DATABASE_URL=postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public
```

PowerShell:

```powershell
$env:DATABASE_URL="postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public"
```

Reset disposable local Postgres and apply the active Prisma schema:

```bash
bun.cmd x prisma db push --force-reset --accept-data-loss
```

Generate the active Prisma client:

```bash
bun.cmd x prisma generate
```

Run import rehearsal preflight without writing to Postgres:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode preflight
```

Run dry-run checks without writing to Postgres:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode dry-run
```

## Teardown

Stop the validation service but keep the local validation volume:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down
```

Destroy the local validation volume:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down -v
```

## Guardrails

- Use these URLs only for local development and validation.
- Do not target staging or production with this Compose service.
- Do not treat local disposable-data reset as production migration proof.
- Do not delete local MySQL data as part of the local Postgres switch.
- Keep production migration, rollback, and cutover runbooks separate.
