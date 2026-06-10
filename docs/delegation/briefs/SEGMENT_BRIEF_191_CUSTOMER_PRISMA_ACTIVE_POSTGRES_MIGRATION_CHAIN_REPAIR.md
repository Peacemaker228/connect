# Segment Brief 191: Customer Prisma Active Postgres Migration Chain Repair

## Metadata

- Branch: `feature/customer-prisma-active-postgres-migration-chain-repair`
- Base: `feature/customer-unread-message-badges-foundation` at `750d19c`
- Segment: `customer-prisma-active-postgres-migration-chain-repair`
- Type: active Prisma/Postgres migration-chain repair
- Status: `pass / implemented locally; staging operator action pending`

## Goal

Repair the active Prisma migration chain so the unread read-state migration can be applied through normal Prisma migration workflow without DB reset and without touching staging or production data.

## Problem

Active Prisma datasource is PostgreSQL:

```prisma
datasource db {
  provider     = "postgresql"
  relationMode = "prisma"
}
```

Before this segment, active `prisma/migrations` contained:

- `20260501120000_remove_clerk_identity_provider`
  - invalid for active PostgreSQL;
  - contained MySQL backticks and `MODIFY ENUM`;
  - failed `prisma migrate dev` on the shadow database.
- `20260610120000_add_unread_read_state`
  - valid additive PostgreSQL unread migration.

There was no active clean PostgreSQL baseline in `prisma/migrations`.

## Local Migration State Before Repair

Local active `DATABASE_URL` resolved to:

- provider: PostgreSQL
- host: `localhost`
- port: `5433`
- database: `connect_validation`

Local DB inventory before repair:

- tables existed for the pre-unread schema;
- `_prisma_migrations` did not exist;
- therefore `20260501120000_remove_clerk_identity_provider` was not applied in the local active PostgreSQL DB.

`bun.cmd x prisma migrate status` before repair reported both active migrations as not applied.

## Changes

- Added active clean PostgreSQL baseline:
  - `prisma/migrations/00000000000000_clean_baseline/migration.sql`
  - source: `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`
  - represents the current pre-unread PostgreSQL schema.
- Removed the invalid active MySQL-only migration:
  - `prisma/migrations/20260501120000_remove_clerk_identity_provider/migration.sql`
- Kept unread migration after baseline:
  - `prisma/migrations/20260610120000_add_unread_read_state/migration.sql`

Active chain is now:

1. `00000000000000_clean_baseline`
2. `20260610120000_add_unread_read_state`

## Existing DB Handling

For an existing PostgreSQL DB that already has the pre-unread schema but has no Prisma migration history, do not reset the DB.

Safe local/staging flow:

```bash
bun.cmd x prisma migrate resolve --applied 00000000000000_clean_baseline
bun.cmd x prisma migrate deploy
```

Meaning:

- baseline is recorded as already applied because the schema already exists;
- deploy applies only pending migrations, including unread read-state;
- no schema reset is required.

For an empty PostgreSQL DB:

```bash
bun.cmd x prisma migrate deploy
```

This applies baseline and unread from scratch.

If `_prisma_migrations` already contains `20260501120000_remove_clerk_identity_provider` in a relevant PostgreSQL DB, stop and inspect before deploy. That state was not present locally and must be handled explicitly by an operator because the invalid migration has been retired from the active chain.

## Staging Operator Inspection

Do not run destructive commands on staging.

Operator can inspect staging migration state with a redacted DB URL on the staging host:

```bash
psql "$DATABASE_URL" -c 'SELECT migration_name, finished_at IS NOT NULL AS applied, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY started_at;'
```

If `_prisma_migrations` is missing but the pre-unread schema exists, use the baseline resolve flow above, then `migrate deploy`.

## Verification

Passed:

```bash
bun.cmd x prisma validate
bun.cmd x prisma migrate resolve --applied 00000000000000_clean_baseline
bun.cmd x prisma migrate dev
bun.cmd x prisma migrate status
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
```

Fresh local Postgres proof:

- created temporary local database `connect_migration_chain_smoke_20260610134602`;
- ran `bun.cmd x prisma migrate deploy`;
- Prisma applied:
  - `00000000000000_clean_baseline`;
  - `20260610120000_add_unread_read_state`;
- verified expected tables including `_prisma_migrations`, `channelreadstate`, and `conversationreadstate`;
- dropped only the temporary local database after proof.

Current local `connect_validation` migration table now contains:

- `00000000000000_clean_baseline`
- `20260610120000_add_unread_read_state`

## Not Touched

- staging data;
- production data;
- production cutover/runbook;
- DB reset or `db push --force-reset`;
- unread feature behavior;
- storage/S3;
- WebRTC/media;
- mentions/sound.

## Result

The active Prisma/PostgreSQL migration chain is repaired. The unread migration can now be applied through normal Prisma workflow. The unread branch is eligible for local migration-backed two-user smoke after operator-safe staging migration handling is confirmed.
