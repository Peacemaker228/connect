# Production Media Env Inventory Template

## Scope / Non-Goals

This template is for a future production `mediasoup + coturn` rollout after the Stage 8 local Media MVP pass.

Use it to inventory required environment/config values before any production media implementation segment. It is operator-facing and can be filled without chat history.

In scope:
- public build-time media/API env inventory
- server-only API/media env inventory
- secret ownership and rotation inventory without secret values
- LiveKit rollback env preservation
- mapping local prototype names to production-approved names or candidates
- pre-canary completeness checks

Out of scope:
- `.env`, `.env.local`, `.env.production`, or real secret file changes
- production SFU/default enablement
- LiveKit removal
- Docker, PM2, systemd, Nginx, or firewall implementation
- Stage 6 production Postgres migration or cutover

## How To Fill This Template Safely

Rules:
- Do not paste real IPs, domains, tokens, API keys, shared secrets, or credential values into this repository.
- Use placeholders such as `TODO_PROD_WEB_ORIGIN`, `TODO_MEDIA_HOST_FQDN`, or `present in secret manager`.
- Record owner, source of truth, rotation requirement, and validation method instead of values.
- Keep screenshots, logs, runbooks, and handoffs redacted before sharing.
- Treat all `NEXT_PUBLIC_*` values as browser-visible and non-secret.
- Treat TURN static auth secrets, LiveKit API secrets, and future media signing secrets as server-side secrets only.
- Fill this inventory before production canary planning, but do not use it as approval to enable production SFU.

## Public Build-Time Env

Public build-time env is visible in browser bundles. It must not contain secrets.

Important rule:
- `NEXT_PUBLIC_*` values require a rebuild/redeploy to change for a deployed web bundle.

Required or candidate public items:

| Env / config item | Expected shape | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | public API origin, no secret | Browser API/WSS origin. Must match deployed API/Nginx routing and CORS. |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit server URL, no API secret | Keep for rollback until a later LiveKit rollback-removal segment. |
| `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE` | boolean-like gate | Existing non-production/default-candidate gate. Production default requires later explicit approval. |
| `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT` | boolean-like gate | Existing pilot gate. Do not enable production broadly from this template. |
| `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE` | boolean-like gate | Existing non-production/default-candidate gate. |
| `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT` | boolean-like gate | Existing pilot gate. |
| `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE` | boolean-like gate | Existing private-call candidate gate. |
| Future production SFU default switch | TBD | Must be introduced only by a later scoped decision and implementation segment. |

Production note:
- If production ever permits SFU candidate/default gates, record the exact gate name, default value, rebuild owner, and rollback owner in the inventory table below.

## Server-Only API / Media Env

Server-only env can be read by `apps/api`, backend media processes, or deployment/process managers. It must not be exposed to browser bundles unless explicitly documented as public.

Required or candidate server-only items:

