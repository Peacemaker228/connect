# Segment 067. MySQL Postgres Local Import Rehearsal Dry-Run Report

Branch:
- `wave/stage6-mysql-postgres-local-import-rehearsal-dry-run-report`

Segment:
- `mysql-to-postgres-local-import-rehearsal-dry-run-report`

## Goal

Capture a successful preflight and dry-run report from the local-only MySQL-to-Postgres rehearsal tooling.

This segment is docs-only. It did not run actual import, did not reset or write to the Postgres validation database, did not clean MySQL data, did not target staging or production, did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active migrations, and did not change runtime application code.

## Inputs

Tooling:
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts`

Source:
- local current MySQL through `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` or guarded local `DATABASE_URL`

Target:
- local disposable Postgres validation through `POSTGRES_VALIDATION_DATABASE_URL`

Execution result:
- preflight passed
- dry-run passed
- `actualImportExecuted=false`
- drift result: `No difference detected.`

## Source Row Counts

| table | rows |
|---|---:|
| `profile` | 5 |
| `authidentity` | 5 |
| `authpasswordcredential` | 5 |
| `authsession` | 49 |
| `server` | 6 |
| `member` | 7 |
| `channel` | 11 |
| `message` | 6 |
| `conversation` | 3 |
| `directmessage` | 1 |

Source total:
- 98 rows across the 10 application tables

## Source Checks

Pass:
- orphan checks: 0
- invalid enum checks: 0
- DateTime `updatedBeforeCreated` checks: 0

Review:
- self-conversation count: 2

Interpretation:
- the source data has no dry-run blocker for local parity-mode rehearsal
- the two self-conversation rows remain review/data-cleanup candidates
- parity-mode actual rehearsal may import them unchanged unless a separate cleanup/transform segment is approved first

## Target Checks

Target row counts:
- all target application tables: 0 rows

Target validation checks:
- orphan checks: 0
- invalid enum checks: 0
- DateTime checks: 0
- self-conversation count: 0

Schema/drift result:
- Prisma drift reported `No difference detected.`

Interpretation:
- the disposable local Postgres validation target is empty and schema-aligned for a separately scoped actual local import rehearsal

## Classification

Pass:
- preflight passed
- dry-run passed
- source and target are local-only validation targets
- `actualImportExecuted=false`
- source orphan, enum, and DateTime checks are clean
- target is empty
- target checks are clean
- Prisma drift reports no difference

Review:
- 2 existing self-conversation rows remain in local MySQL
- these rows are not a Postgres baseline/import blocker, but they remain product data-cleanup candidates
- first actual local import rehearsal should either import them unchanged in parity mode or use a separately approved cleanup/transform segment

Fail:
- none recorded in this dry-run report

Block:
- none recorded in this dry-run report

Overall:
- `pass-with-review`

## Readiness for Actual Local Import Rehearsal

The actual local import rehearsal is ready to be separately scoped if the next segment keeps the existing guardrails:
- local-only source and target
- `POSTGRES_VALIDATION_DATABASE_URL` target only
- reset disposable Postgres validation to the clean baseline immediately before the run
- require explicit write flags
- capture a run report with row count parity, orphan checks, enum checks, DateTime checks, aggregate parity, self-conversation count, and drift/schema verification

Actual import was not executed in this segment.

## Recommended Next Segment

Recommended next segment:
- `mysql-to-postgres-local-import-rehearsal-run-report`

Goal:
- run the first actual local-only import rehearsal against disposable Postgres validation with explicit approval flags, capture the full pass/review/fail/block report, and leave active MySQL runtime unchanged.

Required constraints:
- do not change active `DATABASE_URL`
- do not edit active `prisma/schema.prisma`
- do not change active provider or active migrations
- do not change runtime code
- do not target staging or production
- do not clean MySQL data unless a separate cleanup/transform segment is approved

## Verification Performed

Verification performed:
- `git diff --check` passed
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions remain isolated to validation docs/artifacts/tooling
