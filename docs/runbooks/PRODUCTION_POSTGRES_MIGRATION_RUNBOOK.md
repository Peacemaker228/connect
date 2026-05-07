# Production Postgres Migration Runbook

## Scope

This runbook is the operator-facing plan for moving production from MySQL to Postgres.

It is self-contained and must be usable without chat history. It does not perform the migration by itself and does not authorize an operator to skip staging rehearsal, backup verification, or rollback gates.

Current policy:
- MySQL remains the production source of truth until cutover completion is explicitly declared.
- The local Postgres development switch is not production proof.
- Local disposable import rehearsals are useful evidence, but they do not replace staging rehearsal with production-like data and production-like deployment steps.
- Do not use local-only Stage 6 scripts against staging or production unless a later segment creates and reviews production-safe tooling with explicit non-local guardrails.

Non-goals:
- no staging or production migration is executed by this document
- no production secrets are stored in this repository
- no MySQL data is deleted
- no unrelated auth, storage, media, web-shell, or SDK work is included
- the microphone/media follow-up remains outside Stage 6 database migration

## Run Metadata

Fill this section before every rehearsal or cutover attempt.

| Field | Value |
| --- | --- |
| Run type | staging rehearsal / production cutover / rollback drill |
| Environment | staging / production |
| Planned window start | TODO |
| Planned window end | TODO |
| Actual start timestamp | TODO |
| Actual end timestamp | TODO |
| Primary operator | TODO |
| Reviewer / second operator | TODO |
| Assistant/session owner | TODO |
| Repo commit SHA | TODO |
| App version/build artifact | TODO |
| Prisma CLI/client version | TODO |
| MySQL backup artifact path | TODO |
| Restore-verification artifact path | TODO |
| Postgres target identifier | TODO |
| Decision log link | TODO |

Operator notes:

```text
TODO paste notes here.
```

Assistant observations:

```text
TODO paste assistant observations here.
```

## Environment Inventory

Record concrete values before any change. Never paste passwords or full secret URLs into this document.

| Item | Expected value / owner | Recorded value |
| --- | --- | --- |
| Production app host | server/operator owned | TODO |
| Production process manager | PM2 or current deploy system | TODO |
| Production web process | current `start:web` process | TODO |
| Production backend/API process | current API/backend process | TODO |
| Current production DB | MySQL source | TODO |
| Current production `DATABASE_URL` scheme | `mysql` before cutover | TODO |
| Target production DB | Postgres target | TODO |
| Target production `DATABASE_URL` scheme | `postgresql` after cutover | TODO |
| Production MySQL source env for migration tooling | `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` or later production-approved source env | TODO |
| Local validation target env | `POSTGRES_VALIDATION_DATABASE_URL`, local only, not production | TODO |
| Production storage provider/env | existing S3-compatible config | TODO |
| Production LiveKit env | existing LiveKit config | TODO |
| Production auth/session cookie settings | existing backend-owned auth config | TODO |
| Monitoring dashboard | TODO | TODO |
| Log locations | PM2/app/Nginx/database logs | TODO |

Required secret handling:
- production `.env.production` or server env files must be changed only during the approved cutover step
- the old MySQL `DATABASE_URL` value must be preserved in the secret manager or operator notes until rollback is no longer needed
- do not commit `.env.production`
- do not paste secret values into docs, issue comments, or assistant messages

## Global Go/No-Go Gates

Do not start staging rehearsal unless all are true:
- production runbook has been reviewed by an operator who can perform rollback
- target staging Postgres environment exists
- staging MySQL source is a clone or safe rehearsal source, not live production writes
- backup and restore verification process is documented
- parity queries are selected for row counts, orphan checks, enum checks, DateTime checks, aggregate parity, and self-conversation count
- write-freeze and rollback responsibilities are assigned

Do not start production cutover unless all are true:
- at least one staging rehearsal completed with pass or accepted review findings
- production MySQL backup completed and restore verification passed against an isolated restore target
- final cutover window is approved
- write-freeze or maintenance mode is ready
- target production Postgres is provisioned, reachable, and empty or explicitly reset by an approved production-safe process
- app build was generated from the expected commit
- `bun.cmd x prisma validate`, `bun.cmd x tsc --noEmit -p tsconfig.json`, and `bun.cmd run typecheck:api` passed on the release candidate
- rollback trigger list is accepted
- rollback owner is available for the full migration window
- monitoring and smoke-test owners are available

