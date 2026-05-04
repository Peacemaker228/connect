# Segment 063. Postgres Validation Baseline Apply Drift Check

Branch:
- `wave/stage6-postgres-validation-baseline-apply-drift-check`

Segment:
- `postgres-validation-baseline-apply-and-drift-check`

## Goal

Apply the isolated clean baseline to a disposable local Postgres validation database and capture empty-database schema/drift verification.

This segment did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active `prisma/migrations`, did not change runtime code, did not import/export MySQL data, did not clean data, and did not perform staging or production cutover.

## Target

Validation service target:
- host: `127.0.0.1`
- port: `5433`
- database: `connect_validation`
- user: `connect_validation`
- URL env name: `POSTGRES_VALIDATION_DATABASE_URL`
- optional shadow URL env name: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Baseline intended for apply:
- `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`

Validation schema:
- `prisma/postgres-validation/schema.prisma`

## Preflight Result

Status:
- blocked

Observed blockers:
- Docker CLI is not available in the current shell, so the local Compose validation service could not be started or inspected.
- `psql` is not available in the current shell, so the baseline SQL could not be applied with a Postgres client.
- TCP check to `127.0.0.1:5433` failed, so the disposable local validation database was not reachable.
- No local Windows Postgres service was found by service name/display-name search.

## Apply Result

Result:
- not applied

Reason:
- the disposable local Postgres validation database was unavailable
- the segment did not fall back to active MySQL, active `DATABASE_URL`, active Prisma schema, or runtime code

No baseline SQL was executed against any database in this segment.

## Drift Result

Result:
- not captured

Reason:
- empty-database drift/schema verification requires a reachable Postgres validation database after baseline apply
- because apply was blocked, drift verification was also blocked

## Shadow DB / Env Result

Env handling:
- validation env names remain `POSTGRES_VALIDATION_DATABASE_URL` and `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`
- active `DATABASE_URL` was not changed

Shadow DB:
- not used by the blocked apply path
- no shadow database limitation was reached

## Active Runtime Safety

Confirmed safe boundaries:
- active `prisma/schema.prisma` remains MySQL-backed
- active `prisma/migrations` was not changed
- runtime source code was not changed
- no MySQL data import/export ran
- no cleanup ran
- no staging or production target was used

## Blockers Before Import Rehearsal

Blocking:
- local Postgres validation runtime is not reachable in this shell
- baseline has not been applied to disposable local Postgres validation
- empty-database drift check has not been captured

Still remaining after runtime is restored:
- apply isolated baseline SQL to the disposable local Postgres validation database
- verify schema/drift against `prisma/postgres-validation/schema.prisma`
- capture table/index/enum presence in the validation database
- only then proceed toward import rehearsal planning

## Recommended Next Segment

Recommended next segment:
- `postgres-validation-runtime-unblock-and-apply-drift-rerun`

Goal:
- make the disposable local Postgres validation database reachable, then rerun the isolated baseline apply and empty-database drift check.

Required constraints:
- keep active `DATABASE_URL` unchanged
- keep active `prisma/schema.prisma` on `provider = "mysql"`
- do not edit active `prisma/migrations`
- do not change runtime code
- do not import/export or clean data
- do not target staging or production

## Verification

Verification performed:
- `git diff --check` passed
- `bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma` passed with validation env vars set inline from the local validation example
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions are isolated to validation docs/artifacts

Blocked verification:
- baseline apply was not performed because local Postgres validation was unreachable
- drift verification was not performed because baseline apply was blocked
