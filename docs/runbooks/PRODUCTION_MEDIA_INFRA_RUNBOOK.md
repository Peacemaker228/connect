# Production Media Infrastructure Runbook

## Scope

This runbook is the operator-facing plan for a future production media rollout using `mediasoup + coturn`.

It follows the Stage 8 local MVP pass and prepares the Stage 9 / production media hardening track. It does not deploy production SFU, does not deploy production TURN, does not change real secret files, does not remove LiveKit, and does not modify the Stage 6 production Postgres migration path. A production-safe runtime config mapping foundation now exists for media env names, but production SFU/TURN remains disabled.

Current status:
- Stage 8 Media MVP is `local complete / production blocked`.
- Channel `AUDIO`, channel `VIDEO`, private SFU, screen share, restart/rejoin, route-away/back, offline/restore, and cleanup health have local/dev evidence.
- Local Docker coturn evidence exists for selected TURN relay smokes, but it is not production TURN readiness.
- `apps/api` recognizes the proposed `MEDIA_*` runtime names for TURN credentials and mediasoup listen/announced/RTC range config, with current `LOCAL_*` names preserved as local/dev fallbacks.
- Production media readiness remains blocked by process-local mediasoup/signaling state, missing production SFU/TURN infrastructure, missing production firewall/process plan, missing production-like soak, and missing rollback drill.
- LiveKit fallback remains required until a later scoped removal decision.

## Non-Goals

This runbook must not be treated as authorization to:
- enable production SFU default
- remove LiveKit or delete the LiveKit token path
- run Docker, PM2, systemd, Nginx, or firewall implementation changes
- change `.env.production` or server env files containing real secrets
- combine media rollout with Stage 6 MySQL -> Postgres cutover
- update Prisma, database migration tooling, or production `DATABASE_URL`
- claim multi-process media readiness

## Target Production Topology

Initial topology decision:
- use a single VPS / single media host first for the production media MVP/canary, unless a later operator review finds a hard capacity, network, or isolation blocker.
- keep `web` and `apps/api` inside the current app deploy contour for the first VPS rollout.
- keep `apps/api` as the owner of media control-plane and signaling.
- keep mediasoup worker lifecycle owned by the backend/media process for the MVP.
- run coturn as a separate managed service/container/process with its own restart policy and logs.
- keep Nginx/reverse proxy ownership limited to HTTPS/WSS app, API, and signaling traffic.
- send mediasoup RTC and coturn relay traffic directly to the media host, not through Nginx.

Logical roles:
- `web`: serves the current web shell and client bundle.
- `apps/api`: owns auth, domain API, realtime, media control-plane, signaling, TURN credential issuance, and health/observability endpoints.
- `mediasoup workers`: own WebRTC media routing through workers, routers, transports, producers, and consumers.
- `coturn`: owns STUN/TURN/NAT traversal and relay traffic.
- `Nginx` or the current reverse proxy: terminates HTTPS and proxies app/API/WSS traffic only.

Traffic separation:
- HTTPS/WSS app and signaling traffic goes through the reverse proxy.
- mediasoup RTC UDP/TCP traffic is direct between clients and the media host. It is not proxied through Nginx.
- coturn listener and relay traffic is direct between clients and coturn. It is not proxied through Nginx.

Rejected or deferred alternatives:
- split media host: deferred until single-host canary evidence shows CPU, network, isolation, or operational pressure.
- full Docker migration for app + API + media: deferred because it would widen the deploy migration beyond the media topology decision.
- separate distributed SFU cluster: rejected for the first rollout because current mediasoup/signaling state is process-local and no shared-state/session design exists yet.
- proxying media through Nginx: rejected because WebRTC RTC packets and TURN relay traffic must use direct UDP/TCP paths.

## Process Ownership Options

The MVP direction is chosen, but exact unit/container/ecosystem files remain future implementation work.

