# Production Media Infrastructure Runbook

## Scope

This runbook is the operator-facing plan for a future production media rollout using `mediasoup + coturn`.

It follows the Stage 8 local MVP pass and prepares the Stage 9 / production media hardening track. It does not deploy production SFU, does not deploy production TURN, does not change real secret files, does not remove LiveKit, and does not modify the Stage 6 production Postgres migration path. A production-safe runtime config mapping foundation now exists for media env names, but production SFU/TURN remains disabled.

Current status:
- Stage 8 Media MVP is `local complete / production blocked`.
- Channel `AUDIO`, channel `VIDEO`, private SFU, screen share, restart/rejoin, route-away/back, offline/restore, and cleanup health have local/dev evidence.
- Local Docker coturn evidence exists for selected TURN relay smokes, but it is not production TURN readiness.
- `apps/api` recognizes the proposed `MEDIA_*` runtime names for TURN credentials and mediasoup listen/announced/RTC range config, with current `LOCAL_*` names preserved as local/dev fallbacks.
- Production media readiness remains blocked by process-local mediasoup/signaling state, missing production SFU/TURN infrastructure, missing production firewall/process implementation, missing production-like soak, and missing rollback drill.
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
- use a separate staging/preprod VPS before any production media canary, because the operator can provision one and it avoids risky testing on the current production VPS.
- after staging/preprod passes, use a single production VPS / single production media host first for the production media MVP/canary, unless a later operator review finds a hard capacity, network, or isolation blocker.
- keep `web` and `apps/api` inside the current app deploy contour for the first VPS rollout.
- keep `apps/api` as the owner of media control-plane and signaling.
- keep mediasoup worker lifecycle owned by the backend/media process for the MVP.
- run coturn as a separate managed service/container/process with its own restart policy and logs.
- keep Nginx/reverse proxy ownership limited to HTTPS/WSS app, API, and signaling traffic.
- send mediasoup RTC and coturn relay traffic directly to the media host, not through Nginx.

Staging decision:
- staging/preprod origin target: `https://staging.ax-connect.ru`.
- staging public IPv4 is operator-owned and must stay outside repository docs and handoffs unless a later private operator inventory explicitly allows it.
- staging should be bootstrapped first, then used for direct/TURN media smoke, rollback checks, and runbook rehearsal.
- staging success is not enough for production readiness by itself; the production VPS still needs a later narrow canary because IP, firewall, Nginx, env, and process ownership differ.

Production domain decision:
- canonical production web origin direction: `https://ax-connect.ru`.
- `https://www.ax-connect.ru` should redirect to the canonical origin when the production deploy/runbook work reaches domain/Nginx implementation.

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
- prefer Docker-managed coturn for staging/preprod because the operator is moving toward Docker/CI-CD and coturn benefits from repeatable packaging and explicit port publishing review.
- keep systemd as an acceptable fallback if Docker on the VPS introduces host-networking, logging, or operations friction.
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

Staging/preprod must record the same class of information before staging smoke:
- `staging.ax-connect.ru` DNS must resolve to the staging VPS.
- the actual staging public IPv4 must be recorded in the private operator inventory, not committed to repo docs.
- mediasoup announced address and coturn external/public address must align with the reachable staging host.

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

## Mediasoup Process Plan

Status: `planning / review`. This section defines process, lifecycle, health, restart, env, and smoke requirements for a future production mediasoup MVP/canary. It does not enable production SFU, does not add PM2/systemd/Docker/Nginx/firewall config, and does not change runtime code.

Readiness classification:
- production mediasoup process plan: `pass / documented`
- production mediasoup implementation: `blocked`
- production SFU availability: `blocked`
- production media default: `blocked`
- multi-process readiness: `blocked`
- LiveKit rollback: `required / preserved`

Process ownership direction for MVP:
- keep mediasoup worker lifecycle owned by the backend/media runtime for the first single VPS MVP/canary.
- keep `apps/api` as the media control-plane and signaling owner.
- treat the first production canary as single-process/single-host only.
- do not claim horizontal scaling, multi-process routing, or process-restart session continuity.
- if the API/media process restarts, active SFU rooms are expected to be interrupted unless a later design adds shared state and session recovery.

Process options and criteria:

| Option | Fit for first canary | Criteria before implementation |
| --- | --- | --- |
| Existing `apps/api` process under current PM2-style deploy | Best continuity and smallest process surface for single VPS MVP. | Needs explicit env mapping, health check, restart policy, log capture, rollback plan, and acceptance that process-local state is lost on restart. |
| Dedicated media process from the same backend codebase | Useful if SFU lifecycle needs isolation from domain API. | Needs explicit API/signaling boundary, process communication, auth/session ownership, health endpoint, deploy command, logs, and rollback path. |
| systemd-managed media process | Useful for host-native restart/log policy if media is split from API. | Needs unit design, secret source, environment file ownership, restart limits, journald/logrotate policy, and operator status commands. |
| Docker-managed media process | Useful for pinned repeatability and explicit port publishing. | Needs image/version ownership, host networking or exact UDP range publishing, secret injection, logs, restart policy, and rollback procedure. |

MVP recommendation:
- start with backend/media-owned mediasoup lifecycle inside the current `apps/api` process only if the canary is explicitly single-process/single-host and LiveKit rollback is verified.
- move to a dedicated media process only after process communication, shared state, and restart semantics are designed.
- do not split to multi-process or multi-node SFU until room/session ownership and shared producer/consumer discovery are solved.

