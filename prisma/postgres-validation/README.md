# Postgres Validation Prisma Schema

This directory contains validation-only Prisma artifacts for Stage 6 local Postgres baseline review.

Files:
- `schema.prisma` is an isolated Postgres validation schema.
- `migrations/00000000000000_clean_baseline/migration.sql` is the clean local validation baseline generated from the isolated schema.

Guardrails:
- Do not use this schema as the active application schema.
- Do not point active `DATABASE_URL` at Postgres validation.
- Do not edit `prisma/schema.prisma` for validation-only work.
- Do not edit active `prisma/migrations`.
- Do not run data import/export, cleanup, staging, or production cutover from this directory.

Validation env names:
- `POSTGRES_VALIDATION_DATABASE_URL`
- `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Validation command:

```bash
bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma
```

Baseline generation command used for review:

```bash
bun.cmd x prisma migrate diff --from-empty --to-schema-datamodel prisma/postgres-validation/schema.prisma --script
```

The first baseline keeps `relationMode = "prisma"` to preserve the current Prisma-managed relation behavior. The generated SQL therefore has tables, primary keys, enums, unique constraints, and indexes, but does not add database foreign-key constraints.
