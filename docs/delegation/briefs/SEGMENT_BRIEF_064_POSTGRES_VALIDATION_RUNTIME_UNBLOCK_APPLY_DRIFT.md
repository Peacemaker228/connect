# Segment 064. Postgres Validation Runtime Unblock Apply Drift

Branch:
- `wave/stage6-postgres-validation-runtime-unblock-apply-drift`

Segment:
- `postgres-validation-runtime-unblock-and-apply-drift-rerun`

## Goal

Apply the isolated Postgres validation baseline to a disposable local Postgres database and capture empty-database schema/drift verification.

This segment did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active `prisma/migrations`, did not change runtime code, did not import/export MySQL data, did not clean data, and did not target staging or production.

## Target

Validation service:
- container: `connect-postgres-validation`
- host: `127.0.0.1`
- port: `5433`
- database: `connect_validation`
- user: `connect_validation`
- URL env name: `POSTGRES_VALIDATION_DATABASE_URL`
- optional shadow URL env name: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Validation schema:
- `prisma/postgres-validation/schema.prisma`

Applied baseline:
- `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`

## Preflight Result

Status:
- pass

Observed:
- Docker CLI was available
- Compose validation service was running and healthy
- TCP check to `127.0.0.1:5433` succeeded
- host `psql` was not available, so the baseline was applied through `psql` inside the validation container
- pre-apply `public` schema had 0 base tables and 0 enum types

## Baseline Apply Result

Result:
- pass

Apply method:
- piped the isolated baseline SQL into `psql` inside `connect-postgres-validation`
- target database was `connect_validation`
- only the isolated `migration.sql` baseline was applied

Apply output summary:
- 4 enum types created
- 10 tables created
- 33 indexes created, including primary-key indexes and explicit unique/non-unique indexes

No active MySQL database or active Prisma schema was used for apply.

## Empty-DB Drift Result

Result:
- pass

Command result:
- Prisma reported `No difference detected.`

Comparison:
- from live `POSTGRES_VALIDATION_DATABASE_URL`
- to `prisma/postgres-validation/schema.prisma`

Shadow DB:
- not required for the drift command used in this segment
- `POSTGRES_VALIDATION_SHADOW_DATABASE_URL` remained available as the optional validation env

## Table / Enum / Index Verification

Tables:
- 10 base tables exist in `public`
- `authidentity`
- `authpasswordcredential`
- `authsession`
- `channel`
- `conversation`
- `directmessage`
- `member`
- `message`
- `profile`
- `server`

Enums:
- `AuthIdentityProvider`: `PASSWORD`
- `AuthSessionStatus`: `ACTIVE`, `REVOKED`
- `ChannelType`: `TEXT`, `AUDIO`, `VIDEO`
- `MemberRole`: `ADMIN`, `MODERATOR`, `GUEST`

Indexes:
- 33 indexes exist in `public`
- primary-key indexes are present for all 10 tables
- expected unique indexes are present for `profile.userId`, `authidentity.provider + subject`, `authsession.refreshTokenHash`, `server.inviteCode`, `member.profileId + serverId`, and `conversation.memberOneId + memberTwoId`
- expected lookup indexes are present for auth, server/member/channel/message/conversation/direct-message relations

Empty row-count verification:
- all 10 application tables have 0 rows after baseline apply

Relation behavior:
- no database foreign-key hardening was introduced in this segment
- validation schema remains on `relationMode = "prisma"`
- this preserves the selected first-baseline relation strategy

## Active Runtime Safety

Confirmed safe boundaries:
- active `prisma/schema.prisma` remains MySQL-backed
- active `prisma/migrations` was not changed
- runtime source code was not changed
- active `DATABASE_URL` was not changed
- no MySQL import/export ran
- no data cleanup ran
- no staging or production target was used

## Blockers Before Import Rehearsal

No blockers remain for the empty Postgres validation schema gate.

Remaining blockers before actual import rehearsal:
- MySQL-to-Postgres export/import tooling is not implemented
- import table order and retry behavior are not implemented
- post-import row-count and aggregate parity checks against Postgres are not implemented
- enum, timestamp, casing/collation, unique constraint, and relation parity checks need to run after import
- the two existing local self-conversation rows remain review/data-cleanup candidates and are not cleaned in this segment
- staging validation, rollback, and cutover runbooks still do not exist

## Recommended Next Segment

Recommended next segment:
- `mysql-to-postgres-local-import-rehearsal-plan`

Goal:
- define the local-only MySQL-to-Postgres import rehearsal sequence, including table order, transform rules, verification queries, retry behavior, and explicit no-production guardrails.

Required constraints:
- keep active `DATABASE_URL` unchanged
- keep active `prisma/schema.prisma` on `provider = "mysql"`
- do not edit active `prisma/migrations`
- do not change runtime code
- do not clean data unless separately approved
- do not target staging or production

## Verification

Verification performed:
- `git diff --check` passed
- `bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma` passed with validation env vars set inline
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions are isolated to validation docs/artifacts