Recommended MVP direction:
- keep `web` and `apps/api` compatible with the current PM2-style deploy for the first VPS rollout.
- let the backend/media process own mediasoup worker lifecycle for the MVP.
- run coturn separately through either systemd or Docker after a focused implementation decision.
- do not introduce a full Docker migration for web/API/media unless explicitly approved in a later deploy modernization segment.

Process options and tradeoffs:

| Option | Fit | Tradeoffs |
| --- | --- | --- |
| PM2 | Best continuity for current `web` and `apps/api` deploy style. | Keep for app/API first; not preferred as the only coturn owner because service isolation, restart policy, and logs need explicit handling. |
| systemd | Strong fit for coturn and optionally a dedicated media service. | Requires later unit design, secret source, restart policy, and log capture; no unit is added in this segment. |
| Docker | Strong fit for repeatable coturn packaging and port exposure review. | Useful for coturn if approved; full app/API Docker migration is deferred to avoid widening rollout scope. |

Decision constraints:
- coturn must have a clear owner, restart policy, log path, and secret source.
- mediasoup worker lifecycle must be owned by the backend/media service or a dedicated media service, not by an ad hoc shell.
- production process ownership must not be mixed with the Stage 6 DB cutover process.

## Ports And Firewall Model

This section defines the candidate model only. It does not apply firewall rules and does not add Nginx, PM2, systemd, or Docker configs.

Required traffic classes:

| Traffic | Typical endpoint | Proxy path | Firewall model |
| --- | --- | --- | --- |
| Web/API/signaling HTTPS/WSS | public `web` and API origins | through Nginx | candidate public entrypoint: `443/tcp` |
| coturn STUN/TURN listener | media/TURN host public IP | direct, no Nginx | candidate listener: `3478/udp` and `3478/tcp` |
| coturn TLS listener | media/TURN host public IP | direct, no Nginx | defer `5349/tcp` unless restrictive-network evidence requires it |
| coturn relay ports | media/TURN host public IP | direct, no Nginx | candidate relay range: `49160-49240` |
| mediasoup RTC UDP | media host public IP | direct, no Nginx | candidate RTC range: `40000-40100/udp` |
| mediasoup RTC TCP fallback | media host public IP | direct, no Nginx | explicit review/defer unless production evidence requires it |

Rules:
- Do not expose broad ephemeral port ranges by default.
- Keep mediasoup RTC and coturn relay ranges separate. The current candidate model intentionally has no overlap between `40000-40100/udp` and `49160-49240`.
- Start with bounded ranges sized for a first canary, then widen only with load evidence and an operator-approved firewall update.
- Do not rely on Nginx for media packets or TURN relay packets.
- Confirm the public announced IP/address used by mediasoup and coturn matches the reachable production interface.
- Capture exact firewall rules in a later implementation runbook before applying them.

Range rationale:
- `40000-40100/udp` gives mediasoup a small, explicit RTC allocation range for first canary while avoiding coturn relay overlap.
- `49160-49240` aligns with the local TURN relay-range precedent but gives a wider first-canary relay window than the narrowest local smoke ranges.
- `5349/tcp` and mediasoup TCP fallback are deferred to avoid widening exposed surface before restrictive-network evidence requires them.

## Public Address And Announced IP

Production must record the public reachable IP or FQDN for the media host before any canary.

Requirements:
- mediasoup announced address must be the address clients can reach for the selected RTC range.
- coturn `external-ip` or equivalent must match the reachable VPS/media host address.
- if the host has private bind addresses plus public NAT, both bind and announced/external addresses must be documented.
- split-host future topology must revisit mediasoup announced IP, coturn external IP, firewall rules, and CORS/API origins.
- DNS/FQDN usage is acceptable only if the implementation segment confirms WebRTC/coturn behavior and certificate/TLS needs for the selected paths.

## TURN/STUN Strategy

Production TURN must use authenticated credentials.