| Env / config item | Proposed production name | Current local/prototype name | Candidate / shape | Notes |
| --- | --- | --- | --- | --- |
| API internal URL | `API_INTERNAL_URL` | n/a | internal API origin | Used by server-side web utilities/middleware where applicable. |
| API CORS allowed origins | `API_CORS_ALLOWED_ORIGINS` | n/a | comma-separated exact origins | Must include production web origins for credentialed API/WSS. |
| Media host public address | `MEDIA_HOST_PUBLIC_ADDRESS` | n/a | public IP or FQDN placeholder | Must be reachable by clients. Do not commit the real value here. |
| mediasoup listen IP | `MEDIA_SFU_LISTEN_IP` | `LOCAL_MEDIASOUP_LISTEN_IP` | bind IP placeholder | Bind address for mediasoup WebRTC transports/workers. |
| mediasoup announced address | `MEDIA_SFU_ANNOUNCED_ADDRESS` | `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | public reachable IP/FQDN placeholder | Must match the public media host address for single-host rollout. |
| mediasoup RTC min port | `MEDIA_SFU_RTC_MIN_PORT` | n/a | `40000` candidate | Candidate range is `40000-40100/udp`. |
| mediasoup RTC max port | `MEDIA_SFU_RTC_MAX_PORT` | n/a | `40100` candidate | No overlap with coturn relay range. |
| staging/preprod SFU smoke gate | `MEDIA_ENABLE_STAGING_SFU` | n/a | boolean-like server-only value | Use only on staging/preprod when `NODE_ENV=production`. Truthy values are `1`, `true`, `yes`. Do not expose as `NEXT_PUBLIC`; do not use as production default approval. |
| TURN URLs | `MEDIA_TURN_URLS` | `LOCAL_TURN_URLS` | `turn:<host>:3478?transport=udp,turn:<host>:3478?transport=tcp` placeholder | URLs may be returned through backend-issued credentials or an approved config path. |
| coturn listener port | `MEDIA_TURN_LISTENER_PORT` | n/a | `3478/udp+tcp` candidate | Candidate listener is `3478` for UDP and TCP. |
| coturn TLS listener port | `MEDIA_TURN_TLS_LISTENER_PORT` | n/a | `5349/tcp` deferred | Defer unless a later readiness segment proves it is required. |
| coturn relay min port | `MEDIA_TURN_RELAY_MIN_PORT` | `LOCAL_TURN_RELAY_MIN_PORT` | `49160` candidate | Candidate relay range is `49160-49240`. |
| coturn relay max port | `MEDIA_TURN_RELAY_MAX_PORT` | `LOCAL_TURN_RELAY_MAX_PORT` | `49240` candidate | Widen only after load evidence and firewall review. |
| TURN credential TTL | `MEDIA_TURN_TTL_SECONDS` | `LOCAL_TURN_TTL_SECONDS` | short-lived seconds value | Must balance call reliability with abuse containment. |

## Secret Env

Never commit real values for these items.

Required or candidate secret items:

| Env / config item | Proposed production name | Current local/prototype name | Notes |
| --- | --- | --- | --- |
| TURN static auth secret or equivalent | `MEDIA_TURN_STATIC_AUTH_SECRET` | `LOCAL_TURN_STATIC_AUTH_SECRET` | Server-side only. Must match coturn auth configuration or selected equivalent auth mechanism. |
| LiveKit API key | `LIVEKIT_API_KEY` | existing LiveKit env | Keep for rollback until removal is explicitly approved. |
| LiveKit API secret | `LIVEKIT_API_SECRET` | existing LiveKit env | Server-side only. Keep for rollback until removal is explicitly approved. |
| Future media signing/session secret | `MEDIA_SESSION_SIGNING_SECRET` or TBD | n/a | Add only if a later design introduces signed resume/session credentials. |

Secret ownership requirements:
- owner must be a named operational role or team
- source of truth must be outside the repository, such as a secret manager or controlled server env store
- rotation source and rotation cadence must be recorded before canary
- handoffs must state presence/ownership only, not values

## LiveKit Rollback Env

LiveKit fallback remains required until a later rollback-removal segment is approved and completed.

Keep available:
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

Rule:
- Do not remove, disable, or stop validating LiveKit rollback env during production media planning, coturn readiness, mediasoup process planning, or early canary preparation.

## Current Local Prototype Mapping

The current `LOCAL_*` names are prototype/local-only names. They remain supported as local/dev fallback inputs for runtime compatibility, but they are not production-approved names.

`apps/api` now reads the proposed `MEDIA_*` names through a media runtime config boundary. When a `MEDIA_*` value is present it takes precedence; otherwise the matching `LOCAL_*` value is used where a local fallback exists. This mapping does not enable production SFU/TURN because production prototype guards still return disabled responses.

Known local prototype names:

| Current local/prototype name | Meaning | Production status |
| --- | --- | --- |
| `LOCAL_TURN_URLS` | local TURN URL list | map to `MEDIA_TURN_URLS` or explicitly approve another production name |
| `LOCAL_TURN_STATIC_AUTH_SECRET` | local TURN REST shared secret | map to `MEDIA_TURN_STATIC_AUTH_SECRET` or explicitly approve another production secret name |
| `LOCAL_TURN_TTL_SECONDS` | local TURN credential TTL | map to `MEDIA_TURN_TTL_SECONDS` or explicitly approve another production name |
| `LOCAL_MEDIASOUP_LISTEN_IP` | local mediasoup bind/listen IP | map to `MEDIA_SFU_LISTEN_IP` or explicitly approve another production name |
| `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | local mediasoup announced address | map to `MEDIA_SFU_ANNOUNCED_ADDRESS` or explicitly approve another production name |
| `LOCAL_TURN_EXTERNAL_IP` | local coturn external IP placeholder | production equivalent should be the reviewed media host public address / coturn `external-ip` |
| `LOCAL_TURN_RELAY_MIN_PORT` | local coturn relay range minimum | map to `MEDIA_TURN_RELAY_MIN_PORT` or selected coturn config source |
| `LOCAL_TURN_RELAY_MAX_PORT` | local coturn relay range maximum | map to `MEDIA_TURN_RELAY_MAX_PORT` or selected coturn config source |

