# Segment Brief 173: Production Media Staging Pre-Smoke Readiness Run Report

Branch: `wave/stage9-production-media-staging-pre-smoke-readiness`
Segment: `production-media-staging-pre-smoke-readiness-run-report`
Date: 2026-06-04

## Goal

Close staging pre-smoke readiness blockers on the separate staging VPS and record a redacted run report before any direct/TURN media smoke.

## Scope Guardrails

- Production VPS was not touched.
- Production `DATABASE_URL` was not used.
- No real secrets, private keys, passwords, generated TURN credentials, cookies, auth headers, database URLs, or env values are recorded here.
- Real staging public IP remains outside repo docs.
- No production SFU/TURN/default gate was enabled.
- LiveKit fallback was not removed.
- Stage 6/Postgres production migration path was not changed.
- Direct/TURN media smoke was not run.

## Starting State

- Staging repo path: `/var/www/ax-connect-staging`.
- Server-local env root: `/etc/ax-connect-staging`.
- Staging config root: `/opt/ax-connect-staging`.
- PM2 processes from Segment 172 were already online:
  - `ax-connect-staging-api`
  - `ax-connect-staging-web`
- Docker Postgres was already healthy.
- Nginx/TLS for `staging.ax-connect.ru` was already active.
- Coturn config existed but was not yet running.
- LiveKit rollback env and Storage gate were unresolved.
- Staging DB schema had not been applied.
- Authenticated app/session and authenticated mediasoup health had not been run.

## Actions Performed

### Baseline Status

- Confirmed SSH/operator context as `deploy` on the staging VPS.
- Confirmed PM2 web/API processes online.
- Confirmed Docker Postgres healthy.
- Confirmed Nginx config test passed.
- Confirmed HTTPS API health returned `status: ok` for `apps/api`.
- Confirmed HTTPS web returned expected `307` redirect to `/sign-in`.
- Confirmed UFW active with SSH, `80/tcp`, `443/tcp`, coturn listener/relay candidate ports, and mediasoup RTC candidate range.
- Coturn was initially not running.

### LiveKit Rollback Env

