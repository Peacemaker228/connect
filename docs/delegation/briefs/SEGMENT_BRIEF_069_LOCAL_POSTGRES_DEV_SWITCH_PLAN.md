# Segment 069. Local Postgres Dev Switch Plan

Branch:
- `wave/stage6-local-postgres-dev-switch-plan`

Segment:
- `local-postgres-dev-switch-plan`

## Goal

Define a local development switch from MySQL to Postgres that does not preserve local MySQL data.

This segment is docs-only. It does not change active `DATABASE_URL`, does not edit active `prisma/schema.prisma`, does not change the active Prisma provider, does not edit active migrations, does not change runtime code, does not run local reset/seed, does not clean MySQL data, and does not target staging or production.

## Decision

Local development can switch to Postgres without migrating local MySQL data.

Rationale:
- local data is disposable and small
- preserving local MySQL data is not required for product correctness
- a fresh Postgres local database is simpler and safer than keeping local import tooling on the critical path
- production remains different: production must use a controlled migration with backups, staging rehearsal, parity checks, rollback, and a cutover runbook

The local import rehearsal already completed and remains useful as a proof that:
- the clean Postgres baseline is schema-compatible
- local MySQL data can be imported into Postgres when needed
- parity checks and guardrails exist for future production/staging planning

## Local Dev Switch Strategy

Preferred local path:
1. keep the existing isolated Postgres validation service as the local Postgres starting point, or promote it to a local dev Postgres service after a dedicated implementation segment
2. switch the active Prisma provider to `postgresql` in a scoped implementation segment
3. point local active `DATABASE_URL` to the local Postgres dev database
4. generate the Prisma client from the active Postgres schema
5. apply a clean local schema baseline
6. create minimal local fixtures through seed/manual product flows instead of importing local MySQL data
7. run backend/web smoke checks against the local Postgres runtime

The implementation must be separate from this plan.

## Local Data Policy

Local MySQL data:
- does not need to be preserved
- does not block local Postgres dev switch
- can remain available until the switch is verified
- should not be treated as production migration proof

Local Postgres data:
- can start empty
- may use minimal fixtures
- may be reset freely during local validation
- must not be confused with staging or production data

Self-conversation rows:
- the two local self-conversation rows are not a blocker for local dev switch
- they do not need to be migrated locally
- production/staging data must still be audited independently before any real cutover

## Required Local Implementation Segments

Recommended local implementation sequence:

1. `local-postgres-dev-switch-implementation`
   - switch active local Prisma provider/schema path to Postgres in a scoped branch
   - update local env examples and docs
   - keep production migration out of scope

2. `local-postgres-dev-smoke`
   - run API/web locally against Postgres
   - smoke auth/session/profile, servers, members, channels, messages, direct messages, invites, storage metadata, and realtime-adjacent paths where practical
   - document findings and compatibility fixes

3. `local-mysql-retirement`
   - only after local Postgres dev runtime is stable
   - remove or downgrade local MySQL assumptions from docs/scripts where appropriate
   - keep production migration tooling/runbook intact

## Production Migration Requirement

Production must not follow the local disposable-data path.

Before production cutover, create an explicit production migration runbook that can be used outside this chat context. The runbook must be self-contained enough to share with another assistant/session while operating on the server.

The production runbook must include:
- exact environment inventory checklist
- source MySQL connection verification
- target Postgres provisioning verification
- backup commands and restore verification
- write-freeze or maintenance-window plan
- migration tooling version/commit to use
- export/import steps
- table order and transform rules
- row-count, orphan, enum, DateTime, aggregate, and unique/collation parity checks
- handling for self-conversation/data-cleanup decisions
- application deployment order
- `DATABASE_URL`/secret update steps
- Prisma provider/client generation/deployment steps
- smoke test checklist
- rollback triggers
- rollback commands
- post-cutover monitoring checklist
- a place to paste command outputs and assistant observations from the production environment

This production runbook should be a late Stage 6 artifact after local Postgres runtime is stable and before staging/production cutover.

## Recommended Next Segment

Recommended next segment:
- `local-postgres-dev-switch-implementation`

Goal:
- perform the local-only Postgres dev switch without preserving local MySQL data.

Required constraints:
- do not target staging or production
- do not migrate production data
- do not delete local MySQL data as part of the first switch
- keep production migration/runbook as a separate future path
- document all local env changes

## Verification

Verification performed:
- `git diff --check` passed
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions remain planning/local-validation documentation only