No-go examples:
- unresolved schema drift
- failed backup restore
- target Postgres is not disposable or not confirmed empty for import
- parity mismatch without written acceptance
- unknown production `DATABASE_URL` owner
- inability to restore the previous MySQL-backed app config
- microphone/media issue being mixed into this database segment

## Phase 1. Preflight

Purpose:
- prove the operator is on the intended code and environment
- prove the production run is not accidentally using local-only scripts or secrets
- capture the current app and database state before backup

Commands to run from the release candidate checkout:

```bash
git status --short --branch
git log --oneline -8
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
```

Expected result:
- git status is clean except approved release artifacts
- Prisma validates against the active Postgres-capable schema/config in the release candidate
- TypeScript checks pass
- API typecheck passes

Output capture:

```text
TODO paste command outputs here.
```

Database preflight checklist:
- confirm current production app still points at MySQL before cutover
- confirm MySQL server version, database name, timezone settings, and backup user privileges
- confirm target Postgres server version, database name, timezone settings, extension assumptions, and connection pool limits
- confirm there are no unreviewed schema changes since the staging rehearsal
- confirm MySQL source remains source of truth until cutover completion

## Phase 2. Backup

Purpose:
- capture a production MySQL backup before any final import
- capture enough app configuration to restore the previous runtime quickly

MySQL logical backup command template:

```bash
mysqldump --single-transaction --routines --triggers --events --default-character-set=utf8mb4 --set-gtid-purged=OFF --result-file "<BACKUP_DIR>/ax-connect-mysql-<UTC_TIMESTAMP>.sql" "<MYSQL_DATABASE_NAME>"
```

If credentials are not supplied through a secure client config, use operator-approved secret injection. Do not paste secrets into shell history or docs.

Backup artifact capture:

| Artifact | Value |
| --- | --- |
| Backup path | TODO |
| Backup size | TODO |
| Backup checksum command | TODO |
| Backup checksum output | TODO |
| Storage location | TODO |
| Retention owner | TODO |

Suggested checksum command:

```bash
sha256sum "<BACKUP_DIR>/ax-connect-mysql-<UTC_TIMESTAMP>.sql"
```

Windows operator alternative:

```powershell
Get-FileHash "<BACKUP_DIR>\ax-connect-mysql-<UTC_TIMESTAMP>.sql" -Algorithm SHA256
```

Configuration backup checklist:
- copy current production app env file through the approved server backup process
- record current MySQL `DATABASE_URL` location without exposing the secret
- record current PM2 ecosystem config path and active process list
- record current Nginx config path if deployment needs web proxy changes
- record the exact release artifact or commit currently running

## Phase 3. Restore Verification

Purpose:
- prove the backup can restore before production cutover starts

Restore target rules:
- use an isolated restore target
- do not restore into live production MySQL
- do not restore into the production Postgres target
- do not continue to cutover if restore verification fails

Restore command template:

```bash
mysql "<RESTORE_TEST_DATABASE_NAME>" < "<BACKUP_DIR>/ax-connect-mysql-<UTC_TIMESTAMP>.sql"
```

Verification after restore:
- row counts match production MySQL at backup time
- orphan checks match the source
- enum checks match the source
- DateTime sanity checks match the source
- aggregate parity checks match the source
- self-conversation count is recorded and handled by the accepted policy

Output capture:

```text
TODO paste restore verification outputs here.
```

Gate:
- go only if restore verification is `pass` or every review item has written approval

## Phase 4. Staging Rehearsal

Purpose:
- rehearse the migration on staging or production-like clone before production cutover
- verify the application deployment order and smoke tests against Postgres

Rules:
- staging rehearsal must not use live production writes as the source
- staging rehearsal must not change production secrets
- local-only scripts under `scripts/stage6` are not production/staging-safe by default because they enforce localhost guardrails
- if a later segment creates staging-safe tooling, record its commit, flags, allowlists, and expected output here

Rehearsal steps:
1. Confirm staging source snapshot and target Postgres identifiers.
2. Confirm staging app can be stopped or write-frozen.
3. Apply or verify the approved Postgres schema baseline on the staging target.
4. Run the approved import/export process.
5. Run parity checks.
6. Deploy the staging app with Postgres `DATABASE_URL`.
7. Run smoke tests.
8. Record every finding as pass/review/fail/block.

