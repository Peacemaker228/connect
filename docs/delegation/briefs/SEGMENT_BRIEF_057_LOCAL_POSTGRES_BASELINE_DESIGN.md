# Segment 057. Local Postgres Baseline Design

Branch:
- `wave/stage6-local-postgres-baseline-design`

Segment:
- `local-postgres-baseline-design`

## Goal

Design-only plan for a local Postgres validation environment and clean Postgres baseline strategy after the schema/provider diff audit.

This segment does not change `DATABASE_URL`, does not change `provider = "mysql"`, does not edit `prisma/schema.prisma`, does not create/edit/run migrations, does not change runtime code, and does not add Postgres infrastructure files.

## Required Reading

- [POSTGRES_PROVIDER_SWITCH_PLAN.md](../../waves/POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [SEGMENT_BRIEF_056_SCHEMA_PROVIDER_DIFF_AUDIT.md](./SEGMENT_BRIEF_056_SCHEMA_PROVIDER_DIFF_AUDIT.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [schema.prisma](../../../prisma/schema.prisma)

## Baseline Strategy Decision

Recommended baseline strategy:
- create a clean Postgres baseline from the current Prisma schema in a later approved segment
- do not translate the current MySQL migration history as the primary path
- do not replay `20260501120000_remove_clerk_identity_provider/migration.sql` against Postgres
- preserve current logical schema shape for the first Postgres validation baseline
- defer schema improvements such as native Postgres `uuid` columns, broad string type widening, DB foreign-key hardening, or index redesign until after the provider switch is proven

Reason:
- the current migration history does not include a full schema-creation baseline
- the only checked-in migration is MySQL-specific destructive enum SQL
- the first Postgres validation should isolate provider compatibility from schema redesign

## Relation Strategy Decision

Recommended first baseline relation strategy:
- keep the current Prisma-managed relation behavior for the first Postgres validation baseline
- keep the logical equivalent of `relationMode = "prisma"` for the first baseline if supported by the selected Prisma/Postgres setup
- defer a move to database foreign keys until a later relation-hardening segment

Why:
- the current active schema already uses `relationMode = "prisma"`
- active runtime behavior has been built and tested around Prisma-managed relations
- immediate DB foreign keys would mix provider switch with integrity hardening
- existing data has not yet been audited for orphan rows, so DB foreign keys could fail during import or baseline application

Required pre-generation check:
- before any baseline is generated, confirm with the installed Prisma version that the selected Postgres validation schema supports the intended relation mode
- if the selected Prisma/Postgres setup cannot keep the current relation mode, the baseline segment must explicitly switch to DB foreign keys and must run the orphan-row audit before generating or applying the baseline

Later DB foreign-key hardening:
- should be a separate segment after local/staging validation
- should include orphan cleanup, constraint naming review, cascade behavior verification, and rollback notes

## Local Postgres Environment Naming

The active application runtime must continue using:
- `DATABASE_URL` for the current MySQL database

Local Postgres validation should use isolated names that cannot be confused with active runtime:
- database service name: `connect-postgres-validation`
- database name: `connect_validation`
- database user: `connect_validation`
- suggested local port: `5433`
- validation URL env name: `POSTGRES_VALIDATION_DATABASE_URL`
- optional validation shadow URL env name: `POSTGRES_VALIDATION_SHADOW_DATABASE_URL`

Rules:
- do not repoint `DATABASE_URL`
- do not add these env vars to active runtime config until a dedicated approved segment defines how they are consumed
- do not make `apps/api` read validation env names in this design segment
- do not add Docker Compose, infra, or `.env` files without separate approval

Future local validation runtime shape:
- MySQL remains the active runtime through `DATABASE_URL`
- Postgres validation uses an explicit command/env path that points Prisma tooling at the validation URL only
- any generated baseline review should use a temporary or dedicated validation Prisma schema path, not the active `prisma/schema.prisma`, until the provider-switch segment is approved

## Baseline Generation Approach

This segment does not generate a migration.

Future approved approach:
1. Create an isolated Postgres validation schema copy from the current Prisma schema.
2. Change only the isolated validation copy to target Postgres.
3. Keep model names, table mappings, string IDs, enums, indexes, unique constraints, defaults, and relation behavior as close as possible to the current schema.
4. Generate a baseline SQL diff from empty database to the isolated validation schema.
5. Review generated SQL for enum creation, table/column casing, indexes, unique constraints, defaults, text/varchar mappings, and relation behavior.
6. Apply only to the local validation database.
7. Compare imported data and runtime smoke checks before any staging work.

Baseline file policy:
- no baseline migration file should be committed until a dedicated baseline-generation segment exists
- the committed baseline, when approved later, should represent the clean Postgres target state rather than the historical MySQL migration chain
- existing MySQL migration history should remain untouched during design and validation

Provider-switch isolation:
- do not combine baseline generation with data import, staging validation, production cutover, auth changes, storage changes, media work, or web-shell cleanup

## Data-Audit Checklist

These checks must be prepared and then run before any provider switch or DB foreign-key hardening.

### Orphan rows

Audit each child table against its parent:
- `authidentity.profileId -> profile.id`
- `authpasswordcredential.identityId -> authidentity.id`
- `authsession.profileId -> profile.id`
- `server.profileId -> profile.id`
- `member.profileId -> profile.id`
- `member.serverId -> server.id`
- `channel.profileId -> profile.id`
- `channel.serverId -> server.id`
- `message.memberId -> member.id`
- `message.channelId -> channel.id`
- `conversation.memberOneId -> member.id`
- `conversation.memberTwoId -> member.id`
- `directmessage.memberId -> member.id`
- `directmessage.conversationId -> conversation.id`

Acceptance:
- zero orphan rows before DB foreign keys are introduced
- any orphan cleanup must be a separate, reviewed data-cleanup segment

### Enum parity

Audit distinct values:
- `authidentity.provider` must be `PASSWORD`
- `authsession.status` must be `ACTIVE` or `REVOKED`
- `member.role` must be `ADMIN`, `MODERATOR`, or `GUEST`
- `channel.type` must be `TEXT`, `AUDIO`, or `VIDEO`

Acceptance:
- no out-of-range enum values
- Postgres enum order preserves runtime expectations, especially `MemberRole` ordering used by API responses

### Case/collation duplicates

Audit case-insensitive duplicates for fields that are unique or identity-like:
- `profile.userId`
- `authidentity(provider, subject)`
- `authidentity.emailNormalized`
- `authsession.refreshTokenHash`
- `server.inviteCode`

Also inspect non-unique email data:
- `profile.email`

Acceptance:
- no duplicate logical auth identities after lowercasing/trimming
- no duplicate invite/session/user identity values that would behave differently under Postgres case-sensitive comparison
- any required normalization cleanup happens before import

### DateTime parity

Audit date ranges and nullability:
- `createdAt`
- `updatedAt`
- `lastAuthenticatedAt`
- `refreshTokenExpiresAt`
- `lastAccessedAt`
- `revokedAt`

Audit ordering-sensitive tables:
- `message.createdAt`
- `directmessage.createdAt`
- `channel.createdAt`
- `member.role`

Acceptance:
- no invalid or out-of-range timestamps
- nullable auth timestamps match schema expectations
- duplicate/near-duplicate message timestamps are covered by pagination smoke tests

### Row counts and parity

Capture row counts for every table:
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

Acceptance:
- pre-export and post-import row counts match
- relation counts match key domain aggregates, such as members per server, channels per server, messages per channel, direct messages per conversation, and auth identities per profile
- rejected rows must be explained before staging validation

## Acceptance Criteria Before Next Segment

Before adding local Postgres infrastructure or generating any baseline:
- this design is reviewed and accepted
- baseline strategy is fixed as clean Postgres baseline, not migration-history translation
- first relation strategy is fixed as preserving current Prisma-managed relation behavior where supported
- isolated env names are accepted and do not touch active `DATABASE_URL`
- data-audit checklist is accepted
- no schema, migration, runtime, or infrastructure files were changed in this segment

## Remaining Blockers

Provider switch remains blocked by:
- no local Postgres validation environment exists yet
- no clean Postgres baseline has been generated or reviewed
- relation mode support for the selected Prisma/Postgres validation path still needs to be confirmed before generation
- data-audit queries have not been run against real MySQL data
- no export/import tooling exists
- no staging validation plan has been executed
- no rollback/cutover runbook exists

## Recommended Next Segment

Recommended next segment:
- `local-postgres-validation-infra`

Goal:
- with separate approval, add isolated local Postgres validation infrastructure and env examples without changing active `DATABASE_URL` or runtime behavior

Expected scope:
- add local-only Postgres validation service/config
- document `POSTGRES_VALIDATION_DATABASE_URL`
- keep `DATABASE_URL` untouched
- do not switch Prisma provider in active `prisma/schema.prisma`
- do not create or run provider-switch migrations

Fallback docs-only next segment if infra approval is not granted:
- `mysql-data-audit-query-pack`

Goal:
- prepare executable MySQL data-audit queries for orphan rows, enum values, case/collation duplicates, DateTime parity, and row counts

## Verification

Required verification for this design segment:

```bash
git diff --check
rg -n "provider =|DATABASE_URL|postgresql|mysql" prisma docs apps packages src
```

Expected result:
- `prisma/schema.prisma` still uses `provider = "mysql"` and `env("DATABASE_URL")`
- this report may mention future `postgresql`
- no runtime, migration, schema, or infrastructure files change in this segment