Worker/router lifecycle requirements:
- worker startup must be observable before canary.
- router creation must be observable before transport creation.
- worker death must be treated as a readiness failure until a replacement worker/router is created and active sessions are handled.
- router closure must prevent new transport creation until recreated.
- active transports, producers, consumers, rooms, and participant sessions must be tracked per process.
- stale session cleanup must converge resources to zero after leave/rejoin, route-away, browser close, or process recovery tests.
- mediasoup worker version/binary path should be visible in non-secret health/readiness output.

Restart and crash behavior:
- process manager restart policy must be explicit before implementation.
- restart loops must be bounded by process manager limits; no ad hoc infinite shell restart loops.
- a mediasoup worker crash during canary must trigger operator-visible failure status and rollback consideration.
- active rooms may be dropped in the first single-process canary; this is acceptable only with explicit canary scope and LiveKit rollback.
- restart smoke must prove the process returns to a healthy empty state after active sessions are drained or interrupted.
- rollback drill must prove disabling SFU canary/default leaves LiveKit available.

Required health/readiness signals:
- service status: disabled/ready/failed
- production guard/canary gate status without exposing secrets
- mediasoup version and worker binary path
- worker pid and closed/died state
- router id, closed state, and codec count
- active room count
- tracked participant session count
- active transport count
- active producer count
- active consumer count
- producer/consumer counts by source
- direct vs relay requested transport mode counts
- failed transport create/connect counts
- failed produce/consume/resume counts
- stale sweep and stale session closed counts
- last cleanup summary
- non-secret runtime config source/status for `MEDIA_SFU_*`

Required media env/process mapping:
- `MEDIA_SFU_LISTEN_IP`: bind/listen IP for mediasoup WebRTC transports.
- `MEDIA_SFU_ANNOUNCED_ADDRESS`: public reachable IP/FQDN announced to clients.
- `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT`: bounded RTC port range, candidate `40000-40100/udp`.
- range must not overlap coturn relay `49160-49240`.
- missing or invalid values must fail readiness or transport creation with non-secret reasons.
- real IPs/FQDNs and secret-bearing env files must not be committed.

Mediasoup smoke/readiness plan:
1. Worker/router startup:
   - start the selected non-production/staging process with `MEDIA_SFU_*` env names.
   - verify health reports worker pid, router id, router codec count, version, and non-secret runtime config.
2. Transport creation:
   - create send and receive WebRTC transports.
   - verify ICE candidates use the intended listen/announced address and RTC port range.
   - verify invalid/reversed port range disables transport creation with a clear non-secret reason.
3. Produce/consume:
   - publish microphone/camera and consume from a second participant.
   - verify producer/consumer counts by source and per-room counts.
   - include screen-share if canary scope includes channel/private video.
4. Cleanup:
   - leave/rejoin, route away/back, and close browser contexts.
   - verify active rooms/sessions/transports/producers/consumers settle to zero after bounded cleanup convergence.
5. Restart/crash behavior:
   - restart the selected process in non-production/staging.
   - verify health returns to ready or failed deterministically, without unbounded retry loops.
   - verify active-room interruption behavior is documented and LiveKit rollback remains available.
6. Direct/relay evidence:
   - run direct path and TURN-assisted path after coturn readiness is implemented.
   - record direct-vs-relay requested/selected mode evidence.
7. Rollback:
   - verify `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false` still force LiveKit.
   - verify disabling a future SFU canary/default gate stops new SFU joins.

Mediasoup process readiness pass criteria:
- worker/router startup is observable
- transport create/connect works with intended `MEDIA_SFU_*` config
- produce/consume works for canary scope
- cleanup converges to zero active resources
- restart behavior is bounded and documented
- process/log ownership is explicit
- LiveKit rollback is verified

Mediasoup process readiness fail/block criteria:
- worker/router health is unavailable
- RTC candidates expose wrong address or unbounded ports
- process restart loops without bounded policy
- active resources do not converge after cleanup
- process-local state risk is not accepted for canary scope
- no rollback to LiveKit is available
- production values, logs, or process owner are missing

## Process/Env Readiness Review

Status: `planning / review`. This matrix consolidates production media process and env prerequisites before any staging or production smoke run. It records what is already defined, what needs operator input, and what blocks execution. It does not fill real values, change env files, add infrastructure configs, run smoke, or enable production SFU/TURN/default behavior.