## Proposed Production Env Mapping

Recommended naming direction implemented at the backend runtime config boundary:

| Production candidate | Maps from | Public? | Secret? | Notes |
| --- | --- | --- | --- | --- |
| `MEDIA_TURN_URLS` | `LOCAL_TURN_URLS` | no | no | Server-side configured TURN URL list. Empty entries are trimmed; only `turn:` and `turns:` entries are returned. |
| `MEDIA_TURN_STATIC_AUTH_SECRET` | `LOCAL_TURN_STATIC_AUTH_SECRET` | no | yes | Server-side only. Health/debug output exposes only configured/not-configured status, not the value. |
| `MEDIA_TURN_TTL_SECONDS` | `LOCAL_TURN_TTL_SECONDS` | no | no | Short-lived credential TTL, clamped to the current safe range. |
| `MEDIA_TURN_LISTENER_PORT` | n/a | no | no | Candidate `3478`; implementation may instead use coturn config file source. |
| `MEDIA_TURN_RELAY_MIN_PORT` | `LOCAL_TURN_RELAY_MIN_PORT` | no | no | Candidate `49160`; exposed as non-secret metadata only because backend does not allocate coturn relay ports. |
| `MEDIA_TURN_RELAY_MAX_PORT` | `LOCAL_TURN_RELAY_MAX_PORT` | no | no | Candidate `49240`; exposed as non-secret metadata only because backend does not allocate coturn relay ports. |
| `MEDIA_HOST_PUBLIC_ADDRESS` | `LOCAL_TURN_EXTERNAL_IP` conceptually | no | no | Public reachable IP/FQDN placeholder; do not commit real values. |
| `MEDIA_SFU_LISTEN_IP` | `LOCAL_MEDIASOUP_LISTEN_IP` | no | no | Backend/media process env. |
| `MEDIA_SFU_ANNOUNCED_ADDRESS` | `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | no | no | Public reachable address for ICE candidates. |
| `MEDIA_SFU_RTC_MIN_PORT` | n/a | no | no | Candidate `40000`; used in mediasoup WebRTC transport `portRange` when paired with max. |
| `MEDIA_SFU_RTC_MAX_PORT` | n/a | no | no | Candidate `40100`; invalid or reversed ranges disable transport creation with a non-secret reason. |
| `MEDIA_ENABLE_STAGING_SFU` | n/a | no | no | Server-only staging/preprod smoke gate for `NODE_ENV=production`; truthy values are `1`, `true`, `yes`. Not a production default switch. |

Alternative:
- Keeping current `LOCAL_*` names in production would require an explicit approval segment and clear documentation explaining why local/prototype naming is acceptable in production.

No real env, secret, production default, LiveKit fallback, Docker, PM2, systemd, Nginx, firewall, or Stage 6/Postgres production migration changes are made by the runtime mapping segment.

## Inventory Table Template

Fill one row per env/config item before canary readiness review.

| Env / config item | Proposed production name | Current local/prototype name | Public or server-only | Secret? | Required for canary? | Required for rollback? | Owner | Rotation required? | Source of truth | Validation command/check | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API public origin | `NEXT_PUBLIC_API_URL` | n/a | public build-time | no | yes | no | TODO | no | TODO | TODO | Requires rebuild/redeploy when changed. |
| API internal origin | `API_INTERNAL_URL` | n/a | server-only | no | review | no | TODO | no | TODO | TODO | Needed only where server-side web/API calls require it. |
| API CORS origins | `API_CORS_ALLOWED_ORIGINS` | n/a | server-only | no | yes | no | TODO | no | TODO | TODO | Must match exact production web origins. |
| SFU candidate gates | `NEXT_PUBLIC_MEDIA_*` | n/a | public build-time | no | review | yes | TODO | no | TODO | TODO | Keep reversible; do not enable broad default here. |
| Media host public address | `MEDIA_HOST_PUBLIC_ADDRESS` | `LOCAL_TURN_EXTERNAL_IP` concept | server-only config | no | yes | no | TODO | no | TODO | TODO | Record only placeholder/presence in repo. |
| mediasoup listen IP | `MEDIA_SFU_LISTEN_IP` | `LOCAL_MEDIASOUP_LISTEN_IP` | server-only | no | yes | no | TODO | no | TODO | TODO | Must align with host networking. |
| mediasoup announced address | `MEDIA_SFU_ANNOUNCED_ADDRESS` | `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | server-only | no | yes | no | TODO | no | TODO | TODO | Must be publicly reachable. |
| mediasoup RTC min port | `MEDIA_SFU_RTC_MIN_PORT` | n/a | server-only | no | yes | no | TODO | no | TODO | TODO | Candidate `40000/udp`. |
| mediasoup RTC max port | `MEDIA_SFU_RTC_MAX_PORT` | n/a | server-only | no | yes | no | TODO | no | TODO | TODO | Candidate `40100/udp`. |
| Staging SFU enable gate | `MEDIA_ENABLE_STAGING_SFU` | n/a | server-only | no | staging only | no | operator | no | staging server-local API env only | authenticated mediasoup health after API restart | Set to `1` only on staging/preprod for smoke readiness; never use as production default approval. |
| TURN URLs | `MEDIA_TURN_URLS` | `LOCAL_TURN_URLS` | server-only config, non-secret response component | no | yes | no | TODO | no | TODO | TODO | Use production host placeholder only in docs. |
| TURN shared secret | `MEDIA_TURN_STATIC_AUTH_SECRET` | `LOCAL_TURN_STATIC_AUTH_SECRET` | server-only | yes | yes | no | TODO | yes | TODO | TODO | Store outside repo. |
| TURN TTL | `MEDIA_TURN_TTL_SECONDS` | `LOCAL_TURN_TTL_SECONDS` | server-only | no | yes | no | TODO | no | TODO | TODO | Must be short-lived. |
| coturn listener | `MEDIA_TURN_LISTENER_PORT` | n/a | server-only config | no | yes | no | TODO | no | TODO | TODO | Candidate `3478/udp+tcp`. |
| coturn relay min port | `MEDIA_TURN_RELAY_MIN_PORT` | `LOCAL_TURN_RELAY_MIN_PORT` | server-only config | no | yes | no | TODO | no | TODO | TODO | Candidate `49160`. |
| coturn relay max port | `MEDIA_TURN_RELAY_MAX_PORT` | `LOCAL_TURN_RELAY_MAX_PORT` | server-only config | no | yes | no | TODO | no | TODO | TODO | Candidate `49240`. |
| LiveKit API key | `LIVEKIT_API_KEY` | existing LiveKit env | server-only | yes | no | yes | TODO | yes | TODO | TODO | Keep until rollback removal segment. |
| LiveKit API secret | `LIVEKIT_API_SECRET` | existing LiveKit env | server-only | yes | no | yes | TODO | yes | TODO | TODO | Keep until rollback removal segment. |
| LiveKit public URL | `NEXT_PUBLIC_LIVEKIT_URL` | existing LiveKit env | public build-time | no | no | yes | TODO | no | TODO | TODO | Requires rebuild/redeploy when changed. |
| Future media session signing | `MEDIA_SESSION_SIGNING_SECRET` or TBD | n/a | server-only | yes | review | no | TODO | yes | TODO | TODO | Only if later design requires it. |

