# Segment 068. MySQL Postgres Local Import Rehearsal Run Report

Branch:
- `wave/stage6-mysql-postgres-local-import-rehearsal-run-report`

Segment:
- `mysql-to-postgres-local-import-rehearsal-run-report`

## Goal

Run the first actual local-only import rehearsal into disposable Postgres validation and capture the full run report.

This segment used only local MySQL as source and local disposable Postgres validation as target. It did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active migrations, did not change runtime code, did not clean MySQL data, and did not target staging or production.

## Command

Command executed:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode import --reset-target --execute-import --confirm-disposable-target --json
```

Command result:
- exit code: 0
- mode: `import`
- source: local MySQL at `127.0.0.1:3307`, database `ax_connect`
- target: local Postgres validation at `localhost:5433`, database `connect_validation`
- source env: `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- target env: `POSTGRES_VALIDATION_DATABASE_URL`
- `actualImportExecuted=true`
- reset target before import: yes, through `--reset-target`
- baseline SQL: `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`
- validation schema: `prisma/postgres-validation/schema.prisma`

## Source Counts

| table | source rows |
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

## Pre-Import Checks

Source checks:
- orphan counts: all 0
- enum checks: all 0
- DateTime `updatedBeforeCreated` checks: all 0
- self-conversation count: 2

Target before import:
- all application table counts: 0
- orphan counts: all 0
- enum checks: all 0
- DateTime checks: all 0
- self-conversation count: 0

Drift/schema result before import:
- `No difference detected.`

## Import Result

| table | imported rows | validation issues |
|---|---:|---:|
| `profile` | 5 | 0 |
| `authidentity` | 5 | 0 |
| `authpasswordcredential` | 5 | 0 |
| `authsession` | 49 | 0 |
| `server` | 6 | 0 |
| `member` | 7 | 0 |
| `channel` | 11 | 0 |
| `message` | 6 | 0 |
| `conversation` | 3 | 0 |
| `directmessage` | 1 | 0 |

Import total:
- 98 rows imported
- no validation issues reported by the tooling

## Post-Import Target Counts

| table | target rows | source parity |
|---|---:|---|
| `profile` | 5 | pass |
| `authidentity` | 5 | pass |
| `authpasswordcredential` | 5 | pass |
| `authsession` | 49 | pass |
| `server` | 6 | pass |
| `member` | 7 | pass |
| `channel` | 11 | pass |
| `message` | 6 | pass |
| `conversation` | 3 | pass |
| `directmessage` | 1 | pass |

Target total:
- 98 rows after import
- row-count parity passed for all 10 tables

## Post-Import Target Checks

Orphan checks:
- all logical relation orphan counts: 0

Enum checks:
- `authidentityProvider`: 0
- `authsessionStatus`: 0
- `memberRole`: 0
- `channelType`: 0

DateTime checks:
- all `updatedBeforeCreated` checks: 0

Review item:
- `selfConversationCount=2`
- the two existing self-conversation rows were imported unchanged in parity mode
- these rows remain product data-cleanup candidates and are not a Postgres import blocker

## Post-Import Target Aggregates

| aggregate | source | target | parity |
|---|---:|---:|---|
| members per server | 7 | 7 | pass |
| channels per server | 11 | 11 | pass |
| messages per channel | 6 | 6 | pass |
| direct messages per conversation | 1 | 1 | pass |
| identities per profile | 5 | 5 | pass |

## Classification

Pass:
- local source and local target guardrails passed
- actual import used the required reset/execute/confirm flags
- target was reset to clean baseline before import
- all expected table counts imported successfully
- all post-import row counts match source counts
- post-import orphan checks are 0
- post-import enum checks are 0
- post-import DateTime checks are 0
- aggregate parity passed
- drift/schema result before import was clean

Review:
- 2 existing self-conversation rows were imported unchanged in parity mode
- these rows should be handled only by a separate cleanup/transform segment if product data cleanup is approved

Fail:
- none recorded

Block:
- none recorded

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `postgres-validation-runtime-smoke-plan`

Goal:
- define a local-only runtime smoke validation plan for running the application against the imported disposable Postgres validation database, without changing active runtime configuration or switching the provider.

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