Readiness classification:
- production process/env readiness review: `pass / documented`
- concrete production values: `blocked / not filled`
- staging smoke plan: `allowed next`
- staging smoke run: `blocked until required operator inputs are filled`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`

Matrix:

| Item | Status | Required operator input before smoke run | Notes |
| --- | --- | --- | --- |
| Media host public address / owner (`MEDIA_HOST_PUBLIC_ADDRESS`) | `block` | public IP/FQDN presence, owner, source of truth, validation method | Do not commit real value. Must align mediasoup announced address and coturn external/public IP. |
| Web/API public origins | `block` | production web origin, API origin, rebuild/redeploy owner for public env | Needed for browser API/WSS and future canary gates. |
| API internal URL / CORS relation | `review` | whether `API_INTERNAL_URL` is needed; exact CORS origin owner/check | CORS must match deployed web origins for credentialed API/WSS if staging/prod smoke uses browser flows. |
| `MEDIA_TURN_URLS` | `block` | presence, owner, validation check using production TURN listener placeholders | URLs are non-secret, but real host values should stay in operator inventory, not this repo. |
| `MEDIA_TURN_STATIC_AUTH_SECRET` | `block` | presence only, owner, source of truth, rotation source/cadence | Never record value. Must match coturn `static-auth-secret` or equivalent auth config. |
| `MEDIA_TURN_TTL_SECONDS` | `review` | approved short-lived TTL and validation check | Runtime mapping exists; production TTL still needs operator approval. |
| `MEDIA_TURN_RELAY_MIN_PORT` / `MEDIA_TURN_RELAY_MAX_PORT` | `review` | approve or replace `49160-49240`; confirm firewall/process owner | Candidate range is documented, but not implemented or load-proven. |
| `MEDIA_SFU_LISTEN_IP` | `block` | bind/listen interface ownership and validation check | Must match selected process/network model. |
| `MEDIA_SFU_ANNOUNCED_ADDRESS` | `block` | public reachable IP/FQDN presence, owner, validation check | Must match `MEDIA_HOST_PUBLIC_ADDRESS` for single-host MVP unless an approved split-host topology exists. |
| `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT` | `review` | approve or replace `40000-40100/udp`; confirm no TURN relay overlap | Runtime mapping exists; firewall/process implementation is still missing. |
| Coturn process owner: systemd vs Docker | `block` | choose owner, restart policy, secret injection model, log path, status command | Criteria are documented; implementation choice is not made. |
| Mediasoup process owner: `apps/api` MVP vs dedicated process | `review` | confirm first canary stays backend/media-owned in `apps/api` or approve dedicated process design | Current recommendation is `apps/api` MVP single-process/single-host only. |
| App/media/coturn logs owner/path | `block` | log owner, storage/path, retention/redaction policy, operator access | Needed for smoke evidence and rollback decisions. |
| Rollback path: LiveKit env/token/gates | `pass / drill blocked` | confirm `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` presence and rollback owner without values | LiveKit path remains required; rollback drill still has not passed. |
| Firewall plan status | `block` | exact owner and reviewed rules for `443/tcp`, `3478/udp+tcp`, coturn relay range, mediasoup RTC range | No firewall command/config is added by this runbook. |
| Monitoring/alerting status | `block` | owner and minimum alert destinations for media failures/resource leaks/restarts | Metrics are defined, but production monitoring is not implemented. |
| Staging smoke prerequisites | `block` | filled non-secret inventory, process owner, logs, firewall assumptions, rollback owner, smoke operator | Staging smoke plan may be written next; running it remains blocked until inputs exist. |

Required operator inputs before a staging smoke run:
- media host public address presence and owner
- public web/API origins and CORS owner
- `MEDIA_TURN_*` presence/owner/rotation metadata without values
- `MEDIA_SFU_*` presence/owner/validation metadata without values
- coturn process owner decision and log path
- mediasoup process owner confirmation and restart policy
- firewall owner and reviewed candidate ranges
- LiveKit rollback env presence and rollback operator
- monitoring/log capture owner
- staging smoke operator and run window

Staging smoke run remains blocked if any of these are missing:
- real env source is unavailable to the operator
- secret presence/owner/rotation source is unknown
- media host public address is not recorded outside the repo
- coturn or mediasoup process owner is undecided
- firewall assumptions are not reviewed
- logs cannot be captured and redacted
- LiveKit rollback cannot be verified
- staging smoke would require production default or LiveKit removal

## Staging VPS Bootstrap Plan

Status: `bootstrap completed / redacted report recorded`. This section is the operator-facing bootstrap handoff for the separate staging/preprod VPS. It does not change production, does not write real env files, does not start coturn/media smoke, and does not enable SFU/TURN/default behavior.

Readiness classification:
- staging VPS bootstrap plan: `pass / documented`
- staging VPS bootstrap execution: `pass / completed by operator`
- staging VPS bootstrap run report: `pass / redacted evidence recorded`
- staging env setup: `blocked until staging env/app/API/coturn plan`
- staging smoke run: `blocked until staging env exists`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

Run report summary:
- `staging.ax-connect.ru` A-record was added and observed through public DNS-over-HTTPS; the real staging public IPv4 remains outside repo docs.
- initial exposed root credential was rotated by the operator.
- non-root deploy user with sudo was created.
- deploy SSH-key login passed before password/root SSH access was disabled.
- final SSH settings are `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, and `PubkeyAuthentication yes`.
- apt/base package baseline passed by operator report.
- Docker `29.5.2`, Docker Compose `v5.1.4`, Bun `1.3.14`, Node.js `v22.22.2`, npm `10.9.7`, and PM2 `7.0.1` are installed.
- Nginx is active and `nginx -t` passes; no staging TLS site is configured yet.
- UFW is active with default incoming deny and allows `22/tcp`, `443/tcp`, `3478/tcp+udp`, `49160:49240/tcp+udp`, and `40000:40100/udp`.
- provider firewall/security group was not found by the operator.
- post-upgrade reboot was completed; kernel is `Linux 5.15.0-179-generic`; reboot-required flag cleared.
- no app/API deploy, coturn container, staging env fill, media smoke, production change, LiveKit removal, or Stage 6/Postgres change was performed.

Operator placeholders:
- `<STAGING_HOST>` is `staging.ax-connect.ru` after DNS is correct, or the private operator-owned staging IP during first access.
- `<DEPLOY_USER>` is the non-root staging deploy/operator user.
- `<LOCAL_PUBLIC_KEY>` is the operator public SSH key only. Never paste a private key.