Required policy:
- no open relay
- no anonymous TURN access
- short-lived credentials issued server-side after app auth/domain checks
- TURN static auth secret or equivalent secret stays server-side only
- no TURN secrets in browser bundle, docs, screenshots, logs, or committed env files
- credential TTL and refresh behavior must be explicit before canary
- failed credential issuance and TURN allocation errors must be observable

Risk model:
- TURN relay can carry high bandwidth and can be abused if credentials leak or TTL is too long.
- Relay traffic increases VPS bandwidth cost and can saturate network egress.
- Credential issuance endpoint must be rate-limited or otherwise protected before broad production use.
- coturn logs can contain usernames/session metadata and must be handled as operational logs, not public artifacts.

## Coturn Readiness Plan

Status: `planning / review`. This section defines readiness requirements for a future production coturn implementation. It does not deploy coturn, does not add systemd or Docker production files, does not change firewall rules, and does not enable production SFU/TURN defaults.

Readiness classification:
- production coturn readiness plan: `pass / documented`
- production coturn implementation: `blocked`
- production media default: `blocked`
- LiveKit rollback: `required / preserved`

Required production coturn config:
- listener: `3478/udp` and `3478/tcp` on the media/TURN host
- relay range: `49160-49240`, with no overlap with mediasoup RTC `40000-40100/udp`
- public address: external/public IP or FQDN recorded outside the repo and aligned with `MEDIA_HOST_PUBLIC_ADDRESS`
- realm: explicit production realm, stable across backend-issued credentials and coturn logs
- auth: TURN REST shared-secret auth through `MEDIA_TURN_STATIC_AUTH_SECRET`
- urls: `MEDIA_TURN_URLS` must point at the production TURN listener without exposing secrets
- ttl: `MEDIA_TURN_TTL_SECONDS` must be short-lived and compatible with call duration/retry behavior
- logs: coturn auth/allocation/error logs must be captured through the selected process owner
- admin/CLI: no public admin/CLI exposure; if enabled later, it must bind only to an operator-approved private/local interface
- TLS listener: `5349/tcp` remains deferred unless restrictive-network evidence requires it

No-open-relay policy:
- unauthenticated TURN relay allocation must fail
- bad credentials must fail
- credentials generated with a stale/expired timestamp must fail
- relay allocation, `CREATE_PERMISSION`, and `CHANNEL_BIND` must require valid short-lived credentials
- no anonymous TURN relay, no static browser-visible password, and no committed shared secret are allowed
- STUN binding behavior may be public if required, but relay allocation must not be public
- coturn must not be configured with broad public admin access or permissive anonymous relay options

Credential and secret ownership:
- `MEDIA_TURN_STATIC_AUTH_SECRET` is server-side only and must match coturn `static-auth-secret`.
- the secret source of truth must be outside the repo, with owner, rotation requirement, and last rotation date recorded in the env inventory.
- rotation must be coordinated between coturn and `apps/api` credential issuance; until a rotation drill exists, production coturn remains blocked.
- handoffs may record presence/source/owner, but never the secret value, generated TURN credential, auth headers, cookies, or full user identifiers from logs.

Systemd vs Docker decision criteria:
- choose systemd if the operator wants host-native service ownership, journald/logrotate integration, explicit restart policy, and package-managed coturn.
- choose Docker if the operator wants image-pinned repeatability, isolated coturn packaging, and explicit port publishing review.
- both options must define secret injection, restart policy, log capture, health/status command, upgrade path, and rollback procedure before implementation.
- Docker must not hide relay range behavior behind unexpected NAT/port publishing gaps.
- systemd must not rely on ad hoc shell exports for secrets or one-off manual starts.
- no final systemd-vs-Docker implementation choice is made by this readiness segment.

