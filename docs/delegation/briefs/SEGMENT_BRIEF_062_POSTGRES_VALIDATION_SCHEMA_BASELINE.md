# Segment 062. Postgres Validation Schema Baseline

Branch:
- `wave/stage6-postgres-validation-schema-baseline`

Segment:
- `postgres-validation-schema-baseline`

## Goal

Create an isolated Postgres validation Prisma schema path and generate/review a clean local validation baseline for Stage 6 without changing the active MySQL runtime.

This segment did not change active `DATABASE_URL`, did not edit active `prisma/schema.prisma`, did not change the active Prisma provider, did not edit active `prisma/migrations`, did not change runtime code, did not import/export data, did not clean data, and did not perform staging or production cutover.

## Added Validation Artifacts

Validation-only Prisma path:
- `prisma/postgres-validation/schema.prisma`

Generated baseline:
- `prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql`

Local documentation:
- `prisma/postgres-validation/README.md`

Infra documentation update:
- `infra/postgres/README.md`

The active application schema remains:
- `prisma/schema.prisma`
- `provider = "mysql"`
- `url = env("DATABASE_URL")`
- `relationMode = "prisma"`

## Validation Schema Strategy

Datasource:
- provider: `postgresql`
- URL env: `POSTGRES_VALIDATION_DATABASE_URL`
- shadow URL env: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`
- relation strategy: `relationMode = "prisma"`

Relation strategy decision:
- preserve the current Prisma-managed relation behavior for the first Postgres validation baseline
- defer database foreign-key hardening to a later explicit segment
- keep relation/index parity visible while avoiding an implicit behavior change during the first baseline

Generation command used for review:

```bash
bun.cmd x prisma migrate diff --from-empty --to-schema-datamodel prisma/postgres-validation/schema.prisma --script
```

Validation command:

```bash
bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma
```

No baseline was applied to a database in this segment.

## Generated Baseline Review

Enums:
- `AuthIdentityProvider`: `PASSWORD`
- `AuthSessionStatus`: `ACTIVE`, `REVOKED`
- `MemberRole`: `ADMIN`, `MODERATOR`, `GUEST`
- `ChannelType`: `TEXT`, `AUDIO`, `VIDEO`

Mapped table names:
- `profile`
- `authidentity`
- `authpasswordcredential`
- `authsession`
- `server`
- `member`
- `channel`
- `message`
- `conversation`
- `directmessage`

Primary keys:
- all current model primary keys are represented as `TEXT NOT NULL` primary keys
- `authpasswordcredential.identityId` remains the primary key for the one-to-one credential row

Unique constraints:
- `profile.userId`
- `authidentity.provider, authidentity.subject`
- `authsession.refreshTokenHash`
- `server.inviteCode`
- `member.profileId, member.serverId`
- `conversation.memberOneId, conversation.memberTwoId`

Indexes:
- profile/member/server/channel/message/direct-message relation lookup indexes are present
- auth lookup indexes are present for `profileId`, `userId`, `status`, `refreshTokenExpiresAt`, and `emailNormalized`
- conversation lookup indexes are present for both member sides

Relation behavior:
- the generated SQL does not contain database foreign-key constraints
- this matches the selected first baseline strategy with `relationMode = "prisma"`
- cascade behavior remains Prisma-managed for validation baseline purposes

DateTime/defaults:
- `createdAt` fields map to `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updatedAt` fields map to `TIMESTAMP(3) NOT NULL` and remain Prisma-managed via `@updatedAt`
- enum defaults are preserved for session status, member role, and channel type
- boolean `deleted` defaults are preserved as `false`

Text/native types:
- `@db.Text` maps to Postgres `TEXT`
- `@db.VarChar(191)` maps to `VARCHAR(191)`
- string id fields remain `TEXT`; `@default(uuid())` remains Prisma/client generated rather than a database UUID column default

Review result:
- baseline generation succeeded
- isolated schema validation succeeded
- no Prisma shadow-database limitation blocked generation
- no active MySQL runtime files were changed

## Blockers Before Import Rehearsal

Remaining blockers:
- baseline has not been applied to the disposable local Postgres validation database
- empty-database drift check against local Postgres has not been captured
- MySQL-to-Postgres export/import tooling does not exist yet
- import table order and retry behavior are not implemented yet
- post-import parity checks have not been run against Postgres
- the two existing local self-conversation rows remain review/data-cleanup candidates and are not cleaned in this segment
- staging validation, rollback, and cutover runbooks still do not exist

## Recommended Next Segment

Recommended next segment:
- `postgres-validation-baseline-apply-and-drift-check`

Goal:
- apply the isolated clean baseline to disposable local Postgres validation only and capture empty-database schema/drift verification.

Required constraints:
- keep active `DATABASE_URL` unchanged
- keep active `prisma/schema.prisma` on `provider = "mysql"`
- do not edit active `prisma/migrations`
- do not change runtime code
- do not import/export or clean data in the baseline apply/drift segment unless separately approved

## Verification

Verification performed:
- `git diff --check` passed
- provider/env grep confirmed active `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`; Postgres mentions are isolated to validation docs/artifacts
- `bun.cmd x prisma validate --schema prisma/postgres-validation/schema.prisma` passed with validation env vars set from the local validation example
- `bun.cmd x prisma migrate diff --from-empty --to-schema-datamodel prisma/postgres-validation/schema.prisma --script` generated the clean baseline SQL
- baseline review confirmed enums, mapped table names, primary keys, unique constraints, indexes, relation behavior, DateTime/default behavior, and native text/varchar mapping