## Process / Operator Inventory Items

Fill these non-secret operational items alongside the env table before a staging smoke run.

| Item | Status | Owner | Source of truth | Validation command/check | Notes |
| --- | --- | --- | --- | --- | --- |
| Staging VPS | selected / bootstrap completed | operator | hosting control panel / private operator inventory | redacted bootstrap run report in `SEGMENT_BRIEF_170_PRODUCTION_STAGING_VPS_BOOTSTRAP_RUN_REPORT.md` | Separate staging/preprod VPS is selected; actual public IPv4 stays outside repo docs. |
| Staging origin | selected | operator | DNS provider / private operator inventory | `staging.ax-connect.ru` resolves after DNS propagation | Target: `https://staging.ax-connect.ru`. |
| Production canonical origin | selected | operator | DNS/Nginx production runbook | redirect check in later production segment | Direction: `https://ax-connect.ru`; redirect `www` to canonical later. |
| Media host public address owner | selected for staging | operator | private operator inventory | record presence only | Do not commit the real staging/prod IP values. |
| Staging bootstrap run report | pass / redacted evidence recorded | operator | private operator inventory plus redacted handoff | DNS, SSH hardening, deploy user, package, Docker, PM2/Bun/Nginx, firewall, reboot, and status/log checks | Required before staging env setup or smoke. Real IPs, passwords, private keys, and env values are not recorded. |
| Staging repo layout | pass / deployed | operator | redacted run report `SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md` | path/check owner after deploy | `/var/www/ax-connect-staging`, owned by `deploy:deploy`; production deploy path not used. |
| Staging PM2 web process | pass / online | operator | PM2 status in redacted run report | `pm2 describe ax-connect-staging-web` | Process name `ax-connect-staging-web`, web port `3001`. |
| Staging PM2 API process | pass / online | operator / `apps/api` runtime | PM2 status in redacted run report | `pm2 describe ax-connect-staging-api` | Process name `ax-connect-staging-api`, API port `4000`; current build entrypoint is `apps/api/dist/apps/api/src/main.js`. |
| Staging Nginx site/TLS | pass / HTTPS active | operator | Nginx/certbot evidence in redacted run report | `nginx -t`, HTTPS API health, certbot certificate check | Site `staging.ax-connect.ru`; proxy `/`, `/api/`, and Socket.IO `/socket.io/`; TLS issued, `80/tcp` allowed for HTTP-01 renewal. |
| Staging DB source | pass / Docker Postgres healthy, schema blocked | operator | server-local env plus Docker status outside repo | Postgres health and `pg_isready` | Separate Docker Postgres on staging VPS; production `DATABASE_URL` reuse is forbidden; schema/migrations not run. |
| Staging env source | partial pass / server-local values present | operator | `/etc/ax-connect-staging` outside repo | env-name presence only | App/API/media core names present; LiveKit and Storage names are missing before smoke. Do not commit values. |
| Staging coturn Docker config | pass / config prepared, process not started | operator | `/opt/ax-connect-staging/coturn` plus secret source outside repo | compose config passed; process start blocked until follow-up run | Docker preferred; listener `3478/udp+tcp`, relay `49160-49240`, no open relay intent, no secrets in repo. |
| Coturn process owner | selected for staging | operator | staging bootstrap/runbook | Docker status/log commands in bootstrap brief | Prefer Docker-managed coturn for staging; systemd remains fallback. |
| Mediasoup process owner | selected for MVP/staging | operator / `apps/api` runtime | staging bootstrap/runbook | API media health endpoint | `apps/api` owns mediasoup lifecycle for MVP/staging; process-local state remains production blocker. |
| App/API log path and owner | review | operator | staging bootstrap/runbook | PM2/log command to be filled during bootstrap | Must support media control-plane and signaling evidence. |
| Mediasoup worker/router log owner | review | operator / `apps/api` runtime | staging bootstrap/runbook | PM2/API logs and health output | May be app/API logs for `apps/api` MVP. |
| Coturn log path and owner | review | operator | Docker logs or systemd journal | exact command to be filled during bootstrap | Must capture auth/allocation/error evidence without exposing credentials. |
| Firewall review owner | selected | operator | staging bootstrap/runbook | ufw/provider firewall checks | Must cover `443/tcp`, `3478/udp+tcp`, coturn relay, and mediasoup RTC ranges. |
| Monitoring/alert owner | TODO | TODO | TODO | TODO | Minimum alerts for transport failures, TURN failures, resource leaks, and process restarts. |
| LiveKit rollback operator | selected | operator | staging/prod runbook | rollback query smoke | Must verify rollback queries and fallback env remain available. |
| Staging smoke operator/window | selected / window TBD | operator | private operator schedule | run window to be chosen before smoke | Required before any staging smoke run/report. |
| Initial staging root credential | rotate required | operator | hosting control panel / private operator inventory | password rotation + SSH key setup | Initial password was shared in chat; do not record it, rotate during bootstrap, and move to SSH-key access. |

