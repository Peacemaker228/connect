# Segment 072. Local MySQL Retirement

Branch:
- `wave/stage6-local-mysql-retirement`

Segment:
- `local-mysql-retirement`

## Goal

Remove or downgrade local MySQL assumptions after the successful local Postgres development switch, without breaking production/staging migration tooling.

This segment does not delete production migration tooling, does not remove MySQL rehearsal source support, does not change `.env.production`, does not target staging or production, does not delete local MySQL data, does not change Prisma provider/client/runtime, and does not address the microphone/media follow-up.

## Changed Files

Tracked files:
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts`
- `scripts/stage6/README.md`
- `docs/waves/LOCAL_POSTGRES_DEV_SWITCH.md`
- `docs/waves/POSTGRES_PROVIDER_SWITCH_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_072_LOCAL_MYSQL_RETIREMENT.md`

## Scan Summary

Local development state:
- active local development uses Postgres
- active Prisma schema remains `provider = "postgresql"`
- datasource URL resolution remains in `prisma.config.ts`
- backend Prisma runtime remains on the Postgres driver adapter

MySQL assumptions found:
- migration/rehearsal tooling and reports under `scripts/stage6` and Stage 6 briefs
- production/staging migration planning docs
- historical pre-switch reports that intentionally describe older MySQL-backed states
- older production-oriented runbook references

Action taken:
- removed active `DATABASE_URL` fallback as a MySQL source in the rehearsal script
- made `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` the only MySQL source env for rehearsal tooling
- updated local script docs to state that active local `DATABASE_URL` is Postgres and is not used as a MySQL source
- updated Wave 30 and Stage 6 status docs to mark local MySQL assumptions retired/downgraded

## MySQL Mentions Intentionally Kept

Kept intentionally:
- `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts`
- `scripts/stage6/README.md`
- Stage 6 migration/rehearsal reports that document completed historical work
- production migration planning docs and production-oriented runbook references

Reason:
- production migration remains separate and still needs a controlled MySQL source path
- future staging/production rehearsals may need the existing MySQL-to-Postgres tooling
- historical segment reports should not be rewritten to pretend earlier MySQL-backed states did not exist

## Tooling Result

Before this segment:
- MySQL rehearsal tooling could fall back to active `DATABASE_URL` as a MySQL source

After this segment:
- MySQL rehearsal tooling requires `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- active local `DATABASE_URL` can remain Postgres
- attempts to run rehearsal tooling without an explicit MySQL source env fail early
- production/staging targets remain forbidden by existing local host allowlists

## Classification

Pass:
- local MySQL assumptions were downgraded in active local docs/tooling
- active Postgres provider/runtime was not changed
- MySQL rehearsal source support was preserved through explicit env naming
- production/staging migration tooling was not removed
- `.env.production` was not changed
- local MySQL data was not deleted

Review:
- older production-oriented and historical docs still mention MySQL intentionally
- microphone/media issue remains a separate non-database follow-up

Fail:
- none recorded

Block:
- none recorded

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `production-postgres-migration-runbook-plan`

Goal:
- create a self-contained production migration runbook plan before any staging or production cutover.

Required constraints:
- do not target staging or production yet
- do not delete MySQL data
- preserve rollback and backup requirements
- include exact commands, expected outputs, parity checks, deployment order, secret updates, smoke tests, rollback triggers/commands, monitoring checks, and a place to paste server outputs
- keep the microphone/media bug separate from Stage 6 database work

## Verification Performed

Verification performed:
- `git diff --check` passed
- `rg -n "mysql|MySQL|DATABASE_URL|MYSQL_REHEARSAL_SOURCE_DATABASE_URL|POSTGRES_VALIDATION_DATABASE_URL" docs infra scripts prisma package.json` passed; remaining MySQL mentions are explicit rehearsal/prod-migration references or historical reports
- `bun.cmd x prisma validate` passed
- `bun.cmd x prisma generate` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
