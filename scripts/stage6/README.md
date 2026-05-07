# Stage 6 Scripts

This directory contains local-only Stage 6 tooling. These scripts are not runtime application code.

## MySQL to Postgres Local Import Rehearsal

Script:
- `mysql-postgres-local-import-rehearsal.ts`

Purpose:
- validate local-only source/target URLs
- run preflight and dry-run checks without writing to Postgres
- reset disposable local Postgres validation to the clean baseline only when explicitly confirmed
- run the table-order import only when explicitly confirmed
- report row counts, orphan checks, enum checks, DateTime checks, aggregate parity, and self-conversation counts

Required target env:
- `POSTGRES_VALIDATION_DATABASE_URL`

Preferred source env:
- `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`

Fallback source env:
- historical fallback: `DATABASE_URL`, only if it passes the local MySQL allowlist
- after `Wave 30 / LOCAL_POSTGRES_DEV_SWITCH`, active local `DATABASE_URL` is Postgres, so use `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` explicitly for any MySQL source rehearsal

Preflight:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode preflight
```

Dry-run checks without Postgres writes:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode dry-run
```

Reset disposable Postgres validation to the clean baseline:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode reset-baseline --confirm-disposable-target
```

Actual local import rehearsal:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode import --reset-target --execute-import --confirm-disposable-target
```

Guardrails:
- source URL must be local `mysql`
- target URL must be local `postgresql`
- target must be `POSTGRES_VALIDATION_DATABASE_URL`
- active local `DATABASE_URL` may be Postgres after `Wave 30`; do not rely on it as the MySQL source
- no staging or production target is allowed
- actual import is never the default mode
- actual import requires `--reset-target`, `--execute-import`, and `--confirm-disposable-target`