DNS check from the operator workstation:

```bash
nslookup staging.ax-connect.ru
dig +short A staging.ax-connect.ru
```

Windows PowerShell alternative:

```powershell
Resolve-DnsName staging.ax-connect.ru -Type A
```

First staging SSH login:

```bash
ssh root@<STAGING_HOST>
hostnamectl
lsb_release -a
whoami
pwd
ip -brief addr
```

The initial root password was exposed in chat and must be rotated immediately:

```bash
passwd
```

Create a non-root deploy user:

```bash
adduser <DEPLOY_USER>
usermod -aG sudo <DEPLOY_USER>
id <DEPLOY_USER>
```

Create or select a local SSH key on the operator workstation:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ax_connect_staging_ed25519 -C "ax-connect-staging"
cat ~/.ssh/ax_connect_staging_ed25519.pub
```

Install only the public key on the VPS:

```bash
install -d -m 700 -o <DEPLOY_USER> -g <DEPLOY_USER> /home/<DEPLOY_USER>/.ssh
printf '%s\n' '<LOCAL_PUBLIC_KEY>' > /home/<DEPLOY_USER>/.ssh/authorized_keys
chown <DEPLOY_USER>:<DEPLOY_USER> /home/<DEPLOY_USER>/.ssh/authorized_keys
chmod 600 /home/<DEPLOY_USER>/.ssh/authorized_keys
```

Verify a second SSH session before hardening password access:

```bash
ssh -i ~/.ssh/ax_connect_staging_ed25519 <DEPLOY_USER>@<STAGING_HOST>
sudo -v
```

Harden SSH only after key login works and hosting console fallback is available:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.pre-bootstrap.$(date +%Y%m%d%H%M%S)
sudo sshd -T | egrep 'permitrootlogin|passwordauthentication|pubkeyauthentication'
sudoedit /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl reload ssh
sudo sshd -T | egrep 'permitrootlogin|passwordauthentication|pubkeyauthentication'
```

Target SSH settings:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Base package baseline:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl unzip build-essential ca-certificates gnupg lsb-release ufw nginx
git --version
curl --version
unzip -v
gcc --version
sudo nginx -v
```

Docker readiness for staging coturn:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker <DEPLOY_USER>
docker --version
sudo docker compose version
sudo systemctl status docker --no-pager
```

After re-login as `<DEPLOY_USER>`:

```bash
docker ps
docker compose version
```

Bun, Node, and PM2 readiness for app/API:

```bash
node --version || true
npm --version || true
bun --version || true
pm2 --version || true
curl -fsSL https://bun.sh/install | bash
~/.bun/bin/bun --version
npm --version
sudo npm install -g pm2
pm2 --version
pm2 status
```

If `npm --version` fails, stop and record a bootstrap blocker instead of improvising a Node install path in this segment.

Do not clone/deploy the app, fill env, or start app/API processes in this bootstrap plan unless a later staging env setup segment explicitly instructs it.

Nginx readiness:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo ss -lntup
```

UFW and provider firewall discovery:

```bash
sudo ufw status verbose
sudo iptables -S
sudo nft list ruleset
sudo ss -lntup
sudo ss -lnup
```

Candidate staging ports:
- `443/tcp` for HTTPS/WSS through Nginx
- `3478/udp` and `3478/tcp` for coturn listener
- `49160-49240` for coturn relay candidate range
- `40000-40100/udp` for mediasoup RTC candidate range

Host UFW candidate commands after console fallback and SSH key login are verified:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49160:49240/tcp
sudo ufw allow 49160:49240/udp
sudo ufw allow 40000:40100/udp
sudo ufw status numbered
sudo ufw enable
sudo ufw status verbose
```

Status/log commands to preserve for later run reports:

```bash
pm2 status
pm2 logs --lines 100
pm2 describe <PROCESS_NAME>
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
docker ps
docker compose ps
docker logs <COTURN_CONTAINER_NAME> --tail 100
sudo systemctl status docker --no-pager
sudo ufw status verbose
sudo ss -lntup
sudo ss -lnup
```

Redaction rules for operator output:
- redact root passwords, private keys, real staging public IPv4, real production IPs, generated TURN usernames/passwords, TURN shared secrets, LiveKit secrets, `.env` values, database URLs, storage keys, cookies, JWTs, auth headers, session identifiers, and coturn usernames/session metadata.
- allowed output includes command names, package versions, service status, non-secret port ranges, redacted listener summaries, DNS pass/fail with IP redacted, and env names without values.

No-production-impact guardrails:
- run bootstrap only on the separate staging VPS.
- keep the current production VPS untouched.
- keep LiveKit fallback available and do not remove the LiveKit token path.
- do not enable production SFU/TURN/default gates.
- do not create or edit repo `.env`, `.env.local`, `.env.production`, or real server env values.
- do not start staging smoke until bootstrap and staging env setup are complete.

## Staging Env / Deploy Setup Plan

Status: `planning / documented`. This section defines the staging app/API/media env and deploy shape after successful staging VPS bootstrap. It does not connect to the VPS, deploy code, create real env files, run migrations, start PM2/coturn/media services, run smoke, change production, enable SFU/TURN/default gates, remove LiveKit, or touch the Stage 6/Postgres production migration path.

