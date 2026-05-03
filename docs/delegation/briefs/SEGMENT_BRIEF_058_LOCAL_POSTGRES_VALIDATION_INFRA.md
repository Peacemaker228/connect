# Segment 058. Local Postgres Validation Infra

Branch:
- `wave/stage6-local-postgres-validation-infra`

Segment:
- `local-postgres-validation-infra`

## Goal

Add isolated local Postgres validation infrastructure only.

This segment does not change the active `DATABASE_URL`, does not change `provider = "mysql"`, does not edit `prisma/schema.prisma`, does not create/edit/run Prisma migrations, and does not change runtime code to consume Postgres env vars.

## Required Reading

- [SEGMENT_BRIEF_057_LOCAL_POSTGRES_BASELINE_DESIGN.md](./SEGMENT_BRIEF_057_LOCAL_POSTGRES_BASELINE_DESIGN.md)
- [POSTGRES_PROVIDER_SWITCH_PLAN.md](../../waves/POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)

## Added Infrastructure

Files:
- [docker-compose.validation.yml](../../../infra/postgres/docker-compose.validation.yml)
- [postgres-validation.env.example](../../../infra/postgres/postgres-validation.env.example)
- [infra/postgres/README.md](../../../infra/postgres/README.md)

Local-only service:
- Compose project name: `connect-postgres-validation`
- service/container: `connect-postgres-validation`
- database: `connect_validation`
- user: `connect_validation`
- default host port: `5433`
- volume: `connect-postgres-validation-data`

Validation env names:
- `POSTGRES_VALIDATION_DATABASE_URL`
- `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Active runtime env:
- `DATABASE_URL` remains the active MySQL runtime variable
- no application code reads validation env names in this segment

## Setup

Start the validation service with built-in defaults:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml up -d
```

Start the validation service with explicit example values:

```bash
docker compose --env-file infra/postgres/postgres-validation.env.example -f infra/postgres/docker-compose.validation.yml up -d
```

Check status:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml ps
```

## Teardown

Stop the validation service while preserving local data:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down
```

Stop the service and delete the validation volume:

```bash
docker compose -f infra/postgres/docker-compose.validation.yml down -v
```

## Guardrails

- Do not set `DATABASE_URL` to the Postgres validation URL.
- Do not change `provider = "mysql"` in `prisma/schema.prisma`.
- Do not edit `prisma/schema.prisma`.
- Do not create, edit, or run Prisma migrations.
- Do not make runtime code consume `POSTGRES_VALIDATION_DATABASE_URL`.
- Do not use this local validation service for staging or production cutover.

## Acceptance

- isolated Postgres validation service/config exists under `infra/postgres`
- validation env names are documented
- setup/teardown instructions are documented
- no active runtime config changed
- no Prisma schema or migration files changed
- no runtime code changed

## Remaining Blockers

Provider switch remains blocked by:
- no clean Postgres baseline has been generated or reviewed
- no isolated validation Prisma schema exists yet
- relation mode support for the selected Prisma/Postgres validation path still needs to be confirmed before baseline generation
- MySQL data-audit queries have not been prepared or run
- no data export/import tooling exists
- no staging validation or rollback/cutover runbook exists

## Recommended Next Segment

Recommended next segment:
- `mysql-data-audit-query-pack`

Goal:
- prepare executable MySQL data-audit queries for orphan rows, enum parity, case/collation duplicates, DateTime parity, and row counts before baseline generation or import work.

Still out of scope:
- changing active `DATABASE_URL`
- changing Prisma provider
- editing `prisma/schema.prisma`
- creating or running migrations
- changing runtime code

## Verification

Required verification:

```bash
git diff --check
rg -n "DATABASE_URL|POSTGRES_VALIDATION_DATABASE_URL|provider =|postgresql|mysql" prisma docs apps packages src infra --glob "*.yml" --glob "*.yaml" --glob "*.md" --glob "*.ts" --glob "*.tsx" --glob "*.prisma" --glob "*.example"
```
