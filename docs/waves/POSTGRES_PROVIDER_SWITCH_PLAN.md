# Wave 29. Postgres Provider Switch Plan

## Goal

This wave creates the Stage 6 provider-switch/data-migration plan after `Wave 28 / PRISMA_BOUNDARY_PREP`.

This is a planning wave only. It does not switch Prisma to `postgresql`, does not change database configuration, and does not change runtime behavior.

Wave task:
- define the controlled `MySQL -> Postgres` implementation sequence
- identify the future implementation segments that must happen before cutover
- preserve the stable direct-backend runtime path from `Stage 5A`
- keep the boundary cleanup result from `Wave 28` intact

## Position in the Main Plan

Mapping:
- `Wave 26 / WEB_RUNTIME_API_EXTRACTION` closed the direct-backend runtime/API cleanup
- `Wave 27 / VENDOR_REPO_CLEANUP` closed dead vendor repo cleanup after `Stage 5A`
- `Wave 28 / PRISMA_BOUNDARY_PREP` closed Prisma boundary preparation without a provider switch
- `Wave 29 / POSTGRES_PROVIDER_SWITCH_PLAN` plans the future Stage 6 provider switch and data migration

This wave is not the provider switch. The provider switch must happen only in later implementation segments that are explicitly scoped, verified, and reversible.

## Planning Boundary

Allowed in this wave:
- document the future provider-switch sequence
- define implementation segment order
- define validation, rollback, and cutover requirements
- identify required inventories and decision points
- keep current MySQL-backed runtime behavior unchanged

Forbidden in this wave:
- changing `DATABASE_URL`
- changing Prisma datasource `provider`
- changing `prisma/schema.prisma`
- adding, editing, deleting, or running Prisma migration files as part of the switch
- changing generated Prisma client assumptions for runtime behavior
- changing active database runtime behavior in `apps/api`, `apps/web`, `packages/sdk`, or shared packages
- introducing Postgres-only queries or schema assumptions into active code
- performing data export/import or staging/prod cutover

## Future Implementation Segments

The provider switch should be split into these future segments.

### 1. Schema/provider diff audit

Goal:
- audit the current Prisma schema, migrations, generated client usage, and MySQL-specific assumptions before any switch work

Expected outputs:
- list of schema constructs that may behave differently under `postgresql`
- list of migration history risks
- list of raw SQL, enum, index, default, text/blob/json/date, casing, collation, and constraint concerns
- recommendation for whether to create a new Postgres migration baseline or translate existing migration history

Rules:
- read-only audit
- no `DATABASE_URL` change
- no provider change
- no migration edits
- no runtime behavior change

### 2. Local Postgres environment

Goal:
- define and add the local Postgres development environment only after the audit confirms the target shape

Expected outputs:
- local Postgres service/config plan
- isolated local env variable naming and usage rules
- clear distinction between current MySQL runtime and future Postgres validation runtime
- setup/teardown notes for repeatable developer validation

Rules:
- do not repoint the default application runtime until a later cutover segment
- keep MySQL as the current active provider while local Postgres validation is introduced

### 3. Migration strategy

Goal:
- decide how Prisma schema and database migration history will move from MySQL to Postgres

Expected outputs:
- selected migration approach
- baseline strategy
- migration generation and review process
- handling for destructive or provider-specific differences
- required backup and restore assumptions
- acceptance criteria for schema parity

Decision points:
- translate existing migration history versus create a clean Postgres baseline
- Prisma-native migration path versus explicit SQL/data-migration tooling
- how to validate generated SQL before any environment cutover

### 4. Data export/import

Goal:
- define and implement a repeatable data transfer path from MySQL to Postgres

Expected outputs:
- export/import tooling or documented command sequence
- table order and dependency handling
- ID, enum, timestamp, JSON, nullability, unique constraint, and relation validation
- row counts and checksum/parity checks
- handling for large tables and retry behavior

Rules:
- run first against disposable local data
- then run against staging data only after rollback and validation plans exist

### 5. Staging validation

Goal:
- prove that the application works against Postgres in a controlled staging environment

Expected outputs:
- staging Postgres deployment/config
- staging migration runbook
- smoke test checklist for auth, servers, channels, members, invites, messages, direct messages, storage metadata, and realtime paths
- query/performance sanity checks
- Prisma client generation and deployment verification

Rules:
- staging validation must happen before production cutover
- failures must produce fixes or rollback, not ad hoc production changes

### 6. Rollback

Goal:
- make the provider switch reversible before production cutover is attempted

Expected outputs:
- backup requirements
- restore procedure
- rollback trigger criteria
- app/runtime rollback steps
- data divergence handling for failed or partially completed cutover
- owner checklist for go/no-go

Rules:
- no production cutover without a tested rollback path
- rollback must cover both database state and application configuration

### 7. Cutover

Goal:
- switch production runtime from MySQL to Postgres in a controlled, observable segment

Expected outputs:
- production cutover runbook
- maintenance window or write-freeze decision
- final export/import execution steps
- final parity checks
- `DATABASE_URL` and Prisma provider change steps
- deployment order
- monitoring and post-cutover validation checklist

Rules:
- cutover must be its own implementation segment
- cutover must not be combined with unrelated auth, storage, media, web-shell, or SDK work
- runtime behavior changes must be limited to the database provider switch and required compatibility fixes

## Acceptance Criteria for This Planning Wave

- future provider-switch implementation segments are explicitly ordered
- `Wave 28` remains closed as boundary-prep only
- this wave clearly states that it is planning-only
- forbidden changes are explicit for `DATABASE_URL`, Prisma provider, `schema.prisma`, migrations, and runtime behavior
- the next implementation segment after this planning wave is `schema/provider diff audit`

## Verification

Required verification for this planning wave:

```bash
git diff --check
rg -n "provider =|DATABASE_URL|postgresql|mysql" prisma docs apps packages src
```

Expected result:
- documentation may mention future `postgresql` and current `mysql`
- active runtime code, Prisma provider, `DATABASE_URL`, and migrations must remain unchanged by this planning wave

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [PRISMA_BOUNDARY_PREP.md](./PRISMA_BOUNDARY_PREP.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