Staging output capture:

```text
TODO paste staging rehearsal outputs here.
```

Staging acceptance:
- row counts match
- aggregate parity matches
- orphan, enum, DateTime, and required-null checks pass
- application smoke tests pass
- rollback drill is understood and executable

## Phase 5. Maintenance And Write-Freeze

Purpose:
- prevent MySQL/Postgres divergence during final production export/import

Before write-freeze:
- notify users/operators through the approved channel
- identify any background jobs or scheduled tasks that can write to the database
- prepare maintenance page or write-disabled mode if available
- confirm rollback owner is present
- confirm backup owner is present
- confirm smoke-test owner is present

Write-freeze checklist:
- stop or disable user writes
- stop or disable background writes
- keep read-only access only if the app can guarantee no writes
- record freeze timestamp
- record current app process state

Write-freeze timestamp:

```text
TODO paste timestamp and operator note here.
```

Gate:
- MySQL remains source of truth during write-freeze and final import
- do not update production `DATABASE_URL` until final import and parity checks pass

## Phase 6. Final Export And Import

Purpose:
- move the final frozen MySQL dataset into production Postgres

Final source checks:
- run row counts
- run orphan checks
- run enum checks
- run DateTime sanity checks
- run aggregate parity checks
- record self-conversation count and accepted handling

Expected table order for relationMode=`prisma` parity import:
1. `profile`
2. `authidentity`
3. `authpasswordcredential`
4. `authsession`
5. `server`
6. `member`
7. `channel`
8. `message`
9. `conversation`
10. `directmessage`

Data handling rules:
- preserve IDs
- preserve enum values exactly
- preserve timestamps and nulls
- preserve text values without truncation
- preserve booleans according to approved transform rules
- fail on invalid enum values
- fail on required nulls
- fail on `varchar(191)` overflow
- fail on unexpected duplicate values that would collide under Postgres uniqueness rules

Import command placeholder:

```bash
TODO use the production-approved import command from the later implementation segment.
```

Do not use the local-only command below against staging or production:

```bash
bun.cmd scripts/stage6/mysql-postgres-local-import-rehearsal.ts --mode import --reset-target --execute-import --confirm-disposable-target --json
```

Reason:
- that command is intentionally local-only and allows only localhost sources/targets
- production requires a separate reviewed command path with production-safe source/target allowlists and output capture

Final import output:

```text
TODO paste final import output here.
```

## Phase 7. Parity Checks

Run parity checks after import and before production `DATABASE_URL` update.

Required checks:
- row counts for every table
- orphan rows for every relation
- enum parity
- case/collation duplicate checks
- DateTime null/range/order sanity
- aggregate parity:
  - members per server
  - channels per server
  - messages per channel
  - direct messages per conversation
  - identities per profile
- self-conversation count
- Prisma schema/drift verification for the approved production schema path

Parity result table:

| Check group | Expected | Actual | Classification | Notes |
| --- | --- | --- | --- | --- |
| Row counts | match source | TODO | TODO | TODO |
| Orphan rows | zero or accepted source parity | TODO | TODO | TODO |
| Enum parity | zero invalid values | TODO | TODO | TODO |
| Case/collation duplicates | zero blockers | TODO | TODO | TODO |
| DateTime sanity | zero blockers | TODO | TODO | TODO |
| Aggregate parity | match source | TODO | TODO | TODO |
| Self-conversation count | accepted policy | TODO | review expected if historical rows remain | TODO |
| Prisma drift/schema | no unexpected drift | TODO | TODO | TODO |

Gate:
- do not switch production app secrets until parity is pass or every review item has written approval

## Phase 8. Deploy And Secret Update Order

Purpose:
- switch runtime to Postgres only after final import and parity pass

Deployment order:
1. Keep production app in write-freeze.
2. Confirm final import passed.
3. Confirm parity checks passed.
4. Preserve previous MySQL `DATABASE_URL` in the secret manager for rollback.
5. Update production `DATABASE_URL` to the approved Postgres URL.
6. Confirm no production env still points runtime writes at MySQL.
7. Build or deploy the approved release artifact.
8. Generate Prisma client as part of the approved build/deploy process if required.
9. Restart backend/API process.
10. Restart web process if it reads server env or is part of the same deployment.
11. Check application health endpoints and logs.
12. Run smoke tests before write-freeze is lifted.

