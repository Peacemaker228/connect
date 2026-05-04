# Segment 065. MySQL Postgres Local Import Rehearsal Plan

Branch:
- `wave/stage6-mysql-postgres-local-import-rehearsal-plan`

Segment:
- `mysql-to-postgres-local-import-rehearsal-plan`

## Goal

Define the local-only MySQL-to-Postgres import rehearsal plan after the isolated Postgres validation baseline was applied and verified with no empty-database drift.

This segment is docs-only. It does not execute MySQL export, does not execute Postgres import, does not clean data, does not change active `DATABASE_URL`, does not edit active `prisma/schema.prisma`, does not change the active Prisma provider, does not edit active migrations, does not change runtime code, and does not target staging or production.

## Guardrails

Local-only boundaries:
- source must be local current MySQL only
- target must be disposable local Postgres validation only
- production, staging, managed cloud databases, and shared developer databases are out of scope
- application runtime must remain on active MySQL
- active `DATABASE_URL` must not be repointed to Postgres

Required environment names:
- source candidate for future tooling: `MYSQL_REHEARSAL_SOURCE_DATABASE_URL`
- allowed source fallback for manual local run: current local MySQL `DATABASE_URL`, only if host allowlist confirms `localhost` or `127.0.0.1`
- target: `POSTGRES_VALIDATION_DATABASE_URL`
- optional validation shadow URL: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Source safety checks before any future run:
- source URL scheme must be `mysql`
- source host must be `localhost` or `127.0.0.1`
- source database must match the intended local current MySQL database
- source must be read-only for export phase
- source must not point to staging or production

Target safety checks before any future run:
- target URL scheme must be `postgresql`
- target host must be `localhost` or `127.0.0.1`
- target database must be the disposable validation database
- target schema must match `prisma/postgres-validation/schema.prisma`
- target must pass empty-database drift verification before import

## Baseline Reset Requirement

Before each actual local import rehearsal:
- reset disposable local Postgres validation to a clean empty state
- reapply only `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`
- verify empty target has 10 tables, 4 enum types, 33 indexes, and 0 rows across application tables
- run Prisma drift check from `POSTGRES_VALIDATION_DATABASE_URL` to `prisma/postgres-validation/schema.prisma`
- proceed only if Prisma reports no difference

Reset strategy:
- preferred: recreate the disposable validation database/volume and reapply the clean baseline
- acceptable: use a separately approved validation-only reset script that proves the target is empty before reapplying baseline
- not acceptable: partial cleanup of target rows followed by a resumed import without full target verification

## Table Order

The first Postgres validation schema uses `relationMode = "prisma"`, so the database does not enforce foreign keys. The import order should still follow logical application relations to preserve reviewability and make failures easier to diagnose.

Recommended table order:

| order | table | depends on | notes |
|---:|---|---|---|
| 1 | `profile` | none | root identity/profile data |
| 2 | `authidentity` | `profile` | preserves auth identity ownership |
| 3 | `authpasswordcredential` | `authidentity` | one-to-one password credential |
| 4 | `authsession` | `profile` | session state references profiles |
| 5 | `server` | `profile` | server ownership references profiles |
| 6 | `member` | `profile`, `server` | membership bridge and roles |
| 7 | `channel` | `profile`, `server` | channel ownership and server membership context |
| 8 | `message` | `member`, `channel` | channel messages |
| 9 | `conversation` | `member` | direct-message conversation member pair |
| 10 | `directmessage` | `member`, `conversation` | direct messages |

Import tooling must validate relation references before and after import because `relationMode = "prisma"` does not create database foreign-key constraints.

## Transform Rules

IDs:
- preserve existing string IDs exactly
- do not regenerate UUIDs
- do not convert string IDs to Postgres `uuid` columns in this baseline

Enums:
- preserve enum strings exactly
- fail on values outside the Postgres enum definitions
- expected values:
  - `AuthIdentityProvider`: `PASSWORD`
  - `AuthSessionStatus`: `ACTIVE`, `REVOKED`
  - `MemberRole`: `ADMIN`, `MODERATOR`, `GUEST`
  - `ChannelType`: `TEXT`, `AUDIO`, `VIDEO`

DateTime:
- preserve timestamps with millisecond precision where available
- confirm MySQL-to-Postgres timezone handling before import tooling writes rows
- preserve nullable auth timestamps as null when source is null
- validate `updatedAt >= createdAt` where applicable

Text/varchar:
- preserve `Text` fields as Postgres `TEXT`
- preserve `VarChar(191)` fields and fail if values exceed the target length
- keep file URL and password hash text values unchanged

Boolean:
- map MySQL boolean-compatible values to Postgres boolean values
- preserve `deleted = false` defaults only for missing target writes; exported explicit values should win

