# Segment 066. MySQL Postgres Local Import Rehearsal Tooling

Branch:
- `wave/stage6-mysql-postgres-local-import-rehearsal-tooling`

Segment:
- `mysql-to-postgres-local-import-rehearsal-tooling`

## Goal

Implement local-only import rehearsal tooling and verification scripts with strict guardrails. The first implementation supports preflight and dry-run checks without writing to Postgres by default, and requires explicit flags for any write path.

This segment did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active migrations, did not change runtime application code, did not clean MySQL data, did not target staging or production, and did not install new dependencies.

## Added Tooling

Files:
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts`
- `scripts/stage6/README.md`

Documentation updates:
- `infra/postgres/README.md`
- `docs/waves/POSTGRES_PROVIDER_SWITCH_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

Report:
- `docs/delegation/briefs/SEGMENT_BRIEF_066_MYSQL_POSTGRES_LOCAL_IMPORT_REHEARSAL_TOOLING.md`

## Tooling Capabilities

Guardrails:
- preferred source env: `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- fallback source env: `DATABASE_URL`, only if the URL is local MySQL
- target env: `POSTGRES_VALIDATION_DATABASE_URL`
- source scheme must be `mysql`
- target scheme must be `postgresql`
- source and target hosts must be `localhost`, `127.0.0.1`, or `::1`
- actual import requires `--execute-import`
- target reset/import write paths require `--confirm-disposable-target`
- actual import also requires `--reset-target` so the disposable target starts from a clean baseline

Supported modes:
- `preflight`: URL allowlists, baseline file presence, schema file presence, and table order; no database writes
- `dry-run`: source/target read-only checks and parity snapshots; no Postgres writes
- `verify`: source/target read-only checks for an already imported rehearsal target; no Postgres writes
- `reset-baseline`: guarded disposable target reset and baseline reapply
- `import`: guarded table-order import; not default and requires explicit write flags

Table order:
- `profile`
- `authidentity`
- `authpasswordcredential`
- `authsession`
- `server`
- `member`
- `channel`
- `message`
- `conversation`
- `directmessage`

Validation rules:
- preserve IDs exactly
- preserve enum strings exactly
- preserve timestamps as importable timestamp values
- preserve text/varchar values and fail on `VarChar(191)` overflow
- preserve booleans and nulls
- fail on required nulls
- fail on invalid enum values
- fail on unsafe source/target URLs

Reports/checks:
- row counts
- orphan checks
- enum checks
- DateTime `updatedAt < createdAt` checks
- aggregate parity summaries
- self-conversation count
- Prisma drift check from `POSTGRES_VALIDATION_DATABASE_URL` to `prisma/postgres-validation/schema.prisma`

## How To Run

Set local-only envs:

```bash
set MYSQL_REHEARSAL_SOURCE_DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3307/ax_connect
set POSTGRES_VALIDATION_DATABASE_URL=postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation?schema=public
```

Preflight only:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode preflight --json
```

Dry-run checks without Postgres writes:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode dry-run --json
```

Guarded reset to clean baseline:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode reset-baseline --confirm-disposable-target --json
```

Actual local import rehearsal:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode import --reset-target --execute-import --confirm-disposable-target --json
```

## Local Execution Notes

Preflight:
- executed successfully with local source URL from `.env.local` copied into `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- target used `POSTGRES_VALIDATION_DATABASE_URL`
- output confirmed local MySQL source, local Postgres validation target, baseline path, validation schema path, and table order

Dry-run:
- attempted without Postgres writes
- blocked because local MySQL source at `127.0.0.1:3307` was not accepting connections in this shell
- no import was executed
- no Postgres writes were executed

Actual import:
- intentionally not executed in this segment

## Remaining Blockers Before First Actual Local Import Rehearsal

Remaining blockers:
- local MySQL source must be reachable for dry-run and actual rehearsal
- dry-run must pass against current local MySQL and disposable Postgres validation
- target reset mode should be run immediately before the first actual import rehearsal
- first actual import run needs a dedicated run-report segment
- decision remains whether the two self-conversation rows stay in parity-mode import or move to a separately approved cleanup/transform segment

## Recommended Next Segment

Recommended next segment:
- `mysql-to-postgres-local-import-rehearsal-dry-run-report`

Goal:
- run the new tooling in preflight/dry-run mode against reachable local MySQL and local Postgres validation, capture the full no-write report, and confirm readiness for an explicit actual import rehearsal.

Required constraints:
- do not change active `DATABASE_URL`
- do not edit active `prisma/schema.prisma`
- do not change active provider or active migrations
- do not change runtime code
- do not run actual import unless separately scoped and explicitly guarded
- do not clean data
- do not target staging or production

## Verification

Verification performed:
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma` passed with validation env vars set inline
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions are isolated to validation docs/artifacts/tooling