- Added LiveKit rollback values locally on the server without printing values:
  - `NEXT_PUBLIC_LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- Updated only server-local env files under `/etc/ax-connect-staging`.
- Presence checks passed for LiveKit rollback env names in web/API env files.
- No LiveKit secret values were printed or recorded.

### Storage Gate

- Storage upload env remained missing.
- Operator explicitly deferred Storage for this pre-smoke readiness segment because upload/storage smoke is out of scope for media-only pre-smoke readiness.
- Recorded server-local `/etc/ax-connect-staging/storage-gate.status` with no secret values.

### Staging DB Schema

- Confirmed `DATABASE_URL` class points to staging Docker Postgres on loopback `5433`.
- Confirmed Postgres readiness through `pg_isready`.
- Applied the active Prisma schema to the separate staging Docker Postgres with `bun x prisma db push`.
- Public table count after schema push: `10`.
- Recorded table names only:
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
- Production DB was not touched.
- Stage 6 production Postgres cutover was not touched.

### App/API Rebuild And Restart

- Rebuilt web after LiveKit public env presence changed.
- Restarted PM2 API and web processes with updated env.
- PM2 status showed both staging processes online.
- Localhost API health passed.
- HTTPS API health passed.
- HTTPS web returned expected `307` redirect to `/sign-in`.
- PM2 process list was saved.

### Coturn Start And Config Fix

- Initial coturn start attempt exposed a compose/entrypoint issue: the container restarted and printed help output instead of using the intended config.
- Generated and mounted an explicit `turnserver.conf` without printing shared secret values.
- A follow-up diagnostic found the container had started with default config because the expected config file path was not loaded; valid, no-auth, and invalid probes all observed relay allocation behavior.
- Coturn was immediately stopped due to open-relay risk.
- Compose was corrected to run `turnserver -c /turnserver.conf` as root inside the container, with the mounted config set to `root:root 0400`.
- Removed unsupported `no-loopback-peers` directive for the installed coturn version and replaced it with explicit `denied-peer-ip` rules for private/loopback peer ranges.
- Restarted coturn successfully.
- Startup checks passed:
  - config file loaded
  - no `Bad configuration format`
  - container running
  - listener/relay ports present

### Coturn No-Open-Relay Check

- Used `turnutils_uclient` only for TURN allocation/auth diagnostics, not media smoke.
- Generated short-lived REST credentials locally on the server without printing username/password/shared secret.
- Valid REST credential probe produced relay allocation evidence.
- No-auth probe produced zero relay allocations.
- Invalid-credential probe produced zero relay allocations.
- Diagnostic verbose logging was removed after the check and coturn was restarted.
- Final coturn status: running, not restarting.
- Valid TURN credentials were not printed.
- Direct/TURN media smoke was not run.

### Authenticated App Session

- Created a staging-only test user through `/api/auth/register/password`.
- Stored session cookies only in a temporary server-local cookie jar.
- Session check through `/api/auth/session` returned:
  - authenticated: true
  - strategy: `access-token`
  - profile present
  - user present
  - session id present
- Cookies and tokens were not printed.

### Authenticated Mediasoup Health

- Called authenticated `/api/media/prototype/mediasoup/health`.
- HTTP status: `200`.
- Health result:
  - status: `disabled`
  - enabled: `false`
  - reason: `Local mediasoup prototype is disabled in production runtime`
- Runtime config presence was ready for media env shape:
  - TURN URLs configured
  - TURN static auth secret configured
  - TURN relay range ready
  - SFU announced address configured
  - SFU RTC range ready
- Classification: endpoint reachable with auth, but mediasoup is not ready for direct/TURN media smoke because staging API runs production runtime and the local prototype is disabled there.

### LiveKit Rollback

- Checked web rollback query routes:
  - `/media/sfu-smoke?mediaProvider=livekit`
  - `/media/sfu-smoke?livekit=true`
  - `/media/sfu-smoke?sfu=false`
- Web query checks returned `307` redirects to sign-in in the curl context.
- Checked LiveKit token route without query: HTTP `400`, as expected for missing room/username.
- Checked LiveKit token route with staging-only query parameters: HTTP `200`.
- Token presence was confirmed without printing token value.
- LiveKit rollback token path classification: `pass`.

## Final Redacted Evidence Summary

- PM2 web/API: online.
- HTTPS API health: pass.
- HTTPS web: expected `307` to `/sign-in`.
- Auth/session: pass through API with staging-only cookie jar.
- Docker Postgres: healthy.
- Staging schema: pushed to separate Docker Postgres; public table count `10`.
- Nginx: config test passed; service active.
- UFW: active with expected staging ports.
- Coturn: running with config loaded and no bad config format.
- Coturn no-open-relay: pass for valid/no-auth/invalid allocation checks.
- LiveKit rollback env: present.
- LiveKit token path: pass; token value not printed.
- Storage: explicitly deferred for media-only pre-smoke readiness.
- Mediasoup health: reachable with auth but disabled by production runtime.
- Direct/TURN media smoke: not run.
- Production: untouched.

## Readiness Classification

- staging LiveKit rollback env: `pass / present`
- storage gate: `deferred / accepted for media-only pre-smoke`
- staging DB schema: `pass / db push to separate Docker Postgres`
- PM2 web/API after env/schema changes: `pass / online`
- Nginx/HTTPS health: `pass`
- coturn process: `pass / running`
- coturn no-open-relay: `pass / minimal allocation-auth check`
- authenticated app/session: `pass`
- authenticated mediasoup health: `reachable but not ready`
- LiveKit rollback token path: `pass`
- direct/TURN media smoke: `not run / forbidden in this segment`
- final classification: `partial pass / blocked before staging media smoke`

## Remaining Blockers Before Direct/TURN Media Smoke

- Mediasoup prototype is disabled in production runtime on staging; direct/TURN media smoke cannot proceed until a scoped runtime decision or implementation enables a staging-safe SFU readiness path without enabling production defaults.
- Web rollback query routes returned `307` to sign-in in curl context; browser/operator route behavior should be checked if the next segment needs route-level UI evidence.
- Storage upload remains deferred; upload/storage smoke stays blocked until separate staging storage env is filled or the next smoke scope excludes upload.
- Direct and TURN media smoke were intentionally not run in this segment.

## Recommended Next Segment

Recommended next: `production-media-staging-smoke-readiness-decision` or an equivalent scoped segment to resolve the staging-safe mediasoup runtime enablement decision before `production-media-staging-smoke-run-report`.

Do not proceed to direct/TURN media smoke until the mediasoup runtime blocker is resolved or explicitly accepted with a narrower non-SFU smoke scope.