Coturn smoke plan:
1. Credential issuance:
   - configure non-production/staging `MEDIA_TURN_URLS`, `MEDIA_TURN_STATIC_AUTH_SECRET`, and `MEDIA_TURN_TTL_SECONDS` from the approved secret source.
   - verify backend-issued TURN credentials are returned only to authenticated app users.
   - verify health/debug output exposes only non-secret status/source/count metadata.
2. No-open-relay:
   - attempt unauthenticated relay allocation and confirm failure.
   - attempt allocation with invalid credentials and confirm failure.
   - attempt allocation with expired credentials and confirm failure.
3. Authenticated allocation:
   - use a generated short-lived credential to allocate through `3478/udp`.
   - repeat over `3478/tcp` only if TCP listener is in canary scope.
   - capture the selected relay candidate and coturn allocation log reference.
4. Permission and channel binding:
   - verify `CREATE_PERMISSION` succeeds only after authenticated allocation.
   - verify `CHANNEL_BIND` or equivalent data flow works for the selected smoke tool/browser path.
5. Cleanup:
   - close the client session and confirm coturn allocation cleanup in logs.
   - verify no lingering relay allocation after TTL/session close convergence.
6. Direct-vs-relay evidence:
   - run a direct-path smoke and a relay-forced smoke.
   - record selected candidate mode, user count, commit SHA, env names without values, and pass/review/fail classification.
7. Rollback:
   - verify LiveKit fallback remains available through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`.
   - verify disabling any future SFU/TURN canary gate leaves the LiveKit token path available.

Coturn readiness pass criteria:
- authenticated credentials issue without exposing secrets
- unauthenticated, invalid, and expired relay attempts fail
- authenticated allocation succeeds through the approved listener/range
- permission/channel-bind path succeeds in the selected smoke
- allocations clean up after close/TTL
- direct vs relay evidence is captured
- logs are available and redacted
- LiveKit rollback is verified

Coturn readiness fail/block criteria:
- open relay behavior is observed
- TURN shared secret is browser-visible, logged, or committed
- relay range does not match firewall/process config
- allocation works only with ad hoc local env values
- cleanup cannot be observed
- rollback to LiveKit cannot be verified
- process owner, logs, secret source, or rotation owner is missing

## Required Production Env Inventory

Do not paste secret values into this repository. Record only presence, owner, rotation date, and non-secret shape.

The detailed operator-facing inventory template is `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`.

Current local prototype names remain local/dev compatibility fallbacks. Runtime config now prefers the reviewed `MEDIA_*` names when present and falls back to current `LOCAL_*` names for local/dev. This mapping is not production enablement: prototype SFU/TURN endpoints remain disabled in production until a later canary segment explicitly changes that boundary.

| Group | Variables / decision | Notes |
| --- | --- | --- |
| Media provider/default gates | `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE`, `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT`, `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE`, `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT`, `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE`, plus any future production default switch | Current gates are non-production/default-candidate oriented. Production enablement needs an explicit canary/default decision and rebuild rules for `NEXT_PUBLIC_*`. |
| TURN URLs | `MEDIA_TURN_URLS`, fallback `LOCAL_TURN_URLS` | Browser receives URLs only through backend-issued credential response or approved config path. |
| TURN shared secret | `MEDIA_TURN_STATIC_AUTH_SECRET`, fallback `LOCAL_TURN_STATIC_AUTH_SECRET` | Secret is server-side only and must match coturn auth config. Secret values are not exposed in health/debug output. |
| TURN TTL | `MEDIA_TURN_TTL_SECONDS`, fallback `LOCAL_TURN_TTL_SECONDS` | Clamped to the current safe TTL range. |
| mediasoup listen IP | `MEDIA_SFU_LISTEN_IP`, fallback `LOCAL_MEDIASOUP_LISTEN_IP` | Bind address for media workers/transports. Defaults to local loopback when unset. |
| mediasoup announced IP/address | `MEDIA_SFU_ANNOUNCED_ADDRESS`, fallback `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | Public address clients can reach. Required when binding differs from public IP. |
| mediasoup RTC range | `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT` | Must align backend mediasoup transport config and firewall. Invalid ranges disable transport creation with a non-secret reason. |
| coturn listener/relay range | `MEDIA_TURN_RELAY_MIN_PORT` / `MEDIA_TURN_RELAY_MAX_PORT`, fallback local relay range names for metadata only | Must align coturn config and firewall. Backend does not manage coturn relay allocation directly. |
| API public URL | `NEXT_PUBLIC_API_URL`, optional `NEXT_PUBLIC_API_PORT`, optional `API_EXTERNAL_URL` | Must point browser to the production API origin. |
| API internal URL | `API_INTERNAL_URL` | Used by server-side web utilities/middleware. |
| CORS origins | `API_CORS_ALLOWED_ORIGINS` or `API_CORS_ORIGINS` | Must contain exact production web origins for credentialed API/WSS usage. |
| LiveKit fallback | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` | Keep until rollback path and removal segment are completed. |

Inventory output template:

| Item | Owner | Present? | Secret? | Rotation required? | Notes |
| --- | --- | --- | --- | --- | --- |
| TODO | TODO | TODO | yes/no | TODO | TODO |

Topology decision values to carry into the env inventory segment:
- initial topology: single VPS / single media host
- app process ownership: current PM2-style deploy compatibility for `web` and `apps/api`
- mediasoup ownership: backend/media process for MVP
- coturn ownership: separate systemd or Docker managed service/container/process, final implementation later
- HTTPS/WSS: `443/tcp` through Nginx
- coturn listener: `3478/udp` and `3478/tcp`
- coturn TLS listener: `5349/tcp` deferred
- coturn relay candidate range: `49160-49240`
- mediasoup RTC candidate range: `40000-40100/udp`
- mediasoup TCP fallback: deferred pending explicit review

## Deploy Order

This order is a rollout plan, not executed work.

1. Prepare production env inventory:
   - fill `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
   - map the chosen single-host topology to production env names
   - confirm `MEDIA_*` runtime mapping inputs without committing real values
   - record public announced IP/FQDN ownership
   - record TURN secret ownership without values
   - keep LiveKit fallback env available
