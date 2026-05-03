# Postgres

Local Postgres validation artifacts live here.

This directory is for isolated Stage 6 validation only. It must not change the active application `DATABASE_URL`, Prisma datasource provider, `prisma/schema.prisma`, migrations, or runtime code.

## Validation Service

Files:
- `docker-compose.validation.yml` starts a local-only Postgres validation service.
- `postgres-validation.env.example` documents validation env names.
- `../../prisma/postgres-validation/schema.prisma` defines the validation-only Prisma schema path.
- `../../prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql` contains the generated clean local validation baseline for review.

Default local settings:
- service/container: `connect-postgres-validation`
- database: `connect_validation`
- user: `connect_validation`
- host port: `5433`
- validation URL env name: `POSTGRES_VALIDATION_DATABASE_URL`
- optional shadow URL env name: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

The active app runtime continues to use `DATABASE_URL` for the current MySQL database.

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

- Do not set active `DATABASE_URL` to `POSTGRES_VALIDATION_DATABASE_URL`.
- Do not point `apps/api` or `apps/web` at these variables.
- Do not change `provider = "mysql"` in the active Prisma schema in this segment.
- Do not create, edit, or run active Prisma migrations as part of this infrastructure segment.
- Use this service only for later approved validation/baseline work.