## Staging Smoke Run Output Template

Use this table for a future staging/non-production smoke run report. Do not paste real secrets, generated TURN credentials, auth headers, cookies, or sensitive host values.

| Output item | Value / classification | Notes |
| --- | --- | --- |
| Run id | TODO | Unique operator run id. |
| Commit SHA | TODO | Code/docs revision under test. |
| Staging web/API origins present? | TODO | Record presence and owner only if values are sensitive. |
| `MEDIA_TURN_*` presence recorded? | TODO | No secret values. Include owner/source/rotation status only. |
| `MEDIA_SFU_*` presence recorded? | TODO | No sensitive IP/FQDN if the report is shared broadly. |
| Coturn process/log/status evidence | TODO | Log references must be redacted. |
| Mediasoup process/health/log evidence | TODO | Include health snapshot references without secrets. |
| Firewall assumptions reviewed? | TODO | Record reviewed ranges, not commands unless a later implementation segment approves them. |
| App/API health | pass/review/fail/block | TODO |
| Mediasoup health | pass/review/fail/block | TODO |
| Coturn credential/no-open-relay | pass/review/fail/block | TODO |
| Direct private SFU | pass/review/fail/block | TODO |
| Direct channel `AUDIO` | pass/review/fail/block | TODO |
| Direct channel `VIDEO` | pass/review/fail/block | TODO |
| Screen-share | pass/review/fail/block | TODO |
| TURN relay private/channel | pass/review/fail/block | TODO |
| Route away/back, Restart, Leave/rejoin, offline/restore | pass/review/fail/block | TODO |
| Cleanup convergence | pass/review/fail/block | TODO |
| LiveKit rollback | pass/review/fail/block | TODO |
| Final decision | pass/review/fail/block | TODO |
| Recommended next | TODO | Fill only after run evidence exists. |