Readiness classification:
- staging env/deploy setup plan: `pass / documented`
- staging deploy execution: `blocked until operator-approved run segment`
- staging env values: `blocked / not filled`
- staging coturn config: `blocked / planned only`
- staging smoke run: `blocked until deploy/env/coturn/process/log readiness exists`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

Layout:
- repo path candidate: `/var/www/ax-connect-staging`
- owner: `deploy:deploy`
- server-local env/config roots: `/etc/ax-connect-staging` and `/opt/ax-connect-staging/coturn`
- source strategy: clone a staging-approved branch or explicit commit SHA; do not use production deploy path or production working tree.
- no dirty local state, real secrets, or production env values should be used for staging deploy.

Process model:
- web PM2 process: `ax-connect-staging-web`
- API PM2 process: `ax-connect-staging-api`
- web candidate: `127.0.0.1:3001`
- API candidate: `127.0.0.1:4000`
- web command shape for later run: `bun next start -p 3001`
- API command shape for the current staging build: `node apps/api/dist/apps/api/src/main.js`
- note: root `start:web` currently hardcodes `next start -p 3000`, so staging should use direct PM2 args or a staging-specific ecosystem file rather than production process settings.

Process status/log commands after deploy:

```bash
pm2 status
pm2 describe ax-connect-staging-web
pm2 describe ax-connect-staging-api
pm2 logs ax-connect-staging-web --lines 100
pm2 logs ax-connect-staging-api --lines 100
curl -fsS http://127.0.0.1:3001/ >/dev/null
curl -fsS http://127.0.0.1:4000/api/health
curl -fsS http://127.0.0.1:4000/api/media/prototype/mediasoup/health
```

Nginx staging site plan:
- public origin: `https://staging.ax-connect.ru`
- site config candidate: `/etc/nginx/sites-available/ax-connect-staging`
- enabled symlink candidate: `/etc/nginx/sites-enabled/ax-connect-staging`
- `/` proxies to `http://127.0.0.1:3001`
- `/api/` proxies to `http://127.0.0.1:4000`
- Socket.IO realtime uses path `/socket.io/` and namespace `/realtime`; proxy `/socket.io/` to the API upstream with WebSocket headers.
- if a future raw `/realtime` WSS endpoint exists, proxy it to the same API upstream.
- TLS preferred path: certbot with Nginx plugin after web/API processes and staging site config are ready.
- HTTP-01 issuance requires `80/tcp`; current bootstrap UFW baseline does not allow `80/tcp`, so the later run segment must either temporarily allow `80/tcp` or use DNS-01.
- no Nginx config or certificate is applied in this segment.

Env inventory without values:

| Env item | Required? | Secret? | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | no | Recommended runtime class: `production` for optimized Next/Nest behavior; staging identity comes from origin/path and optional later `APP_ENV=staging`. |
| `NEXT_PUBLIC_API_URL` | yes | no | Staging public origin; requires web rebuild. |
| `API_INTERNAL_URL` | yes/review | no | Local API origin shape, e.g. loopback API URL. |
| `API_PORT` | yes | no | Candidate `4000`. |
| `API_CORS_ALLOWED_ORIGINS` | yes | no | Must include exact staging public origin. |
| `AUTH_TOKEN_SECRET` | yes | yes | Presence only; must not use dev default. |
| `DATABASE_URL` | yes | yes | Presence only; must be separate staging DB, never production. |
| `STORAGE_*` | yes for upload flows | mixed | Presence/source only; staging bucket/prefix must be separate from production. |
| `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` | yes for rollback | mixed | Presence only; LiveKit fallback remains required. |
| `MEDIA_TURN_*` | yes for TURN phases | mixed | Presence/source only; no generated credentials or shared secret values. |
| `MEDIA_SFU_*` | yes for SFU phases | no/sensitive | Presence/source only; real public IP remains private operator inventory. |

Staging database decision:
- staging DB must be separate from production.
- do not use production `DATABASE_URL`.
- active repo direction is PostgreSQL; staging media setup should use a separate staging PostgreSQL database unless a later runtime review explicitly chooses another isolated path.
- Docker-managed Postgres on the staging VPS is acceptable for isolated staging media rehearsal if the operator accepts VPS-local storage/backup limitations.
- managed staging Postgres is acceptable if the operator wants stronger operational isolation.
- production DB reuse is forbidden.
- no migrations are run in this segment.

Coturn Docker plan:
- Docker-managed coturn is preferred for staging.
- proposed config paths: `/opt/ax-connect-staging/coturn/docker-compose.yml` and `/etc/ax-connect-staging/coturn.env`.
- container name: `ax-connect-staging-coturn`.
- listener: `3478/udp` and `3478/tcp`.
- relay range: `49160-49240/udp` and `49160-49240/tcp`.
- no open relay, no anonymous relay allocation.
- `MEDIA_TURN_STATIC_AUTH_SECRET` / coturn `static-auth-secret` source stays outside repo.
- realm, external/public address, relay min/max, logs, and status command must be filled in a later run segment without secret values.
- do not start coturn in this segment.

Coturn commands after later config:

```bash
docker compose -f /opt/ax-connect-staging/coturn/docker-compose.yml config
docker compose -f /opt/ax-connect-staging/coturn/docker-compose.yml ps
docker logs ax-connect-staging-coturn --tail 100
docker inspect ax-connect-staging-coturn
```

