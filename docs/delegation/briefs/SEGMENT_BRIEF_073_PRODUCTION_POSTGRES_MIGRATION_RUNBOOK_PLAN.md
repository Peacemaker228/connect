# Segment 073. Production Postgres Migration Runbook Plan

Branch:
- `wave/stage6-production-postgres-migration-runbook-plan`

Segment:
- `production-postgres-migration-runbook-plan`

## Goal

Create a self-contained production Postgres migration runbook plan that can be used outside this chat context, without running staging or production migration work.

This segment is docs-only. It does not change `.env.production`, active `DATABASE_URL`, Prisma provider, Prisma schema, migrations, runtime code, or production/staging infrastructure.

## Changed Files

Added:
- `docs/runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md`
- `docs/waves/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_073_PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md`

Updated:
- `docs/waves/POSTGRES_PROVIDER_SWITCH_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Runbook Convention

Existing runbook-like docs found:
- `docs/ax-connect_runbook.md`

Decision:
- add the database migration runbook under `docs/runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md`

Reason:
- the production DB migration needs an operator-facing document with explicit gates, output capture, rollback, and monitoring sections
- keeping it under `docs/runbooks` makes it easier to hand to a later assistant/session without relying on roadmap or wave context

## Runbook Summary

The runbook covers:
- scope and non-goals
- environment inventory
- run metadata and output capture
- preflight checks
- backup plan
- restore verification
- staging rehearsal expectations
- maintenance/write-freeze
- final export/import sequence
- parity checks
- deployment and secret update order
- smoke tests
- rollback triggers and rollback paths
- post-cutover monitoring
- incident notes and final sign-off

Explicit policy captured:
- MySQL remains the production source of truth until cutover completion is declared
- local Postgres development switch is not production proof
- local-only Stage 6 import scripts must not be used against staging or production without a later production-safe tooling segment
- production MySQL data is not deleted by this runbook
- microphone/media follow-up is separate from Stage 6 DB migration

## Go/No-Go Gates Before Staging Or Production

Before staging rehearsal:
- runbook reviewed by an operator who can perform rollback
- target staging Postgres exists
- staging source is a clone or safe rehearsal source, not live production writes
- backup and restore verification process is documented
- parity query groups are selected
- write-freeze and rollback owners are assigned

Before production cutover:
- staging rehearsal completed with pass or accepted review findings
- production MySQL backup completed
- restore verification passed against an isolated restore target
- final cutover window approved
- write-freeze or maintenance mode ready
- production Postgres target provisioned and confirmed safe for import
- release candidate checks passed
- rollback triggers accepted
- rollback owner, monitoring owner, and smoke-test owner available

## Classification

Pass:
- self-contained production migration runbook plan exists
- Stage 6 status and provider-switch plan now point to runbook review before staging/prod work
- production/staging were not touched
- active provider/schema/migrations/runtime were not changed

Review:
- production-safe import tooling is not implemented yet
- staging rehearsal still needs a separately scoped segment
- exact production process restart commands and secret-manager commands must be filled by the operator before cutover

Fail:
- none recorded

Block:
- none recorded

Overall:
- `pass-with-review`

## Recommended Next Segment

Recommended next segment:
- `production-postgres-migration-runbook-review`

Goal:
- review the runbook with an operator, fill environment-specific command placeholders, and decide the staging rehearsal/tooling segment.

Do not start production cutover next. The next implementation path after review should be a separately scoped staging rehearsal plan or production-safe migration tooling segment.

## Verification Performed

Verification performed:
- `git diff --check` passed with existing CRLF warnings on touched docs
- `rg -n "production|staging|rollback|backup|restore|DATABASE_URL|MYSQL_REHEARSAL_SOURCE_DATABASE_URL|POSTGRES|Postgres|MySQL" docs/runbooks docs/waves docs/roadmap docs/delegation` passed
- `bun.cmd x prisma validate` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