## Pre-Canary Completeness Checklist

Before a production canary readiness decision:
- [ ] `MEDIA_*` runtime mapping is reviewed against the filled production inventory.
- [ ] `NEXT_PUBLIC_API_URL` is recorded with rebuild/redeploy owner.
- [ ] Production SFU gates are documented as reversible and default-off unless a later decision approves otherwise.
- [ ] `API_INTERNAL_URL` need is reviewed and recorded.
- [ ] `API_CORS_ALLOWED_ORIGINS` contains exact production web origins in the real server env source.
- [ ] Media host public IP/FQDN ownership is recorded outside the repo.
- [ ] `MEDIA_SFU_LISTEN_IP` and `MEDIA_SFU_ANNOUNCED_ADDRESS` mapping is approved.
- [ ] mediasoup RTC candidate range `40000-40100/udp` is approved or replaced by a documented alternative.
- [ ] coturn listener candidate `3478/udp+tcp` is approved or replaced by a documented alternative.
- [ ] coturn relay candidate range `49160-49240` is approved or replaced by a documented alternative.
- [ ] mediasoup RTC and coturn relay ranges do not overlap.
- [ ] TURN static auth secret or equivalent auth source exists outside the repo.
- [ ] TURN TTL is approved and short-lived.
- [ ] LiveKit rollback env remains present and validated.
- [ ] Secret owners and rotation source are recorded without values.
- [ ] Coturn process owner, restart policy, log path, and status check are recorded.
- [ ] Mediasoup process owner, restart policy, log path, and health check are recorded.
- [ ] Firewall review owner and candidate range validation are recorded.
- [ ] Monitoring/log capture owner is recorded.
- [ ] Staging smoke operator, run window, and rollback owner are recorded.
- [ ] Validation checks are defined for direct path, relay path, private call, channel AUDIO, channel VIDEO, screen share, leave/rejoin, route-away, and cleanup health.
- [ ] Stage 6 production Postgres migration remains out of scope.

