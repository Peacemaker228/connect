# Segment Brief 162: Production Media Env Inventory Template

## Branch / Target

- Branch: `wave/stage9-production-media-env-inventory-template`
- Base/target: `core/reborn`
- Wave: `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`
- Segment: `production-media-env-inventory-template`

## Goal

Create an operator-facing production media env inventory template for a future `mediasoup + coturn` rollout, without real secrets, runtime changes, production defaults, or deploy implementation.

## Required Reading

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `infra/coturn/local-turn.env.example`
- `infra/coturn/README.md`
- `infra/sfu/README.md`

## Scope

Allowed:
- docs-only env inventory template
- production env grouping and mapping candidates
- separation of public build-time env, server-only env, secret env, and rollback env
- documentation that current `LOCAL_*` names are local/prototype-only
- runbook, wave, and status updates

Forbidden:
- runtime code changes
- `.env`, `.env.local`, `.env.production`, or real secret file changes
- real IP, domain, token, or secret values
- production SFU/default enablement
- LiveKit removal
- Docker, PM2, systemd, Nginx, or firewall implementation
- Stage 6 production Postgres migration/cutover changes

## Files Changed

- Added `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- Added `docs/delegation/briefs/SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- Updated `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- Updated `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- Updated `docs/roadmap/STAGE_STATUS.md`

`docs/roadmap/PLATFORM_MIGRATION_PLAN.md` was read but not changed because the roadmap direction did not change.

## Env Groups Captured

- Public build-time env:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_LIVEKIT_URL`
  - current `NEXT_PUBLIC_MEDIA_*` SFU candidate/pilot gates
  - future production SFU default switch placeholder, explicitly deferred
- Server-only API/media env:
  - `API_INTERNAL_URL`
  - `API_CORS_ALLOWED_ORIGINS`
  - media host public address
  - mediasoup listen/announced address
  - mediasoup RTC candidate range `40000-40100/udp`
  - coturn URLs
  - coturn listener candidate `3478/udp+tcp`
  - coturn relay candidate range `49160-49240`
  - TURN TTL
- Secret env:
  - TURN static auth secret or equivalent
  - LiveKit API key/secret for rollback
  - future media signing/session secret placeholder if later required
- Rollback env:
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `NEXT_PUBLIC_LIVEKIT_URL`

## Proposed Production Naming / Mapping

Current local/prototype names remain local-only and are not automatically production-approved.

Recommended mapping candidates:

| Current local/prototype name | Proposed production name |
| --- | --- |
| `LOCAL_TURN_URLS` | `MEDIA_TURN_URLS` |
| `LOCAL_TURN_STATIC_AUTH_SECRET` | `MEDIA_TURN_STATIC_AUTH_SECRET` |
| `LOCAL_TURN_TTL_SECONDS` | `MEDIA_TURN_TTL_SECONDS` |
| `LOCAL_MEDIASOUP_LISTEN_IP` | `MEDIA_SFU_LISTEN_IP` |
| `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | `MEDIA_SFU_ANNOUNCED_ADDRESS` |
| `LOCAL_TURN_RELAY_MIN_PORT` | `MEDIA_TURN_RELAY_MIN_PORT` |
| `LOCAL_TURN_RELAY_MAX_PORT` | `MEDIA_TURN_RELAY_MAX_PORT` |
| local coturn external IP concept | `MEDIA_HOST_PUBLIC_ADDRESS` |
| n/a | `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT` |
| n/a | `MEDIA_TURN_LISTENER_PORT` |

Keeping `LOCAL_*` names in production would require an explicit approval segment.

No code was changed to read these proposed production names.

## Decisions Captured

- `NEXT_PUBLIC_*` values are public browser-visible build-time values and must not contain secrets.
- Production env/secret ownership must be recorded without values in repo docs.
- LiveKit rollback env remains required until a later rollback-removal segment.
- Candidate ranges remain:
  - mediasoup RTC: `40000-40100/udp`
  - coturn listener: `3478/udp+tcp`
  - coturn relay: `49160-49240`
- coturn `5349/tcp` and mediasoup TCP fallback remain deferred.
- The env inventory template is not approval to enable production SFU/default.

## Remaining Blockers

- production-approved env names are not implemented in runtime code
- concrete production values, owners, and secret source are not filled
- process-local mediasoup/signaling state remains a production/multi-process blocker
- no multi-process/shared-state design exists yet
- no production-like soak has passed
- no completed VPS firewall/process implementation plan exists
- coturn systemd-vs-Docker ownership remains undecided
- candidate ranges are not implemented or load-proven
- no rollback drill has passed
- production monitoring/alerting is not implemented
- LiveKit removal remains blocked
- Stage 6 production Postgres migration remains deferred and separate

## What Was Not Changed

- No runtime code changed.
- No `.env`, `.env.local`, `.env.production`, or secret files changed.
- No real IPs, domains, tokens, or secret values were added.
- No production SFU/default was enabled.
- LiveKit was not removed.
- No Docker/PM2/systemd/Nginx/firewall implementation was added.
- Stage 6 production Postgres migration/cutover was not changed.

## Verification

Run:

```powershell
git diff --check
rg -n "MEDIA_|LOCAL_TURN|LOCAL_MEDIASOUP|NEXT_PUBLIC_|LIVEKIT|TURN|coturn|mediasoup|secret|rollback|Stage 6|Postgres" docs/runbooks docs/waves docs/roadmap docs/delegation infra --glob "*.md" --glob "*.example"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

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