Mediasoup mapping:
- `apps/api` owns MVP/staging mediasoup lifecycle.
- mediasoup remains process-local inside API/backend media runtime; this remains a production/multi-process blocker.
- `MEDIA_SFU_LISTEN_IP`: bind/listen address, candidate shape `0.0.0.0` or reviewed interface bind.
- `MEDIA_SFU_ANNOUNCED_ADDRESS`: staging reachable FQDN or public address held in private operator inventory.
- `MEDIA_SFU_RTC_MIN_PORT`: `40000`
- `MEDIA_SFU_RTC_MAX_PORT`: `40100`
- do not proxy mediasoup RTC through Nginx.

LiveKit rollback:
- keep `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL` present without values.
- rollback checks after staging deploy: `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`.
- missing LiveKit rollback remains a smoke blocker.

Smoke readiness gates before any staging smoke run:
- app/API health through localhost and Nginx
- auth/session path using staging cookies/env only
- LiveKit rollback query checks
- mediasoup health endpoint
- coturn credential/no-open-relay checks
- direct private/channel media smoke only in the later run-report segment
- TURN relay private/channel media smoke only in the later run-report segment
- cleanup health only in the later run-report segment

## Staging Env / Deploy Setup Run Report

Status: `partial pass / redacted report recorded`. The separate staging VPS now has the staging repo checkout, server-local env files, Docker Postgres, app/API build, PM2 web/API processes, Nginx staging site, and TLS for `staging.ax-connect.ru`. This section records only presence/status evidence and does not include real IPs, passwords, private keys, env values, database URLs, generated TURN secrets, cookies, auth headers, or LiveKit/Storage secrets.

Run report:
- `production-media-staging-env-setup-run-report` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md`.
- deployed source: `origin/core/reborn` at `1496b4dc071e1390ea07f2738c4ca32695d0c05b`.
- staging repo path: `/var/www/ax-connect-staging`.
- server-local env root: `/etc/ax-connect-staging`.
- config root: `/opt/ax-connect-staging`.
- PM2 processes are online:
  - `ax-connect-staging-web`
  - `ax-connect-staging-api`
- app/API health through HTTPS passed.
- Nginx staging site and TLS passed; certificate expiry observed: 2026-09-02.
- UFW includes `80/tcp` for certbot HTTP-01 renewal, `443/tcp`, SSH, coturn candidate ports, and mediasoup RTC candidate range.
- Docker Postgres is healthy and loopback-only on `127.0.0.1:5433`.
- coturn Docker compose config is prepared, and the TURN static-auth secret is present only in server-local env files.
- coturn container was not started.
- direct/TURN media smoke was not run.
- LiveKit fallback was preserved but rollback env presence is missing on staging.
- Stage 6/Postgres production migration remained untouched.

Run-report readiness classification:
- staging source checkout: `pass`
- staging DB container: `pass / healthy`
- staging DB schema/migrations: `blocked / not run`
- app/API build: `pass`
- PM2 web/API: `pass / online`
- Nginx/TLS: `pass`
- coturn config: `pass / prepared only`
- coturn process: `blocked / not started`
- LiveKit rollback availability: `blocked / env missing`
- Storage upload readiness: `blocked / env missing`
- mediasoup health: `blocked for smoke / authenticated check not run`
- staging smoke: `blocked until remaining gates are resolved`
- production rollout/default: `blocked`

Remaining blockers before staging smoke:
- fill staging-only LiveKit rollback env outside repo docs, or record an operator-approved blocker.
- fill or explicitly defer staging Storage env outside repo docs.
- decide and apply the staging PostgreSQL schema path without touching Stage 6 production migration.
- start coturn in an approved follow-up run and verify no-open-relay behavior without exposing credentials.
- run authenticated app/session and mediasoup health checks using staging-only cookies/secrets.
- run direct and TURN media smoke only in a later staging smoke run-report segment.

## Staging Pre-Smoke Readiness Run Report

Status: `partial pass / blocked before media smoke`. The separate staging VPS now has LiveKit rollback env presence, an explicit Storage deferral, staging Postgres schema applied to the separate Docker Postgres, restarted PM2 web/API processes, running Docker coturn, a passing minimal no-open-relay check, authenticated app/session evidence, and LiveKit token-path readiness. This section records only presence/status evidence and does not include real IPs, passwords, private keys, env values, database URLs, generated TURN credentials, cookies, auth headers, or LiveKit/Storage secrets.

Run report:
- `production-media-staging-pre-smoke-readiness-run-report` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_173_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RUN_REPORT.md`.
- LiveKit rollback env names are present in server-local web/API env files without values.
- Storage upload env remains missing, with an operator-approved server-local deferral for media-only pre-smoke readiness.
- `bun x prisma db push` applied the active schema to the separate staging Docker Postgres only; public table count is `10`.
- PM2 web/API were rebuilt/restarted after env/schema changes and remained online.
- HTTPS API health passed; HTTPS web returned the expected auth redirect.
- coturn is running from Docker with an explicitly mounted config, listener `3478/udp+tcp`, relay range `49160-49240`, and no bad config-format warning.
- minimal coturn allocation-auth checks passed: valid REST credentials allocated, no-auth and invalid credentials did not allocate, and credentials were not printed.
- authenticated app/session check passed through the API.
- authenticated mediasoup health returned HTTP `200`, but status is `disabled` because local mediasoup prototype is disabled in production runtime.
- LiveKit token path returned HTTP `200` for a staging-only query, with token presence confirmed without printing the token.
- direct/TURN media smoke was not run.
- production VPS, production DB, production SFU/TURN/default gates, LiveKit removal, and Stage 6/Postgres production migration remained untouched.