Nullability:
- preserve nulls for nullable fields
- fail if any required target column would receive null

JSON/Bytes:
- current schemas do not define `Json` or `Bytes` fields
- any future addition must be audited before import tooling handles it

## Unique / Case / Collation Risks

Postgres uniqueness and comparisons can differ from MySQL collation behavior. The data audit found no blocking normalized duplicates, but the future rehearsal must rerun those checks immediately before export.

Required duplicate checks:
- `profile.userId`
- `profile.email` as review-only normalized duplicate check
- `authidentity.provider + subject`
- `authidentity.emailNormalized`
- `authsession.refreshTokenHash`
- `server.inviteCode`
- `member.profileId + serverId`
- `conversation.memberOneId + memberTwoId`

Pass requirement:
- no duplicate group that would violate a Postgres unique index

Review requirement:
- any duplicate that only becomes meaningful under changed case/collation behavior must be documented before import

## Self-Conversation Rows

Current local MySQL has two `conversation` rows where `memberOneId == memberTwoId`.

Policy:
- new self-conversations are blocked by backend/web guards
- existing rows are review/data-cleanup candidates
- this planning segment does not clean them

First rehearsal handling:
- import them unchanged in parity mode unless a separate cleanup/transform segment is approved first
- classify them as review findings after import
- verify both rows still have 0 direct messages if parity mode imports them

Alternative handling:
- a later explicit cleanup or transform segment may exclude them from rehearsal imports, but that must be separately scoped because it changes data parity

## Verification Queries / Checks

Pre-export MySQL checks:
- rerun Segment 059/060 query groups against local MySQL
- confirm orphan counts are zero
- confirm invalid enum counts are zero
- confirm normalized duplicate checks are clear
- confirm DateTime null/range/order checks are clear
- capture row counts and aggregate parity snapshots

Post-baseline Postgres checks before import:
- 10 expected application tables exist
- 4 expected enum types exist
- 33 expected indexes exist
- all application tables have 0 rows
- Prisma drift reports no difference

Post-import Postgres checks:
- row count parity by table
- orphan checks by logical relation
- enum inventory parity
- normalized duplicate checks
- DateTime null/range/order sanity
- aggregate parity:
  - members per server
  - channels per server
  - messages per channel
  - direct messages per conversation
  - identities per profile
- self-conversation review count
- application table row totals must match the selected parity mode

## Retry Behavior

The first rehearsal should prefer full reset/retry over partial resume.

On any import failure:
- stop the run
- capture failing table, source row identifier when available, and error details
- do not continue importing dependent tables
- reset the disposable Postgres validation target back to clean baseline
- rerun from the first table after fixing tooling or transform rules

Partial retry rule:
- partial table-level retry is not allowed in the first rehearsal unless a later segment explicitly adds idempotent import semantics and validates them

## Pass / Review / Fail / Block Criteria

Pass:
- source and target safety checks are local-only
- target baseline is clean and drift-free before import
- all selected tables import successfully
- row counts match selected parity mode
- orphan checks are zero
- invalid enum counts are zero
- Postgres unique constraints are satisfied
- aggregate parity matches source snapshots

Review:
- two existing self-conversation rows are imported unchanged in parity mode
- local/test channels or conversations with zero messages remain present
- timestamp precision differences are explainable and non-breaking
- case/collation differences are documented but do not violate constraints

Fail:
- any table row count mismatch outside the selected parity mode
- any orphan row after import
- any invalid enum value
- any unique constraint violation
- any required field nullability violation
- any unreviewed DateTime conversion discrepancy

Block:
- source or target is not local
- target baseline is not clean before import
- Prisma drift exists before import
- active `DATABASE_URL` or active schema/provider would need to change
- import tooling cannot prove no staging/production target is used

## Blockers Before Actual Local Import Rehearsal

Remaining blockers:
- import/export tooling does not exist yet
- no source/target URL allowlist implementation exists yet
- no scripted reset-to-clean-baseline command exists yet
- no executable post-import parity query pack exists for Postgres yet
- no run report template exists for import rehearsal results
- decision still needed on parity-mode import versus separate cleanup/transform for the two self-conversation rows

## Recommended Next Segment

Recommended next segment:
- `mysql-to-postgres-local-import-rehearsal-tooling`

Goal:
- implement local-only import rehearsal tooling and verification scripts with strict source/target allowlists, reset-to-baseline preflight, table-order import, and post-import parity reporting.

Required constraints:
- do not change active `DATABASE_URL`
- do not edit active `prisma/schema.prisma`
- do not change active provider or active migrations
- do not change runtime code
- do not target staging or production
- do not clean data unless a separate cleanup/transform segment is approved

## Verification

Verification performed:
- `git diff --check` passed
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions are isolated to validation docs/artifacts