Release commands from the current repo scripts:

```bash
bun install
bun.cmd x prisma validate
bun.cmd x prisma generate
bun run build:web
bun run build:server
```

Process restart commands are deployment-specific. Record the exact PM2/system commands here before production cutover:

```bash
TODO paste approved production restart commands.
```

Secret update output:

```text
TODO paste non-secret confirmation output here.
```

## Phase 9. Smoke Tests

Run before lifting write-freeze:
- login with an existing account
- session refresh remains valid
- profile load succeeds
- server list loads
- server detail route loads
- invite route works
- member list loads
- channel list loads
- text message create/read works in a test channel
- message edit/delete works if product policy allows it during smoke
- direct message route between different members loads
- self-conversation is still blocked for new opens
- storage metadata/file access works for existing uploaded files
- new upload works if writes are temporarily enabled for a controlled smoke account
- LiveKit/media token endpoint returns expected response
- realtime message delivery still works if socket runtime is part of production smoke

Smoke output:

```text
TODO paste smoke test outputs and screenshots/links here.
```

Gate:
- lift write-freeze only after critical smoke tests pass
- keep maintenance active if auth, message read/write, storage read, or database connectivity fails

## Phase 10. Rollback

Rollback triggers:
- final import fails
- parity checks fail without accepted review decision
- production app cannot connect to Postgres
- auth/session smoke fails
- core server/channel/message reads fail
- write path fails after cutover
- storage metadata reads fail because database records are inconsistent
- unacceptable error rate or latency appears after cutover
- operator cannot determine which database is receiving writes

Rollback before write-freeze is lifted:
1. Keep users in maintenance/write-freeze.
2. Restore the previous MySQL `DATABASE_URL` in production secrets.
3. Restart affected app processes with the previous known-good release/config.
4. Confirm app reads from MySQL.
5. Run minimal smoke tests.
6. Declare rollback completion and keep Postgres target for investigation.

Rollback after writes were allowed on Postgres:
1. Re-enter maintenance/write-freeze immediately.
2. Stop app writes.
3. Capture Postgres write window timestamps and logs.
4. Decide whether data reconciliation is possible.
5. Do not point writes back to MySQL until divergence is understood and accepted.
6. If rollback is approved, restore previous MySQL app config and document lost/reconciled writes.

Rollback output:

```text
TODO paste rollback command outputs, timestamps, and decision notes here.
```

## Phase 11. Post-Cutover Monitoring

Monitor immediately after write-freeze is lifted:
- app error rate
- API/backend logs
- Prisma/database connection errors
- Postgres CPU, memory, connections, locks, and slow queries
- auth login/session errors
- message create/read errors
- direct-message errors
- storage metadata/file access errors
- media token errors
- user reports

Monitoring windows:
- first 15 minutes
- first 1 hour
- first 4 hours
- first 24 hours
- first 48 hours

Post-cutover output:

```text
TODO paste monitoring snapshots and operator notes here.
```

Completion criteria:
- write-freeze lifted
- production `DATABASE_URL` points to Postgres
- MySQL is no longer receiving production writes
- parity and smoke test results are archived
- rollback window and backup retention are documented
- MySQL retirement is explicitly deferred until a later segment

## Incident Notes Template

Use this section for any unexpected event.

| Timestamp | Event | Impact | Owner | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| TODO | TODO | TODO | TODO | TODO | TODO |

Raw output:

```text
TODO paste raw output here.
```

## Final Sign-Off

| Gate | Status | Operator |
| --- | --- | --- |
| Backup completed | TODO | TODO |
| Restore verification passed | TODO | TODO |
| Staging rehearsal accepted | TODO | TODO |
| Write-freeze active | TODO | TODO |
| Final import passed | TODO | TODO |
| Parity passed | TODO | TODO |
| Secret update completed | TODO | TODO |
| Smoke tests passed | TODO | TODO |
| Monitoring started | TODO | TODO |
| Cutover complete | TODO | TODO |

Final decision:

```text
TODO declare pass/review/fail/block and next action.
```