Pre-smoke readiness classification:
- staging LiveKit rollback env: `pass / present`
- storage gate: `deferred / accepted for media-only pre-smoke`
- staging DB schema: `pass / separate Docker Postgres`
- PM2 web/API: `pass / online after restart`
- Nginx/HTTPS health: `pass`
- coturn process: `pass / running`
- coturn no-open-relay: `pass / minimal allocation-auth check`
- authenticated app/session: `pass`
- authenticated mediasoup health: `reachable but not ready`
- LiveKit rollback token path: `pass`
- staging direct/TURN media smoke: `blocked / not run`
- production rollout/default: `blocked`

Remaining blockers before direct/TURN media smoke:
- mediasoup prototype is disabled in production runtime on staging; direct/TURN SFU smoke cannot proceed until a scoped staging-safe runtime decision or implementation enables mediasoup readiness without enabling production defaults.
- web rollback query routes returned auth redirects in curl context; browser/operator route behavior should be checked if route-level UI evidence is required by the next segment.
- Storage upload remains deferred; upload/storage smoke remains out of scope until separate staging storage env is filled or explicitly excluded.

## Staging Smoke Plan

Status: `planning / documented`. This is the ordered smoke plan for a future staging or non-production run. It does not run smoke, does not fill real values, does not change runtime code, does not change real env/secrets, does not add infrastructure configs, and does not enable production SFU/TURN/default behavior.

Readiness classification:
- staging smoke plan: `pass / documented`
- staging smoke run: `blocked until operator inputs and staging env exist`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

Human/operator callout:
- no manual user check is required for this planning segment.
- before any staging smoke run, an operator must confirm the required process/env inputs outside the repo without recording secret values here.
- do not run a staging smoke report if operator inputs, staging env, process owner, logs, firewall assumptions, rollback owner, or run window are missing.

Prerequisites gate:

| Gate item | Required before run? | Evidence to record without secrets |
| --- | --- | --- |
| Operator inputs filled | yes | checklist complete in private operator inventory, with no real values committed |
| Staging web/API origins | yes | origin presence, CORS owner, rebuild/deploy owner |
| `MEDIA_TURN_*` presence | yes for TURN phases | present/not present, owner, secret source/rotation owner, no values |
| `MEDIA_SFU_*` presence | yes | present/not present, owner, validation check, no real IP/FQDN if sensitive |
| Coturn process owner/log/status command | yes for TURN phases | systemd or Docker decision, log reference pattern, status command name |
| Mediasoup process owner/log/health command | yes | `apps/api` MVP or dedicated owner, health endpoint/check name |
| Firewall assumptions | yes | reviewed ranges for `3478/udp+tcp`, `49160-49240`, `40000-40100/udp`, and `443/tcp` |
| Rollback owner and LiveKit env presence | yes | rollback owner, LiveKit env presence, rollback query checks |
| Staging smoke run window | yes | operator, start/end window, expected user count |

Smoke phase order:

| Phase | Scope | Required evidence | Pass criteria | Block/fail trigger |
| --- | --- | --- | --- | --- |
| 0. Preflight | operator inputs, env presence, process owner, logs, rollback owner | completed prerequisite gate, commit SHA, run id, redacted env-name list | all required inputs are present or explicitly scoped out | missing required input, missing rollback owner, or need to expose secrets |
| 1. App/API health | staging web/API reachability and auth/session path | health endpoint or equivalent status, API/WSS origin check, CORS check | app/API reachable and authenticated smoke users can load media routes | app/API unavailable or CORS/auth prevents smoke |
| 2. Mediasoup health | worker/router readiness before joins | health snapshot with worker/router/status/counters and non-secret `MEDIA_SFU_*` status | worker/router ready or deterministic disabled status for scoped skip | worker/router unavailable for SFU phases |
| 3. Coturn credential/no-open-relay | credential issuance and relay abuse prevention | authenticated credential issuance, invalid/expired/unauth relay failures, coturn log refs | no open relay, valid credentials work, secret values never exposed | open relay behavior, leaked secret, or missing logs |
| 4. Direct private SFU | two-user private video path without TURN relay | selected mode, remote audio/video, counters, logs | private audio/video works and counters match users/tracks | remote media missing or resources leak |
| 5. Direct channel `AUDIO` | small channel audio path without TURN relay | selected mode, remote audio, producer/consumer counts | channel audio works and cleanup converges | no remote audio or stale resources |
| 6. Direct channel `VIDEO` | small channel video path without TURN relay | selected mode, remote audio/video, producer/consumer counts | channel video works and cleanup converges | no remote audio/video or stale resources |
| 7. Screen-share | private or channel video screen-share | latest-wins behavior, start/stop/takeover notes, counters | screen-share starts/stops, latest-wins remains true, cleanup converges | stale screen track or takeover failure |
| 8. TURN relay private/channel | relay-forced private and at least one channel path | relay-selected evidence, coturn allocation/permission/channel-bind logs, health counters | relay path works, allocations clean up, no open relay | relay allocation failure, cleanup failure, or unexpected direct-only behavior |
| 9. Lifecycle recovery | route away/back, Restart, Leave/rejoin, optional offline/restore | bounded attempt counts, status transitions, health snapshots | flows recover or produce explicit review/fail without loops | unbounded retry/wait, unrecoverable failed state, stale tracks |
| 10. Cleanup convergence | all rooms closed | before/during/after health snapshots and coturn allocation cleanup | active rooms/sessions/transports/producers/consumers settle to zero | active resources do not converge in bounded window |
| 11. LiveKit rollback query | explicit rollback controls | `?mediaProvider=livekit`, `?livekit=true`, `?sfu=false` route checks | LiveKit fallback/token path remains usable | rollback cannot be verified |
| 12. Failure/rollback decision | final classification | pass/review/fail/block per phase, rollback trigger assessment | decision is recorded with blockers and next action | production/canary decision requested without required evidence |

