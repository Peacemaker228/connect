# Wave 30. Local Postgres Dev Switch

## Goal

Switch local development from MySQL to Postgres without preserving local MySQL data.

This wave is local-development only. It is not the production migration and it is not a staging or production cutover.

## Position in the Main Plan

Mapping:
- `Wave 28 / PRISMA_BOUNDARY_PREP` removed Prisma type/runtime boundary blockers before Stage 6
- `Wave 29 / POSTGRES_PROVIDER_SWITCH_PLAN` planned and validated the Postgres baseline/import path
- `Wave 30 / LOCAL_POSTGRES_DEV_SWITCH` switches local development to Postgres with disposable local data

The production migration remains a later controlled Stage 6 path with export/import, staging rehearsal, backups, rollback, and a self-contained production runbook.

## Scope

Allowed:
- local-only Prisma provider switch to `postgresql`
- local-only `DATABASE_URL`/env example updates
- clean local Postgres schema reset
- minimal local fixtures or manual product-flow data setup
- local API/web smoke checks
- local docs updates

Forbidden:
- targeting staging or production
- treating local disposable-data switch as production migration proof
- deleting production/staging data
- relying on local MySQL data preservation
- mixing production runbook/cutover into local dev implementation

## Local Data Policy

Local MySQL data is disposable for this wave.

The local switch may start from an empty Postgres database or minimal fixtures. Existing local MySQL rows, including the two self-conversation review rows, do not need to be migrated for the local dev switch.

## Expected Segments

1. `local-postgres-dev-switch-implementation`
   - switch active local Prisma schema/provider/env examples to Postgres
   - generate Prisma client for local Postgres
   - apply clean local schema
   - document local reset/setup commands

2. `local-postgres-dev-smoke`
   - run local API/web against Postgres
   - smoke auth/session/profile, servers, members, channels, messages, direct messages, invites, storage metadata, and realtime-adjacent paths where practical
   - document compatibility findings

3. `local-mysql-retirement`
   - after local Postgres dev runtime is stable
   - remove or downgrade local MySQL assumptions from local docs/scripts where appropriate
   - keep production migration tooling and runbook requirements intact

## Current Progress

Done:
- `local-postgres-dev-switch-plan` documented that local development can switch to Postgres without preserving local MySQL data
- `local-postgres-dev-switch-implementation` switched the active local Prisma datasource provider to `postgresql`, added local Postgres `DATABASE_URL` example docs, reset/applied the clean local Postgres schema, and generated the Prisma client
- `local-postgres-dev-smoke` is passed by user report for the migration/runtime path
- Prisma packages were upgraded to `7.8.0`; the repo now uses `prisma.config.ts` for datasource URL resolution and `@prisma/adapter-pg` for backend runtime

Next:
- `local-mysql-retirement`
- remove or downgrade local MySQL assumptions from local docs/scripts where appropriate
- keep staging/production and production runbook work separate

Review:
- microphone/media behavior needs a separate follow-up: mic can appear enabled while speech does not trigger the usual active indicator/audio

## Production Runbook Reminder

Before production cutover, create a separate self-contained production migration runbook.

That runbook must be usable outside this chat context and should include exact commands, expected outputs, backup/restore steps, parity checks, rollback steps, deployment order, secret updates, monitoring checks, and a place to paste server outputs while coordinating with another assistant/session.

## Acceptance Criteria

- local development can run on Postgres
- Prisma CLI/client generation works on Prisma `7.8.0`
- local MySQL data preservation is explicitly out of scope
- production migration remains separate
- staging/production are untouched
- local smoke checks are documented before local MySQL assumptions are retired

## References

- [POSTGRES_PROVIDER_SWITCH_PLAN.md](./POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_069_LOCAL_POSTGRES_DEV_SWITCH_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_069_LOCAL_POSTGRES_DEV_SWITCH_PLAN.md)
- [SEGMENT_BRIEF_071_LOCAL_POSTGRES_DEV_SMOKE_PRISMA7.md](../delegation/briefs/SEGMENT_BRIEF_071_LOCAL_POSTGRES_DEV_SMOKE_PRISMA7.md)
