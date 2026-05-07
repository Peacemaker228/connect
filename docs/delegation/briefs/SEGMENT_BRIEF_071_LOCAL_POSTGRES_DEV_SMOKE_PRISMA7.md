# Segment 071. Local Postgres Dev Smoke and Prisma 7 Upgrade

Branch:
- `wave/stage6-local-postgres-dev-smoke`

Segment:
- `local-postgres-dev-smoke`
- `prisma-7-local-upgrade`

## Goal

Smoke local development on Postgres and update Prisma packages after the local Postgres switch.

This segment is local-development only. It does not target staging or production, does not perform production migration, and does not change production env.

## Changed Files

Tracked files:
- `package.json`
- `bun.lock`
- `prisma.config.ts`
- `prisma/schema.prisma`
- `prisma/postgres-validation/schema.prisma`
- `apps/api/src/common/database/prisma.service.ts`
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_071_LOCAL_POSTGRES_DEV_SMOKE_PRISMA7.md`
- `docs/waves/LOCAL_POSTGRES_DEV_SWITCH.md`
- `docs/waves/POSTGRES_PROVIDER_SWITCH_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Implementation Summary

Prisma packages:
- upgraded `prisma` from `5.22.0` to `7.8.0`
- upgraded `@prisma/client` from `5.22.0` to `7.8.0`
- added `@prisma/adapter-pg`
- added `pg`
- added direct `dotenv` dependency for `prisma.config.ts`

Prisma 7 compatibility:
- moved datasource URL resolution out of Prisma schema into root `prisma.config.ts`
- removed datasource `url` from active `prisma/schema.prisma`
- removed datasource URL fields from validation-only `prisma/postgres-validation/schema.prisma`
- updated backend `PrismaService` to construct `PrismaClient` with `PrismaPg` adapter
- updated local import rehearsal drift check to use Prisma 7 `migrate diff` flags:
  - `--from-config-datasource`
  - `--to-schema`

Local smoke:
- user reported migration/local Postgres smoke passed
- user reported a separate microphone/media issue: mic appears enabled, but speaking does not trigger the usual active indicator and audio is absent
- microphone issue is tracked as a media follow-up, not as a Postgres migration blocker

## Verification Performed

Passed:
- `bun.cmd x prisma --version`
- `bun.cmd x prisma validate`
- `bun.cmd x prisma generate`
- `bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma`
- `bun.cmd x prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`
- `bun.cmd x prisma migrate diff --from-empty --to-schema prisma/postgres-validation/schema.prisma --script`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`
- `git diff --check`

Notes:
- `next lint` keeps the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`
- `scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode preflight` now requires explicit `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` if active local `DATABASE_URL` points to Postgres

## Result

Classification:
- migration/local Postgres smoke: `pass` by user report
- automated Prisma/schema/type verification: `pass`
- microphone/media: `review`, separate non-migration bug

Blockers:
- none for local Postgres dev switch

## Recommended Next Segment

Recommended next segment:
- `local-mysql-retirement`

Goal:
- remove or downgrade local MySQL assumptions from local docs/scripts where appropriate
- keep production migration tooling and production runbook requirements intact

