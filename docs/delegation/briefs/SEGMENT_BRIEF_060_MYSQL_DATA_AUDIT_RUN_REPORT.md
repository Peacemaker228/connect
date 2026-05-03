# Segment 060. MySQL Data Audit Run Report

Branch:
- `wave/stage6-mysql-data-audit-run-report`

Segment:
- `mysql-data-audit-run-and-report`

## Goal

Run the read-only MySQL data-audit query pack from Segment 059 against the local current MySQL database and capture pass/review/fail findings before any Postgres baseline generation or import work.

This segment did not change `DATABASE_URL`, did not change Prisma provider, did not edit `prisma/schema.prisma`, did not create/edit/run Prisma migrations, did not change runtime code, and did not apply data cleanup.

## Target

Target source:
- local current MySQL only
- connection source used by this run: `.env.local`
- scheme: `mysql`
- host: `127.0.0.1`
- port: `3307`
- database: `ax_connect`
- user: `root`
- MySQL service: `MySQL84`
- MySQL version observed by read-only connection check: `8.4.8`

Secret handling:
- database password was not written to this report
- active app `DATABASE_URL` was not edited

## Overall Result

Classification:
- pass: data-audit blockers from Segment 059 were not found
- review: aggregate detail includes two self-conversation rows; this is not a baseline/import blocker unless product rules disallow self conversations
- fail: none
- block: none from the data-audit query pack

Provider switch is still not approved by this result. This report only clears the read-only local MySQL data-audit gate for the checked database.

## Query Group Results

### 1. Orphan Rows

Result:
- pass
- every `issue_count` was `0`

| check | issue_count |
|---|---:|
| `authidentity.profileId -> profile.id` | 0 |
| `authpasswordcredential.identityId -> authidentity.id` | 0 |
| `authsession.profileId -> profile.id` | 0 |
| `server.profileId -> profile.id` | 0 |
| `member.profileId -> profile.id` | 0 |
| `member.serverId -> server.id` | 0 |
| `channel.profileId -> profile.id` | 0 |
| `channel.serverId -> server.id` | 0 |
| `message.memberId -> member.id` | 0 |
| `message.channelId -> channel.id` | 0 |
| `conversation.memberOneId -> member.id` | 0 |
| `conversation.memberTwoId -> member.id` | 0 |
| `directmessage.memberId -> member.id` | 0 |
| `directmessage.conversationId -> conversation.id` | 0 |

### 2. Enum Parity

Invalid values:
- pass
- every invalid-value `issue_count` was `0`

| check | issue_count | observed_values |
|---|---:|---|
| `authidentity.provider invalid values` | 0 | `null` |
| `authsession.status invalid values` | 0 | `null` |
| `member.role invalid values` | 0 | `null` |
| `channel.type invalid values` | 0 | `null` |

Observed enum inventory:

| field | value | row_count |
|---|---|---:|
| `authidentity.provider` | `PASSWORD` | 5 |
| `authsession.status` | `ACTIVE` | 20 |
| `authsession.status` | `REVOKED` | 29 |
| `member.role` | `ADMIN` | 6 |
| `member.role` | `MODERATOR` | 1 |
| `channel.type` | `VIDEO` | 1 |
| `channel.type` | `TEXT` | 8 |
| `channel.type` | `AUDIO` | 2 |

### 3. Case/Collation Duplicate Checks

Result:
- pass
- all duplicate queries returned no rows

Queries with no rows:
- `profile.userId normalized duplicate`
- `authidentity provider+subject normalized duplicate`
- `authidentity.emailNormalized normalized duplicate`
- `authsession.refreshTokenHash normalized duplicate`
- `server.inviteCode normalized duplicate`
- `profile.email normalized duplicate review`

### 4. DateTime Null/Range/Order Sanity

Required timestamp null checks:
- pass
- every `issue_count` was `0`

Range checks:
- pass
- every `issue_count` was `0`

Order checks:
- pass
- every `updated before created` `issue_count` was `0`

Auth timestamp consistency:

| check | issue_count |
|---|---:|
| `active authsession has revokedAt` | 0 |
| `revoked authsession missing revokedAt review` | 0 |

Ordering tie review:

| check | duplicate_group_count |
|---|---:|
| `message.createdAt duplicate groups` | 0 |
| `directmessage.createdAt duplicate groups` | 0 |
| `channel.createdAt duplicate groups` | 0 |

### 5. Row Counts

Result:
- snapshot captured

| table | row_count |
|---|---:|
| `profile` | 5 |
| `authidentity` | 5 |
| `authpasswordcredential` | 5 |
| `authsession` | 49 |
| `server` | 6 |
| `member` | 7 |
| `channel` | 11 |
| `message` | 6 |
| `conversation` | 3 |
| `directmessage` | 1 |

### 6. Aggregate Parity

Summary snapshot:

| snapshot | groups_count | min_count | max_count | summed_count |
|---|---:|---:|---:|---:|
| `members per server` | 6 | 1 | 2 | 7 |
| `channels per server` | 6 | 1 | 3 | 11 |
| `messages per channel` | 11 | 0 | 5 | 6 |
| `directmessages per conversation` | 3 | 0 | 1 | 1 |
| `identities per profile` | 5 | 1 | 1 | 5 |

Unexpected zero aggregate checks:

| check | issue_count |
|---|---:|
| `servers without members` | 0 |
| `servers without channels` | 0 |
| `profiles without identities review` | 0 |

Detailed aggregate notes:
- servers: 6 groups, all have at least 1 member and 1 channel
- channels: 11 groups, 2 channels have messages and 9 have zero messages
- conversations: 3 groups, 1 has direct messages and 2 have zero direct messages
- profiles: 5 groups, every profile has exactly 1 auth identity
- review note: 2 conversation rows have the same member on both sides; Segment 059 does not classify this as fail, but product semantics should decide whether self conversations are valid legacy/local data

## Pass/Review/Fail Classification

Pass:
- orphan checks
- enum parity invalid-value checks
- unique-like normalized duplicate checks
- required DateTime null/range/order checks
- auth timestamp consistency checks
- row-count snapshot capture
- aggregate parity snapshot capture

Review:
- two self-conversation aggregate rows
- local data has channels/conversations with zero messages; this is normal for local/test data unless product import parity rules say otherwise

Fail:
- none

Block:
- none from this data-audit run

## Blockers Before Baseline/Import

Data blockers found by this run:
- none

Remaining non-data blockers:
- clean Postgres baseline has not been generated or reviewed
- isolated Postgres validation Prisma schema does not exist yet
- selected Prisma/Postgres relation mode still needs confirmation before baseline generation
- export/import tooling does not exist yet
- staging validation and rollback/cutover runbooks do not exist yet

## Recommended Next Segment

Recommended next segment:
- `postgres-validation-schema-baseline`

Goal:
- create an isolated Postgres validation schema path and generate/review a clean Postgres baseline for the local validation database only.

Required constraints:
- keep active `DATABASE_URL` unchanged
- keep active `prisma/schema.prisma` on `provider = "mysql"`
- do not switch runtime code to Postgres
- do not run production/staging cutover
- use this MySQL data-audit report as the pre-baseline local data gate

## Verification

Verification performed:
- `git diff --check`
- write-keyword grep on this report returned no matches
- provider/env grep confirmed active Prisma schema still uses `provider = "mysql"` and `env("DATABASE_URL")`