Direct and TURN smoke matrix:

| Scenario | Direct required | TURN required | Human/operator check | Notes |
| --- | --- | --- | --- | --- |
| Private SFU two-user audio/video | yes | yes when coturn staging exists | yes for media quality and device UX | Direct must run before relay to separate SFU issues from TURN issues. |
| Channel `AUDIO` two- or three-user | yes | review/yes if channel relay is in canary scope | yes for audio audibility | Channel audio proves persistent-room audio path. |
| Channel `VIDEO` two- or three-user | yes | yes for broader media readiness | yes for audio/video visibility | Include camera off/on if practical. |
| Screen-share start/stop or takeover | yes | review/yes if video relay is in canary scope | yes for shared content visibility | Latest-wins and stale-track cleanup must be checked. |
| Route away/back | yes | review | yes for expected remote track count | Fixed iteration count only. |
| Restart | yes | review | yes for status recovery | Bounded attempts only. |
| Leave/rejoin | yes | review | yes for track restoration | Check no stale remote tracks. |
| Offline/restore | review | review | yes if helper exists and staging allows it | Optional if not already available; otherwise classify as review. |
| LiveKit rollback | yes | yes after relay phases | yes | Must remain available regardless of SFU result. |

Evidence/output template:

```text
Run id:
Segment:
Commit SHA:
Environment:
Operator:
Run window:
Staging web origin present:
Staging API origin present:
MEDIA_TURN_* presence / owner / secret source recorded without values:
MEDIA_SFU_* presence / owner recorded without values:
Coturn process owner / status command / log reference:
Mediasoup process owner / health command / log reference:
Firewall assumptions reviewed:
Rollback owner:
LiveKit env presence verified without values:

Preflight classification:
App/API health classification:
Mediasoup health classification:
Coturn credential/no-open-relay classification:
Direct private SFU classification:
Direct channel AUDIO classification:
Direct channel VIDEO classification:
Screen-share classification:
TURN relay private/channel classification:
Lifecycle recovery classification:
Cleanup convergence classification:
LiveKit rollback classification:

Health snapshot before:
Health snapshot during:
Health snapshot after:
Coturn allocation/log summary:
Failure counters:
Human/operator notes:
Final decision:
Blockers:
Recommended next:
```

Failure and rollback decision rules:
- any open relay finding is `block` and stops the run.
- any leaked TURN secret, generated credential, API secret, auth header, cookie, or real secret value is `block` and requires redaction/rotation review.
- missing LiveKit rollback is `block`.
- mediasoup/coturn health unavailable is `block` for corresponding SFU/TURN phases.
- direct media pass with TURN fail is `review / TURN blocker`, not production readiness.
- direct fail with TURN pass is `review / SFU or route blocker`, not production readiness.
- cleanup non-convergence is `block` before canary.
- bounded lifecycle recovery fail is `review` or `fail` depending on user impact; unbounded retry behavior is `block`.
- production rollout/default must remain `blocked` after the staging smoke plan and after any first staging smoke run unless a later canary readiness segment explicitly decides otherwise.

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
   - verify restart/crash behavior is bounded and documented
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
- worker/router health is ready before SFU joins
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
- mediasoup worker crash/restart and router recreation logs
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
- mediasoup worker/router health unavailable or flapping

## Production Blockers

Production rollout remains blocked until all are resolved or explicitly accepted:
- mediasoup/signaling state is process-local
- no multi-process/shared-state design exists yet
- no production-like soak has passed
- no completed VPS firewall/process implementation exists
- no rollback drill has passed
- candidate production ranges are chosen but not implemented or load-proven
- coturn readiness criteria are documented, but production coturn is not deployed and systemd-vs-Docker ownership remains undecided
- mediasoup process criteria are documented, but production mediasoup process ownership, restart policy, logs, and implementation are not complete
- runtime env mapping exists, but concrete production values, owners, and secret rotation source are not filled
- process/env readiness matrix exists, but required operator inputs are not filled
- staging VPS bootstrap run report exists, and staging app/API/env/coturn setup plus pre-smoke readiness checks are partially complete with redacted evidence
- staging smoke plan exists, but staging smoke execution is blocked because mediasoup is disabled in production runtime on staging and no staging-safe SFU readiness path has been approved
- production monitoring/alerting is not implemented
- LiveKit fallback removal is not approved

## Next Segments

Recommended next:
- `production-media-staging-smoke-readiness-decision` to resolve the staging-safe mediasoup runtime enablement decision before direct/TURN media smoke

Acceptable alternative:
- `production-media-staging-smoke-run-report` only after the mediasoup runtime blocker is resolved or explicitly accepted with a narrower non-SFU smoke scope

Do not proceed next to:
- staging direct/TURN media smoke while mediasoup health remains `disabled` in staging production runtime
- production default switch
- LiveKit removal
- Stage 6 production Postgres cutover
- broad Docker/PM2/Nginx/firewall implementation without topology/env decisions
