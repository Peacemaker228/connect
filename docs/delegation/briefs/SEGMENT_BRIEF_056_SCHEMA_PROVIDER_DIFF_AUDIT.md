# Segment 056. Schema Provider Diff Audit

Branch:
- `wave/stage6-schema-provider-diff-audit`

Segment:
- `schema-provider-diff-audit`

## Goal

Read-only audit of the current Prisma/MySQL schema before a future `MySQL -> Postgres` provider switch.

This segment is an audit/report only. It does not change `DATABASE_URL`, `prisma/schema.prisma`, Prisma datasource provider, migrations, or runtime code.

## Required Reading

- [POSTGRES_PROVIDER_SWITCH_PLAN.md](../../waves/POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [schema.prisma](../../../prisma/schema.prisma)
- [20260501120000_remove_clerk_identity_provider/migration.sql](../../../prisma/migrations/20260501120000_remove_clerk_identity_provider/migration.sql)

## Current Datasource State

Current Prisma datasource:
- provider: `mysql`
- URL source: `env("DATABASE_URL")`
- `relationMode = "prisma"`

Current generator:
- `prisma-client-js`

Current migration state:
- the repository has one migration file: `20260501120000_remove_clerk_identity_provider/migration.sql`
- that migration is a destructive MySQL-specific cleanup for the legacy `CLERK` auth identity provider
- the repository does not contain a full schema-creation migration baseline for the current models

## Schema Inventory

Models:
- `Profile`
- `AuthIdentity`
- `AuthPasswordCredential`
- `AuthSession`
- `Server`
- `Member`
- `Channel`
- `Message`
- `Conversation`
- `DirectMessage`

Enums:
- `AuthIdentityProvider`
- `AuthSessionStatus`
- `MemberRole`
- `ChannelType`

Mapped table names:
- all models use lower-case `@@map(...)` names such as `profile`, `authidentity`, `authsession`, `server`, `member`, `channel`, `message`, `conversation`, and `directmessage`

Primary IDs:
- most models use `String @id @default(uuid())`
- `AuthPasswordCredential.identityId` uses a shared primary key relation to `AuthIdentity`
- `AuthSession.id` is a `String @id` supplied by application token/session code

Native column annotations:
- `@db.Text`: profile image/email, password hash, message content/file URLs, server image URL, auth metadata text
- `@db.VarChar(191)`: auth identity subject/emailNormalized, refresh token hash, IP address

Indexes and unique constraints:
- single-field unique: `Profile.userId`, `Server.inviteCode`, `AuthSession.refreshTokenHash`
- compound unique: `AuthIdentity(provider, subject)`, `Member(profileId, serverId)`, `Conversation(memberOneId, memberTwoId)`
- indexes exist on relation IDs, auth status, auth refresh expiry, and conversation member pairs

Relations:
- all domain/auth ownership relations use `onDelete: Cascade`
- schema-level relation behavior currently depends on Prisma relation mode rather than a documented database foreign-key migration baseline in this repo

## Migration Inventory

Only migration file:

```sql
DELETE FROM `authpasswordcredential`
WHERE `identityId` IN (
  SELECT `id`
  FROM `authidentity`
  WHERE `provider` = 'CLERK'
);

DELETE FROM `authidentity`
WHERE `provider` = 'CLERK';

ALTER TABLE `authidentity`
MODIFY `provider` ENUM('PASSWORD') NOT NULL;
```

Migration risks:
- uses MySQL identifier quoting with backticks
- uses MySQL `MODIFY ... ENUM(...)` syntax
- assumes a pre-existing `authidentity` table and pre-existing MySQL enum shape
- is destructive and data-dependent
- cannot be translated into a full Postgres baseline because it is only a delta, not the full schema history

## Runtime Prisma Usage in `apps/api`

Prisma access remains backend-owned:
- `apps/api/src/common/database/prisma.service.ts` extends `PrismaClient`
- `PrismaService` is exported through `CommonModule`
- active domain/auth modules inject `PrismaService`

Generated Prisma imports are limited to backend code:
- `MemberRole`, `ChannelType`, `AuthIdentityProvider`, `AuthSessionStatus`
- `Prisma.PrismaClientKnownRequestError` for `P2002` handling in invite join
- `type Profile` in auth identity registration/login

Runtime query shape:
- no `$queryRaw` or `$executeRaw` usage found in `apps/api`
- no provider-specific raw SQL found in runtime code
- backend uses normal Prisma Client calls: `findUnique`, `findFirst`, `findMany`, `create`, `update`, `updateMany`, `delete`, nested writes/deletes, relation filters, cursor pagination, and one `$transaction`

Provider-diff-sensitive runtime paths:
- invite join catches `P2002`; this should remain Prisma-provider-level behavior, but must be tested against Postgres
- message/direct-message pagination orders by `createdAt` with cursor `id`; timestamp precision and tie ordering should be smoke-tested after provider switch
- role ordering uses `orderBy: { role: 'asc' }`; enum ordering must be preserved if the Postgres enum definition changes
- nested writes and deletes depend on relation behavior remaining consistent under the selected Postgres relation/foreign-key strategy

## MySQL-Specific Risk Findings

### 1. Missing full migration baseline

Risk:
- current migrations do not describe how to create the current schema from an empty database
- the only checked-in migration is a MySQL-specific destructive enum cleanup

Impact:
- `prisma migrate deploy` against a fresh Postgres database cannot be based on the current migration history as-is
- translating migration history is not reliable because the history is incomplete

Provider-switch status:
- blocking for provider switch

Recommendation:
- create a clean Postgres baseline from the current validated Prisma schema after deciding the target relation strategy

### 2. MySQL native enum migration

Risk:
- the existing migration uses `ALTER TABLE ... MODIFY ... ENUM(...)`
- Postgres enum creation/alteration has different SQL and cannot run this migration as-is

Impact:
- migration translation would require custom Postgres SQL and data-state assumptions
- enum values and enum order must be explicitly validated for `MemberRole`, `ChannelType`, `AuthSessionStatus`, and `AuthIdentityProvider`

Provider-switch status:
- blocking for migration-history translation

Recommendation:
- avoid translating this migration directly; include the final enum state in a new Postgres baseline

### 3. `relationMode = "prisma"` and cascade behavior

Risk:
- schema uses `onDelete: Cascade` broadly, while relation ownership is configured through Prisma relation mode
- the repo does not contain a migration baseline that proves database-level foreign keys or cascade constraints

Impact:
- if Postgres is introduced with database foreign keys, existing orphaned rows would block import or constraint creation
- if Postgres keeps Prisma-managed relations, runtime behavior may stay closer to current behavior but database integrity remains application-enforced

Provider-switch status:
- blocking decision before schema baseline

Recommendation:
- choose relation strategy before generating a Postgres baseline
- run an orphan-data audit before any import if database foreign keys are introduced

### 4. Native string/text annotations

Risk:
- schema uses MySQL-oriented `@db.VarChar(191)` for indexed auth fields and `@db.Text` for long text fields
- these annotations are not inherently wrong for Postgres, but they need target-provider validation before baseline generation

Impact:
- auth unique/indexed fields may remain length-limited by design even if Postgres does not need the MySQL index-length workaround
- text fields should be validated for storage metadata, message content, file URLs, and password hashes

Provider-switch status:
- not blocking by itself

Recommendation:
- keep existing logical field types for the first provider switch
- do not combine provider switch with broad type widening or ID/type redesign

### 5. Collation, casing, and identifier behavior

Risk:
- MySQL deployments are often case-insensitive by default for string comparison, while Postgres defaults are case-sensitive
- mapped table names are lower-case, but unmapped field/column names include camelCase such as `userId`, `profileId`, and `createdAt`

Impact:
- raw SQL and migration SQL must quote or map identifiers correctly
- unique behavior for normalized auth fields should be safe only if normalization remains enforced
- any existing data that relied on case-insensitive comparison could behave differently after switch

Provider-switch status:
- partially blocking until data audit confirms normalized fields and no duplicate logical identities

Recommendation:
- validate `AuthIdentity.subject`, `AuthIdentity.emailNormalized`, `Profile.email`, and invite codes for case/collation assumptions before import

### 6. Date/time defaults and ordering

Risk:
- schema uses `@default(now())`, `@updatedAt`, and multiple ordered `DateTime` queries
- MySQL and Postgres differ in timestamp storage, precision, timezone handling, and generated SQL defaults

Impact:
- message pagination and server/channel ordering should be smoke-tested with duplicate or close timestamps
- auth expiry comparisons must be validated against Postgres DateTime values

Provider-switch status:
- not blocking by itself

Recommendation:
- include DateTime parity checks in staging validation

### 7. UUID/CUID strategy

Risk:
- IDs mostly use `String @id @default(uuid())`, not database-native UUID columns
- application code also generates `randomUUID()` for `userId`, `inviteCode`, and session IDs

Impact:
- keeping string IDs should make first provider switch simpler
- converting to Postgres-native `uuid` during the switch would add avoidable data-cast risk

Provider-switch status:
- not blocking if IDs stay as strings

Recommendation:
- do not change ID storage type in the provider-switch segment

### 8. Raw SQL

Risk:
- runtime raw SQL was not found
- migration raw SQL exists and is MySQL-specific

Impact:
- runtime provider switch risk from raw SQL is low
- migration-history translation risk remains high

Provider-switch status:
- runtime: not blocking
- migration history: blocking

Recommendation:
- keep runtime code on Prisma Client APIs
- do not translate the current MySQL SQL migration directly into the future Postgres path

## Recommendation: Baseline vs Translate Migration History

Recommended path:
- create a clean Postgres baseline from the current Prisma schema after resolving relation strategy and data parity checks

Do not translate the existing migration history as the primary path.

Reason:
- the current migration history is incomplete
- the only migration is a MySQL-specific destructive enum cleanup
- translating it would not create the full schema and would preserve historical MySQL implementation details that are not useful for the future Postgres baseline

Baseline prerequisites:
- choose whether Postgres should keep Prisma-managed relations or introduce database foreign keys
- audit current MySQL data for orphaned relation rows
- validate enum value/order expectations
- validate case/collation-sensitive unique data
- validate DateTime precision/ordering assumptions
- decide whether native `@db.VarChar(191)` annotations should stay for the first switch

## What Blocks Provider Switch Now

- no full migration baseline exists in `prisma/migrations`
- existing migration SQL is MySQL-specific and cannot run against Postgres
- relation strategy is unresolved for Postgres
- orphan-data and case/collation audits have not been run
- enum SQL/state has not been mapped into a Postgres baseline
- staging import/validation and rollback plans do not exist yet

## Recommended Next Segment

Next segment:
- `local-postgres-baseline-design`

Goal:
- design the future local Postgres validation environment and baseline strategy without switching active runtime

Expected outputs:
- selected relation strategy for the first Postgres baseline
- proposed local Postgres service/config plan
- baseline generation plan
- explicit data-audit queries/checklist for orphan rows, enum values, case/collation duplicates, and DateTime parity
- decision on whether `@db.VarChar(191)` stays unchanged for the first switch

Still out of scope for the next segment:
- changing `DATABASE_URL`
- changing `provider = "mysql"`
- editing `prisma/schema.prisma`
- creating/editing/running migrations as the provider switch
- changing runtime code

## Verification

Required verification for this audit segment:

```bash
git diff --check
rg -n "provider =|DATABASE_URL|postgresql|mysql" prisma docs apps packages src
rg -n "\$queryRaw|\$executeRaw|queryRaw|executeRaw|Json|Bytes|@db\.|Unsupported|@@index|@@unique|@default" prisma apps packages src
```

Expected result:
- `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`
- this report may mention future `postgresql`
- active runtime code remains unchanged
- no runtime raw SQL should appear outside documentation/migration findings
