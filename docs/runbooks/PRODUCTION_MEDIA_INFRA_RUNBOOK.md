# Production Media Infrastructure Runbook

## Scope

This runbook is the operator-facing plan for a future production media rollout using `mediasoup + coturn`.

It follows the Stage 8 local MVP pass and prepares the Stage 9 / production media hardening track. It is planning only. It does not deploy production SFU, does not deploy production TURN, does not change runtime code, does not change real secret files, does not remove LiveKit, and does not modify the Stage 6 production Postgres migration path.

Current status:
- Stage 8 Media MVP is `local complete / production blocked`.
- Channel `AUDIO`, channel `VIDEO`, private SFU, screen share, restart/rejoin, route-away/back, offline/restore, and cleanup health have local/dev evidence.
- Local Docker coturn evidence exists for selected TURN relay smokes, but it is not production TURN readiness.
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

Initial production target is a single-host or single-media-node MVP unless a later topology decision chooses otherwise.

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

## Process Ownership Options

No final process manager decision is made by this runbook.

Options to decide in `production-media-topology-decision`:

| Option | Fit | Tradeoffs |
| --- | --- | --- |
| PM2 | Matches the known current production process style. | Easier continuity for `web` and `apps/api`; weaker service isolation for coturn and native media workers unless carefully supervised. |
| systemd | Good for OS-managed long-running services such as coturn and a backend/media process. | Requires explicit unit design, restart policy, log ownership, and deployment order. |
| Docker | Good for repeatable coturn/SFU packaging and port mapping review. | Requires reviewed image/build/runtime policy, volume/log strategy, network mode decisions, and firewall mapping. |

Decision constraints:
- coturn must have a clear owner, restart policy, log path, and secret source.
- mediasoup worker lifecycle must be owned by the backend/media service or a dedicated media service, not by an ad hoc shell.
- production process ownership must not be mixed with the Stage 6 DB cutover process.

## Ports And Firewall Model

This section defines the model only. Exact port ranges must be selected and approved in a later implementation segment.

Required traffic classes:

| Traffic | Typical endpoint | Proxy path | Firewall model |
| --- | --- | --- | --- |
| Web HTTPS | public `web` origin | through Nginx | allow HTTPS from users |
| API HTTPS | public API origin | through Nginx | allow HTTPS from users |
| Realtime/media signaling WSS | API/realtime origin | through Nginx | allow WSS over HTTPS from users |
| mediasoup RTC UDP/TCP | media host public IP and selected RTC range | direct, no Nginx | allow selected UDP range, optional TCP fallback range if approved |
| coturn STUN/TURN listener | media/TURN host public IP and selected listener ports | direct, no Nginx | allow selected UDP/TCP listener ports |
| coturn relay ports | media/TURN host public IP and selected relay range | direct, no Nginx | allow selected relay UDP/TCP range |

Rules:
- Do not expose broad ephemeral port ranges by default.
- Choose bounded mediasoup RTC and coturn relay ranges sized for the planned canary, then widen only with load evidence.
- Do not rely on Nginx for media packets or TURN relay packets.
- Confirm the public announced IP/address used by mediasoup and coturn matches the reachable production interface.
- Capture exact firewall rules in a later implementation runbook before applying them.

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

## Required Production Env Inventory

Do not paste secret values into this repository. Record only presence, owner, rotation date, and non-secret shape.

Current local prototype names are not automatically production names. A later env inventory segment must either approve production names or map them to reviewed equivalents.

| Group | Variables / decision | Notes |
| --- | --- | --- |
| Media provider/default gates | `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE`, `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT`, `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE`, `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT`, `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE`, plus any future production default switch | Current gates are non-production/default-candidate oriented. Production enablement needs an explicit canary/default decision and rebuild rules for `NEXT_PUBLIC_*`. |
| TURN URLs | production equivalent of `LOCAL_TURN_URLS` | Browser receives URLs only through backend-issued credential response or approved config path. |
| TURN shared secret | production equivalent of `LOCAL_TURN_STATIC_AUTH_SECRET` or another coturn auth mechanism | Secret is server-side only and must match coturn auth config. |
| TURN TTL | production equivalent of `LOCAL_TURN_TTL_SECONDS` | Must balance reliability and abuse containment. |
| mediasoup listen IP | production equivalent of `LOCAL_MEDIASOUP_LISTEN_IP` | Bind address for media workers/transports. |
| mediasoup announced IP/address | production equivalent of `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | Public address clients can reach. Required when binding differs from public IP. |
| mediasoup RTC range | future production env/config names | Must align backend mediasoup transport config and firewall. |
| coturn listener/relay range | future production env/config names | Must align coturn config and firewall. |
| API public URL | `NEXT_PUBLIC_API_URL`, optional `NEXT_PUBLIC_API_PORT`, optional `API_EXTERNAL_URL` | Must point browser to the production API origin. |
| API internal URL | `API_INTERNAL_URL` | Used by server-side web utilities/middleware. |
| CORS origins | `API_CORS_ALLOWED_ORIGINS` or `API_CORS_ORIGINS` | Must contain exact production web origins for credentialed API/WSS usage. |
| LiveKit fallback | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` | Keep until rollback path and removal segment are completed. |

Inventory output template:

| Item | Owner | Present? | Secret? | Rotation required? | Notes |
| --- | --- | --- | --- | --- | --- |
| TODO | TODO | TODO | yes/no | TODO | TODO |

## Deploy Order

This order is a rollout plan, not executed work.

1. Prepare production topology decision:
   - decide single-host vs split media host
   - decide PM2 vs systemd vs Docker ownership
   - decide exact mediasoup RTC range, coturn listener ports, and coturn relay range
   - decide production env names and secret ownership
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

## Smoke Checklist

Run in non-production/staging first, then repeat during production canary.

Connectivity:
- direct path succeeds without TURN relay where expected
- relay path succeeds through coturn
- direct vs relay mode is visible in client/UI or logs
- no open relay behavior is observed

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
- exact production mediasoup/coturn port ranges are undecided
- exact production process ownership is undecided
- exact production env inventory and secret rotation plan are incomplete
- production monitoring/alerting is not implemented
- LiveKit fallback removal is not approved

## Next Segments

Recommended next:
- `production-media-topology-decision`

Acceptable alternative:
- `production-media-env-inventory-template`

Do not proceed next to:
- production default switch
- LiveKit removal
- Stage 6 production Postgres cutover
- broad Docker/PM2/Nginx/firewall implementation without topology/env decisions
