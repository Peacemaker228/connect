# Segment 059. MySQL Data Audit Query Pack

Branch:
- `wave/stage6-mysql-data-audit-query-pack`

Segment:
- `mysql-data-audit-query-pack`

## Goal

Prepare executable read-only MySQL data-audit queries before any Postgres baseline generation, data import, or provider switch.

This segment is docs-only. It does not change `DATABASE_URL`, does not change `provider = "mysql"`, does not edit `prisma/schema.prisma`, does not create/edit/run Prisma migrations, and does not change runtime code.

## Required Reading

- [POSTGRES_PROVIDER_SWITCH_PLAN.md](../../waves/POSTGRES_PROVIDER_SWITCH_PLAN.md)
- [SEGMENT_BRIEF_056_SCHEMA_PROVIDER_DIFF_AUDIT.md](./SEGMENT_BRIEF_056_SCHEMA_PROVIDER_DIFF_AUDIT.md)
- [SEGMENT_BRIEF_057_LOCAL_POSTGRES_BASELINE_DESIGN.md](./SEGMENT_BRIEF_057_LOCAL_POSTGRES_BASELINE_DESIGN.md)
- [SEGMENT_BRIEF_058_LOCAL_POSTGRES_VALIDATION_INFRA.md](./SEGMENT_BRIEF_058_LOCAL_POSTGRES_VALIDATION_INFRA.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [schema.prisma](../../../prisma/schema.prisma)

## How to Run

Run these queries against the current MySQL database only.

Use the same database that the current active app runtime uses, but do not edit `DATABASE_URL` and do not point the app at Postgres.

Suggested MySQL client shape:

```bash
mysql --table --host 127.0.0.1 --port 3306 --user USER --password DB_NAME
```

Execution rules:
- run each section as read-only SQL
- capture the output with table name, query group, row count, and timestamp
- do not apply data cleanup in this segment
- if any issue count is non-zero, stop before baseline/import and prepare a separate cleanup or decision segment

## Expected Result Summary

Expected zero rows or zero counts:
- orphan rows
- enum parity invalid values
- case/collation duplicates for unique or identity-like values
- required DateTime null/range issues
- required relation sanity issues such as servers without members if product data expects at least one member

Expected non-zero rows:
- row counts, if the environment has data
- aggregate parity snapshots

Non-zero aggregate snapshot rows are not failures by themselves. They become the reference values for post-import parity.

## 1. Orphan Rows

Expected:
- every `issue_count` must be `0`

```sql
select 'authidentity.profileId -> profile.id' as check_name, count(*) as issue_count
from `authidentity` child
left join `profile` parent on parent.`id` = child.`profileId`
where parent.`id` is null
union all
select 'authpasswordcredential.identityId -> authidentity.id' as check_name, count(*) as issue_count
from `authpasswordcredential` child
left join `authidentity` parent on parent.`id` = child.`identityId`
where parent.`id` is null
union all
select 'authsession.profileId -> profile.id' as check_name, count(*) as issue_count
from `authsession` child
left join `profile` parent on parent.`id` = child.`profileId`
where parent.`id` is null
union all
select 'server.profileId -> profile.id' as check_name, count(*) as issue_count
from `server` child
left join `profile` parent on parent.`id` = child.`profileId`
where parent.`id` is null
union all
select 'member.profileId -> profile.id' as check_name, count(*) as issue_count
from `member` child
left join `profile` parent on parent.`id` = child.`profileId`
where parent.`id` is null
union all
select 'member.serverId -> server.id' as check_name, count(*) as issue_count
from `member` child
left join `server` parent on parent.`id` = child.`serverId`
where parent.`id` is null
union all
select 'channel.profileId -> profile.id' as check_name, count(*) as issue_count
from `channel` child
left join `profile` parent on parent.`id` = child.`profileId`
where parent.`id` is null
union all
select 'channel.serverId -> server.id' as check_name, count(*) as issue_count
from `channel` child
left join `server` parent on parent.`id` = child.`serverId`
where parent.`id` is null
union all
select 'message.memberId -> member.id' as check_name, count(*) as issue_count
from `message` child
left join `member` parent on parent.`id` = child.`memberId`
where parent.`id` is null
union all
select 'message.channelId -> channel.id' as check_name, count(*) as issue_count
from `message` child
left join `channel` parent on parent.`id` = child.`channelId`
where parent.`id` is null
union all
select 'conversation.memberOneId -> member.id' as check_name, count(*) as issue_count
from `conversation` child
left join `member` parent on parent.`id` = child.`memberOneId`
where parent.`id` is null
union all
select 'conversation.memberTwoId -> member.id' as check_name, count(*) as issue_count
from `conversation` child
left join `member` parent on parent.`id` = child.`memberTwoId`
where parent.`id` is null
union all
select 'directmessage.memberId -> member.id' as check_name, count(*) as issue_count
from `directmessage` child
left join `member` parent on parent.`id` = child.`memberId`
where parent.`id` is null
union all
select 'directmessage.conversationId -> conversation.id' as check_name, count(*) as issue_count
from `directmessage` child
left join `conversation` parent on parent.`id` = child.`conversationId`
where parent.`id` is null;
```

## 2. Enum Parity

Expected:
- every `issue_count` must be `0`
- `observed_values` must be a subset of the schema enum values

```sql
select 'authidentity.provider invalid values' as check_name, count(*) as issue_count, group_concat(distinct `provider` order by `provider`) as observed_values
from `authidentity`
where `provider` not in ('PASSWORD')
union all
select 'authsession.status invalid values' as check_name, count(*) as issue_count, group_concat(distinct `status` order by `status`) as observed_values
from `authsession`
where `status` not in ('ACTIVE', 'REVOKED')
union all
select 'member.role invalid values' as check_name, count(*) as issue_count, group_concat(distinct `role` order by `role`) as observed_values
from `member`
where `role` not in ('ADMIN', 'MODERATOR', 'GUEST')
union all
select 'channel.type invalid values' as check_name, count(*) as issue_count, group_concat(distinct `type` order by `type`) as observed_values
from `channel`
where `type` not in ('TEXT', 'AUDIO', 'VIDEO');
```

Enum value inventory:

```sql
select 'authidentity.provider' as field_name, `provider` as value, count(*) as row_count
from `authidentity`
group by `provider`
union all
select 'authsession.status' as field_name, `status` as value, count(*) as row_count
from `authsession`
group by `status`
union all
select 'member.role' as field_name, `role` as value, count(*) as row_count
from `member`
group by `role`
union all
select 'channel.type' as field_name, `type` as value, count(*) as row_count
from `channel`
group by `type`;
```

Interpretation:
- invalid values block baseline/import
- inventory rows become parity reference data for import validation
- `member.role` order must be preserved for API response sorting expectations

## 3. Case/Collation Duplicate Checks

Expected:
- unique or identity-like duplicate queries should return `0` rows
- `profile.email` duplicate rows are review items, not automatic blockers unless product rules require unique emails

```sql
select 'profile.userId normalized duplicate' as check_name, lower(trim(`userId`)) as normalized_value, count(*) as row_count
from `profile`
group by lower(trim(`userId`))
having count(*) > 1;
```

```sql
select 'authidentity provider+subject normalized duplicate' as check_name, `provider`, lower(trim(`subject`)) as normalized_subject, count(*) as row_count
from `authidentity`
group by `provider`, lower(trim(`subject`))
having count(*) > 1;
```

```sql
select 'authidentity.emailNormalized normalized duplicate' as check_name, lower(trim(`emailNormalized`)) as normalized_value, count(*) as row_count
from `authidentity`
where `emailNormalized` is not null and trim(`emailNormalized`) <> ''
group by lower(trim(`emailNormalized`))
having count(*) > 1;
```

```sql
select 'authsession.refreshTokenHash normalized duplicate' as check_name, lower(trim(`refreshTokenHash`)) as normalized_value, count(*) as row_count
from `authsession`
group by lower(trim(`refreshTokenHash`))
having count(*) > 1;
```

```sql
select 'server.inviteCode normalized duplicate' as check_name, lower(trim(`inviteCode`)) as normalized_value, count(*) as row_count
from `server`
group by lower(trim(`inviteCode`))
having count(*) > 1;
```

```sql
select 'profile.email normalized duplicate review' as check_name, lower(trim(`email`)) as normalized_value, count(*) as row_count
from `profile`
where `email` is not null and trim(`email`) <> ''
group by lower(trim(`email`))
having count(*) > 1;
```

## 4. DateTime Null/Range/Order Sanity

Expected:
- every required timestamp issue count must be `0`
- duplicate timestamp groups are review signals for pagination smoke tests, not automatic blockers

Required timestamp null checks:

```sql
select 'profile.createdAt null' as check_name, count(*) as issue_count from `profile` where `createdAt` is null
union all
select 'profile.updatedAt null' as check_name, count(*) as issue_count from `profile` where `updatedAt` is null
union all
select 'authidentity.createdAt null' as check_name, count(*) as issue_count from `authidentity` where `createdAt` is null
union all
select 'authidentity.updatedAt null' as check_name, count(*) as issue_count from `authidentity` where `updatedAt` is null
union all
select 'authpasswordcredential.createdAt null' as check_name, count(*) as issue_count from `authpasswordcredential` where `createdAt` is null
union all
select 'authpasswordcredential.updatedAt null' as check_name, count(*) as issue_count from `authpasswordcredential` where `updatedAt` is null
union all
select 'authsession.createdAt null' as check_name, count(*) as issue_count from `authsession` where `createdAt` is null
union all
select 'authsession.updatedAt null' as check_name, count(*) as issue_count from `authsession` where `updatedAt` is null
union all
select 'authsession.refreshTokenExpiresAt null' as check_name, count(*) as issue_count from `authsession` where `refreshTokenExpiresAt` is null
union all
select 'server.createdAt null' as check_name, count(*) as issue_count from `server` where `createdAt` is null
union all
select 'server.updatedAt null' as check_name, count(*) as issue_count from `server` where `updatedAt` is null
union all
select 'member.createdAt null' as check_name, count(*) as issue_count from `member` where `createdAt` is null
union all
select 'member.updatedAt null' as check_name, count(*) as issue_count from `member` where `updatedAt` is null
union all
select 'channel.createdAt null' as check_name, count(*) as issue_count from `channel` where `createdAt` is null
union all
select 'channel.updatedAt null' as check_name, count(*) as issue_count from `channel` where `updatedAt` is null
union all
select 'message.createdAt null' as check_name, count(*) as issue_count from `message` where `createdAt` is null
union all
select 'message.updatedAt null' as check_name, count(*) as issue_count from `message` where `updatedAt` is null
union all
select 'directmessage.createdAt null' as check_name, count(*) as issue_count from `directmessage` where `createdAt` is null
union all
select 'directmessage.updatedAt null' as check_name, count(*) as issue_count from `directmessage` where `updatedAt` is null;
```

Range checks:

```sql
select 'profile timestamp range issue' as check_name, count(*) as issue_count
from `profile`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'authidentity timestamp range issue' as check_name, count(*) as issue_count
from `authidentity`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'authsession timestamp range issue' as check_name, count(*) as issue_count
from `authsession`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `refreshTokenExpiresAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'server timestamp range issue' as check_name, count(*) as issue_count
from `server`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'member timestamp range issue' as check_name, count(*) as issue_count
from `member`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'channel timestamp range issue' as check_name, count(*) as issue_count
from `channel`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'message timestamp range issue' as check_name, count(*) as issue_count
from `message`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day
union all
select 'directmessage timestamp range issue' as check_name, count(*) as issue_count
from `directmessage`
where `createdAt` < '2000-01-01' or `updatedAt` < '2000-01-01' or `createdAt` > current_timestamp + interval 1 day or `updatedAt` > current_timestamp + interval 1 day;
```

Order checks:

```sql
select 'profile updated before created' as check_name, count(*) as issue_count from `profile` where `updatedAt` < `createdAt`
union all
select 'authidentity updated before created' as check_name, count(*) as issue_count from `authidentity` where `updatedAt` < `createdAt`
union all
select 'authpasswordcredential updated before created' as check_name, count(*) as issue_count from `authpasswordcredential` where `updatedAt` < `createdAt`
union all
select 'authsession updated before created' as check_name, count(*) as issue_count from `authsession` where `updatedAt` < `createdAt`
union all
select 'server updated before created' as check_name, count(*) as issue_count from `server` where `updatedAt` < `createdAt`
union all
select 'member updated before created' as check_name, count(*) as issue_count from `member` where `updatedAt` < `createdAt`
union all
select 'channel updated before created' as check_name, count(*) as issue_count from `channel` where `updatedAt` < `createdAt`
union all
select 'message updated before created' as check_name, count(*) as issue_count from `message` where `updatedAt` < `createdAt`
union all
select 'directmessage updated before created' as check_name, count(*) as issue_count from `directmessage` where `updatedAt` < `createdAt`;
```

Auth timestamp consistency:

```sql
select 'active authsession has revokedAt' as check_name, count(*) as issue_count
from `authsession`
where `status` = 'ACTIVE' and `revokedAt` is not null
union all
select 'revoked authsession missing revokedAt review' as check_name, count(*) as issue_count
from `authsession`
where `status` = 'REVOKED' and `revokedAt` is null;
```

Ordering tie review:

```sql
select 'message.createdAt duplicate groups' as check_name, count(*) as duplicate_group_count
from (
  select `createdAt`
  from `message`
  group by `createdAt`
  having count(*) > 1
) grouped_values
union all
select 'directmessage.createdAt duplicate groups' as check_name, count(*) as duplicate_group_count
from (
  select `createdAt`
  from `directmessage`
  group by `createdAt`
  having count(*) > 1
) grouped_values
union all
select 'channel.createdAt duplicate groups' as check_name, count(*) as duplicate_group_count
from (
  select `createdAt`
  from `channel`
  group by `createdAt`
  having count(*) > 1
) grouped_values;
```

## 5. Row Counts

Expected:
- use as a snapshot before export/import
- post-import counts must match unless a reviewed cleanup segment intentionally changes data

```sql
select 'profile' as table_name, count(*) as row_count from `profile`
union all
select 'authidentity' as table_name, count(*) as row_count from `authidentity`
union all
select 'authpasswordcredential' as table_name, count(*) as row_count from `authpasswordcredential`
union all
select 'authsession' as table_name, count(*) as row_count from `authsession`
union all
select 'server' as table_name, count(*) as row_count from `server`
union all
select 'member' as table_name, count(*) as row_count from `member`
union all
select 'channel' as table_name, count(*) as row_count from `channel`
union all
select 'message' as table_name, count(*) as row_count from `message`
union all
select 'conversation' as table_name, count(*) as row_count from `conversation`
union all
select 'directmessage' as table_name, count(*) as row_count from `directmessage`;
```

## 6. Aggregate Parity Checks

Expected:
- these are snapshot outputs for post-import comparison
- zero counts can be valid in empty/local data, but production-like data should review unexpected zero aggregates

Members per server:

```sql
select s.`id` as server_id, s.`name` as server_name, count(m.`id`) as member_count
from `server` s
left join `member` m on m.`serverId` = s.`id`
group by s.`id`, s.`name`
order by s.`id`;
```

Channels per server:

```sql
select s.`id` as server_id, s.`name` as server_name, count(c.`id`) as channel_count
from `server` s
left join `channel` c on c.`serverId` = s.`id`
group by s.`id`, s.`name`
order by s.`id`;
```

Messages per channel:

```sql
select c.`id` as channel_id, c.`serverId` as server_id, c.`name` as channel_name, count(m.`id`) as message_count
from `channel` c
left join `message` m on m.`channelId` = c.`id`
group by c.`id`, c.`serverId`, c.`name`
order by c.`id`;
```

Direct messages per conversation:

```sql
select c.`id` as conversation_id, c.`memberOneId`, c.`memberTwoId`, count(dm.`id`) as directmessage_count
from `conversation` c
left join `directmessage` dm on dm.`conversationId` = c.`id`
group by c.`id`, c.`memberOneId`, c.`memberTwoId`
order by c.`id`;
```

Identities per profile:

```sql
select p.`id` as profile_id, p.`email`, count(ai.`id`) as identity_count
from `profile` p
left join `authidentity` ai on ai.`profileId` = p.`id`
group by p.`id`, p.`email`
order by p.`id`;
```

Unexpected zero aggregate review:

```sql
select 'servers without members' as check_name, count(*) as issue_count
from (
  select s.`id`
  from `server` s
  left join `member` m on m.`serverId` = s.`id`
  group by s.`id`
  having count(m.`id`) = 0
) grouped_values
union all
select 'servers without channels' as check_name, count(*) as issue_count
from (
  select s.`id`
  from `server` s
  left join `channel` c on c.`serverId` = s.`id`
  group by s.`id`
  having count(c.`id`) = 0
) grouped_values
union all
select 'profiles without identities review' as check_name, count(*) as issue_count
from (
  select p.`id`
  from `profile` p
  left join `authidentity` ai on ai.`profileId` = p.`id`
  group by p.`id`
  having count(ai.`id`) = 0
) grouped_values;
```

## Pass/Fail Criteria

Pass:
- orphan issue counts are `0`
- enum invalid issue counts are `0`
- normalized duplicates for unique or identity-like values return `0` rows
- required DateTime null/range/order issue counts are `0`
- row-count and aggregate snapshots are captured

Review:
- `profile.email` normalized duplicates
- duplicate timestamp groups for message/direct-message/channel ordering
- profiles without identities if legacy data exists
- servers without members or channels in non-empty product data

Fail/block baseline or import:
- any orphan issue count above `0`
- any invalid enum value
- any normalized duplicate for unique or identity-like values
- required timestamp null/range/order issue count above `0`
- missing row-count snapshot before export/import

## Recommended Next Segment

Recommended next segment:
- `mysql-data-audit-run-and-report`

Goal:
- run this read-only query pack against the current MySQL database and capture a report with pass/review/fail findings before any baseline generation or import work.

Still out of scope:
- changing `DATABASE_URL`
- changing Prisma provider
- editing `prisma/schema.prisma`
- creating or running migrations
- changing runtime code
- applying data cleanup

## Verification

Required verification:

```bash
git diff --check
rg -n "DATABASE_URL|provider =|postgresql|mysql" prisma docs apps packages src infra --glob "*.md" --glob "*.prisma" --glob "*.ts" --glob "*.tsx" --glob "*.yml" --glob "*.yaml" --glob "*.example"
```
