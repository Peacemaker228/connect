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
- runtime code changes
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

The current `LOCAL_*` names are prototype/local-only names. They are not automatically production-approved.

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

Recommended naming direction for future implementation review:

| Production candidate | Maps from | Public? | Secret? | Notes |
| --- | --- | --- | --- | --- |
| `MEDIA_TURN_URLS` | `LOCAL_TURN_URLS` | no | no | Server-side configured TURN URL list. Browser may receive URLs only through approved non-secret credential response/config path. |
| `MEDIA_TURN_STATIC_AUTH_SECRET` | `LOCAL_TURN_STATIC_AUTH_SECRET` | no | yes | Server-side only. |
| `MEDIA_TURN_TTL_SECONDS` | `LOCAL_TURN_TTL_SECONDS` | no | no | Short-lived credential TTL. |
| `MEDIA_TURN_LISTENER_PORT` | n/a | no | no | Candidate `3478`; implementation may instead use coturn config file source. |
| `MEDIA_TURN_RELAY_MIN_PORT` | `LOCAL_TURN_RELAY_MIN_PORT` | no | no | Candidate `49160`. |
| `MEDIA_TURN_RELAY_MAX_PORT` | `LOCAL_TURN_RELAY_MAX_PORT` | no | no | Candidate `49240`. |
| `MEDIA_HOST_PUBLIC_ADDRESS` | `LOCAL_TURN_EXTERNAL_IP` conceptually | no | no | Public reachable IP/FQDN placeholder; do not commit real values. |
| `MEDIA_SFU_LISTEN_IP` | `LOCAL_MEDIASOUP_LISTEN_IP` | no | no | Backend/media process env. |
| `MEDIA_SFU_ANNOUNCED_ADDRESS` | `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | no | no | Public reachable address for ICE candidates. |
| `MEDIA_SFU_RTC_MIN_PORT` | n/a | no | no | Candidate `40000`. |
| `MEDIA_SFU_RTC_MAX_PORT` | n/a | no | no | Candidate `40100`. |

Alternative:
- Keeping current `LOCAL_*` names in production would require an explicit approval segment and clear documentation explaining why local/prototype naming is acceptable in production.

No code changes are made by this template segment.

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

## Pre-Canary Completeness Checklist

Before a production canary readiness decision:
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
- [ ] Validation checks are defined for direct path, relay path, private call, channel AUDIO, channel VIDEO, screen share, leave/rejoin, route-away, and cleanup health.
- [ ] Stage 6 production Postgres migration remains out of scope.

## Redaction Rules For Handoffs / Logs / Screenshots

Redact:
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
- production-approved env names are not implemented in runtime code
- concrete production values, owners, and secret source are not filled
- process-local mediasoup/signaling state remains a multi-process/multi-node blocker
- no production-like soak has passed
- no completed VPS firewall/process implementation plan exists
- coturn systemd-vs-Docker ownership remains undecided
- candidate port ranges are not implemented or load-proven
- no rollback drill has passed
- production monitoring/alerting is not implemented
- LiveKit fallback removal is not approved
- Stage 6 production Postgres migration remains deferred and separate

## Recommended Next Segment

Recommended next:
- `production-coturn-readiness-plan`

Acceptable alternative:
- `production-media-runtime-config-mapping-plan`

Do not proceed next to:
- production default switch
- LiveKit removal
- firewall implementation
- Stage 6 production DB cutover