2. Prepare infrastructure without changing defaults:
   - provision coturn and mediasoup process ownership in a reviewed implementation segment
   - configure bounded ports/firewall in a reviewed implementation segment
   - keep LiveKit fallback available
3. Smoke coturn:
   - verify authenticated credential issuance
   - verify no open relay
   - verify direct STUN candidate behavior where applicable
   - verify TURN relay allocation and cleanup
4. Smoke mediasoup health:
   - verify worker/router startup
   - verify announced IP candidates are reachable
   - verify room/session/transport/producer/consumer counters
   - verify cleanup returns active resources to zero after bounded convergence
5. Enable non-production or staging first:
   - use explicit gates
   - run direct and relay smokes
   - capture logs, health counters, and bandwidth notes
6. Production canary only later:
   - canary a narrow cohort or explicit route/query/env gate
   - keep default LiveKit fallback
   - promote to production default only after canary, monitoring, rollback drill, and operator sign-off

## State And Scaling Boundary

Current limitation:
- mediasoup/signaling state is process-local.
- the initial topology is single-process/single-host MVP/canary only.
- multi-process or multi-node media requires a later shared-state/session design.

Scaling boundary:
- no horizontal SFU scaling is claimed by this topology decision.
- no Redis/pubsub/session store is introduced in this segment.
- room pinning, participant session ownership, reconnect/resume behavior across process restarts, and shared producer/consumer discovery need a later design before multi-process rollout.
- production readiness cannot be claimed until the blocker is resolved or explicitly accepted for a narrow canary with rollback.

## Smoke Checklist

Run in non-production/staging first, then repeat during production canary.

