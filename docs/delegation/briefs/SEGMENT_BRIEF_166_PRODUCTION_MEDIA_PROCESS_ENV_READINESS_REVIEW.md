# Segment Brief 166. Production Media Process/Env Readiness Review

Branch:
- `wave/stage9-production-media-process-env-readiness-review`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-media-process-env-readiness-review`

## Goal

Consolidate production media process and env readiness into one practical matrix before any staging or production smoke run.

This is a review/planning segment only. It does not change runtime code, does not change real env files or secrets, does not add Docker/PM2/systemd/Nginx/firewall config, does not run staging/production smoke, does not enable production SFU/TURN/default gates, does not remove LiveKit, and does not touch Stage 6/Postgres production migration.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_166_PRODUCTION_MEDIA_PROCESS_ENV_READINESS_REVIEW.md`

Updated:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Readiness Classification

- production process/env readiness review: `pass / documented`
- concrete production values: `blocked / not filled`
- staging smoke plan: `allowed next`
- staging smoke run: `blocked until required operator inputs are filled`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

## Matrix Captured

The runbook now links these prerequisites in one Process/Env Readiness Review matrix:
- media host public address / owner through `MEDIA_HOST_PUBLIC_ADDRESS`
- web/API public origins
- API internal URL / CORS relation
- `MEDIA_TURN_URLS`
- `MEDIA_TURN_STATIC_AUTH_SECRET` presence, owner, and rotation source without the value
- `MEDIA_TURN_TTL_SECONDS`
- `MEDIA_TURN_RELAY_MIN_PORT` / `MEDIA_TURN_RELAY_MAX_PORT`
- `MEDIA_SFU_LISTEN_IP`
- `MEDIA_SFU_ANNOUNCED_ADDRESS`
- `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT`
- coturn process owner: systemd vs Docker
- mediasoup process owner: `apps/api` MVP vs dedicated process
- app/media/coturn logs owner and path
- LiveKit rollback path and rollback operator
- firewall plan status
- monitoring/alerting status
- staging smoke prerequisites

## Required Operator Inputs Before Smoke Run

The staging smoke run remains blocked until an operator fills or confirms these outside the repo:
- media host public address presence and owner
- public web/API origins and CORS owner
- `MEDIA_TURN_*` presence, owner, and rotation metadata without values
- `MEDIA_SFU_*` presence, owner, and validation metadata without values
- coturn process owner, restart policy, status check, and log path
- mediasoup process owner, restart policy, health check, and log path
- firewall owner and reviewed candidate ranges
- LiveKit rollback env presence and rollback operator
- monitoring/log capture owner
- staging smoke operator and run window

## What Was Not Changed

- no runtime code changes
- no real `.env`, `.env.local`, `.env.production`, or secret file changes
- no Docker/PM2/systemd/Nginx/firewall config changes
- no staging or production smoke execution
- no production SFU/TURN/default gate enablement
- no production coturn or mediasoup deployment
- no LiveKit removal
- no Stage 6/Postgres production migration changes

## Remaining Blockers

- concrete production values, owners, and secret source are not filled
- process-local mediasoup/signaling state remains a production/multi-process blocker
- no multi-process/shared-state design exists yet
- no production-like soak has passed
- no completed VPS firewall/process implementation exists
- coturn process owner is still unresolved between systemd and Docker
- mediasoup process implementation/restart/log ownership is not complete
- candidate ranges are not implemented or load-proven
- no rollback drill has passed
- production monitoring/alerting is not implemented
- LiveKit removal remains blocked
- Stage 6 production Postgres migration remains deferred and separate

## Acceptance Criteria

- runbook contains a compact process/env readiness matrix with pass/review/block classifications.
- env inventory template contains missing non-secret operator checklist items for process owner, logs, firewall, monitoring, rollback, and staging smoke.
- wave/status docs mark Segment 166 done and point next to `production-media-staging-smoke-plan`.
- staging smoke execution remains blocked until required operator inputs are filled.
- no runtime/env/infra/production behavior changed.

## Verification

Run:

```powershell
git diff --check
rg -n "production-media-process-env-readiness-review|MEDIA_TURN|MEDIA_SFU|MEDIA_HOST_PUBLIC_ADDRESS|coturn|mediasoup|process owner|rollback|LiveKit|Postgres|staging smoke" docs/runbooks docs/waves docs/roadmap docs/delegation --glob "*.md"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

## Recommended Next Segment

Recommended next:
- `production-media-staging-smoke-plan`

Do not proceed next to:
- staging smoke run until required operator inputs exist
- production rollout/default switch
- LiveKit removal
- production firewall/runtime implementation without a scoped segment
- Stage 6 production DB cutover
