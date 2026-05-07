# Wave 31. Production Postgres Migration Runbook Plan

## Goal

Create a self-contained production migration runbook plan before any staging rehearsal or production cutover.

This wave is documentation and operator-planning only. It does not run staging or production migration work.

## Position in the Main Plan

Mapping:
- `Wave 28 / PRISMA_BOUNDARY_PREP` removed Prisma boundary blockers
- `Wave 29 / POSTGRES_PROVIDER_SWITCH_PLAN` planned the provider switch and migration path
- `Wave 30 / LOCAL_POSTGRES_DEV_SWITCH` switched disposable local development to Postgres
- `Wave 31 / PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN` creates the operator-facing production migration runbook plan

## Scope

Allowed:
- production runbook documentation
- operator checklist and output-capture templates
- backup, restore, staging rehearsal, cutover, rollback, and monitoring planning
- roadmap/status updates

Forbidden:
- staging or production changes
- `.env.production` changes
- active `DATABASE_URL` changes
- Prisma provider/schema/migration/runtime changes
- export/import execution
- MySQL data deletion
- microphone/media bug work

## Current Progress

Done:
- `docs/runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md` exists as a self-contained production migration runbook plan
- `production-postgres-migration-runbook-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_073_PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md`
- `production-current-state-inventory-env-gap-audit` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_074_PRODUCTION_CURRENT_STATE_ENV_GAP_AUDIT.md`
- the runbook now includes known production state, current reborn/runtime env requirements, obsolete Clerk/UploadThing env handling, secret rotation requirement, and maintenance-before-cutover sequencing

Next:
- deferred by operator decision until the final production migration window
- when resumed, start `production-reborn-maintenance-deploy-plan`
- define the maintenance/write-freeze mechanism, server env inventory template, PM2/Nginx topology, secret rotation order, and non-DB smoke checklist before any server deploy

## Acceptance Criteria

- production runbook exists and is usable without chat history
- MySQL remains production source of truth until explicit cutover completion
- local Postgres switch is not treated as production proof
- staging/prod are untouched
- rollback, backup, restore verification, parity checks, deployment order, smoke tests, monitoring, and output capture are documented
- production current-state/env gaps are documented without exposing secrets
- future order is explicit: maintenance -> deploy reborn -> maintenance/process smoke -> DB migration/cutover -> full DB-backed smoke

## References

- [PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md](../runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md)
- [POSTGRES_PROVIDER_SWITCH_PLAN.md](./POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_073_PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_073_PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md)