## Redaction Rules For Handoffs / Logs / Screenshots

Redact:
- root passwords and password prompt output
- SSH private keys and sensitive key paths
- TURN static auth secrets or equivalent shared secrets
- LiveKit API key and API secret values
- future media signing/session secrets
- real public IPs/FQDNs if the handoff will be public or broadly shared
- full TURN credential usernames/passwords
- auth headers, cookies, JWTs, and session identifiers
- coturn logs that include usernames/session metadata

Allowed in repo docs:
- env/config item names
- placeholder values
- candidate port ranges
- presence/absence status
- owner role/team
- rotation requirement and date placeholders
- non-secret validation check names

## Blockers Before Implementation

Implementation remains blocked until these are resolved or explicitly accepted for a narrow canary:
- production env values, owners, and secret source are not filled
- process-local mediasoup/signaling state remains a multi-process/multi-node blocker
- no production-like soak has passed
- staging VPS bootstrap/firewall baseline is complete, and staging app/API/Nginx/TLS setup plus pre-smoke readiness checks now have redacted evidence
- staging LiveKit rollback env is present, staging DB schema is applied, coturn is running with a passing minimal no-open-relay check, and authenticated app/session passes
- staging Storage is explicitly deferred for media-only pre-smoke readiness
- staging-safe server-only SFU gate exists, but staging must still deploy it, set `MEDIA_ENABLE_STAGING_SFU=1` only in staging API env, restart API, and rerun authenticated mediasoup health
- coturn systemd-vs-Docker ownership remains undecided
- candidate port ranges are not implemented or load-proven
- no rollback drill has passed
- production monitoring/alerting is not implemented
- LiveKit fallback removal is not approved
- Stage 6 production Postgres migration remains deferred and separate

## Recommended Next Segment

Recommended next:
- `production-media-staging-pre-smoke-readiness-rerun` after deploying this gate to staging and setting `MEDIA_ENABLE_STAGING_SFU=1` only in staging API env

Acceptable alternative:
- `production-media-staging-smoke-run-report` only after authenticated mediasoup health passes on staging with the server-only gate and no production defaults

Do not proceed next to:
- staging direct/TURN media smoke before the staging API env includes `MEDIA_ENABLE_STAGING_SFU=1`, API is restarted, and authenticated mediasoup health is ready
- production default switch
- LiveKit removal
- firewall implementation
- Stage 6 production DB cutover