Connectivity:
- direct path succeeds without TURN relay where expected
- relay path succeeds through coturn
- direct vs relay mode is visible in client/UI or logs
- no open relay behavior is observed
- unauthenticated, invalid, and expired TURN relay attempts fail before any canary
- authenticated TURN allocation, permission/channel-bind, and cleanup are recorded

Product flows:
- private call
- channel `AUDIO`
- channel `VIDEO`
- screen share start/stop
- mute/unmute
- camera off/on
- Restart
- Leave and rejoin
- route away and back
- browser refresh or offline/restore if in canary scope

Cleanup and health:
- active rooms settle to zero after all users leave
- active sessions settle to zero after cleanup convergence
- active transports settle to zero
- active producers settle to zero
- active consumers settle to zero
- failed produce/consume/transport counters do not increase unexpectedly
- coturn allocations close after clients leave

Record:
- environment and commit SHA
- gate values without secrets
- direct/relay classification
- user count
- observed bitrate/bandwidth notes
- app logs and coturn logs references
- pass/review/fail/block decision

## Rollback Plan

Rollback must be tested before broad production enablement.

Rollback controls:
- force LiveKit through query override: `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`
- force LiveKit through env/default switch by disabling any SFU production/canary gate
- stop SFU default/canary gate while leaving app/API and LiveKit token path available
- keep `GET /api/media/livekit-token` and LiveKit env configured until a later removal segment

Rollback trigger examples:
- elevated media join failure rate
- elevated transport connect failure rate
- TURN allocation failures or bandwidth abuse
- users cannot publish or consume audio/video
- screen share fails in canary scope
- cleanup counters do not converge
- process restart loses active room state in a way the product cannot tolerate
- operator cannot tell whether users are on LiveKit or SFU

Rollback output:

```text
Run id:
Trigger:
Gate changed:
LiveKit fallback verified:
SFU sessions drained or terminated:
Logs captured:
Follow-up owner:
```

## Monitoring And Observability

Minimum metrics/counters before production canary:
- active media rooms
- active participant sessions
- active mediasoup transports
- active producers
- active consumers
- failed transport create/connect
- failed produce
- failed consume
- failed credential issuance
- direct vs relay transport counts
- TURN allocations
- TURN auth errors
- TURN allocation failures
- TURN relay bandwidth
- app/media bandwidth where available
- worker process restarts and crashes
- cleanup sweeps and stale-session closures

Logs to capture:
- app/API media control-plane logs for join/leave/restart/reconnect
- media signaling connect/disconnect logs
- mediasoup worker/router/transport lifecycle logs
- produce/consume failure details with non-secret identifiers
- coturn authentication/allocation/error logs
- coturn no-open-relay smoke failures/successes without credential values
- reverse proxy WSS/API errors
- process manager restart/crash logs

Alert candidates:
- active resources do not converge after rooms empty
- TURN allocation failure spike
- transport failure spike
- produce/consume failure spike
- unexpected relay-only behavior for most users
- bandwidth above canary budget
- SFU process restart during active canary

## Production Blockers

Production rollout remains blocked until all are resolved or explicitly accepted:
- mediasoup/signaling state is process-local
- no multi-process/shared-state design exists yet
- no production-like soak has passed
- no completed VPS firewall/process plan exists
- no rollback drill has passed
- candidate production ranges are chosen but not implemented or load-proven
- coturn readiness criteria are documented, but production coturn is not deployed and systemd-vs-Docker ownership remains undecided
- runtime env mapping exists, but concrete production values, owners, and secret rotation source are not filled
- production monitoring/alerting is not implemented
- LiveKit fallback removal is not approved

## Next Segments

Recommended next:
- `production-mediasoup-process-plan`

Acceptable alternative:
- `production-media-staging-smoke-run-report` only after coturn and mediasoup process implementation segments exist

Do not proceed next to:
- production default switch
- LiveKit removal
- Stage 6 production Postgres cutover
- broad Docker/PM2/Nginx/firewall implementation without topology/env decisions
