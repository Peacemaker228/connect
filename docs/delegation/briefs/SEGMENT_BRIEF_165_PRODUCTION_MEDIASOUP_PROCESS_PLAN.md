# Segment Brief 165. Production Mediasoup Process Plan

Branch:
- `wave/stage9-production-mediasoup-process-plan`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-mediasoup-process-plan`

## Goal

Define the production mediasoup process plan for a future production SFU rollout on a single VPS MVP/canary.

This is a planning/readiness segment only. It does not change runtime code, does not add PM2/systemd/Docker/Nginx/firewall config, does not deploy mediasoup or coturn, does not change production env/secrets, does not enable production SFU/default gates, does not remove LiveKit, and does not touch Stage 6/Postgres production migration.

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
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `apps/api/src/modules/media/media-runtime-config.service.ts`
- `apps/api/src/modules/media/media.module.ts`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md`

Updated:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Readiness Classification

- production mediasoup process plan: `pass / documented`
- production mediasoup implementation: `blocked`
- production SFU availability: `blocked`
- production media default: `blocked`
- multi-process readiness: `blocked`
- LiveKit fallback: `required / preserved`

## Process Plan Captured

The runbook now defines:
- backend/media-owned mediasoup lifecycle direction for the first single VPS MVP/canary
- single-process/single-host boundary
- process-local state blocker before multi-process or multi-node rollout
- PM2-style existing `apps/api` process vs dedicated media process vs systemd vs Docker decision criteria
- worker/router lifecycle expectations
- restart/crash behavior and bounded restart requirement
- health/readiness signal requirements
- log capture requirements
- `MEDIA_SFU_*` env/process mapping
- smoke/readiness plan for worker start, transport create/connect, produce/consume, cleanup, restart behavior, direct/relay evidence, and LiveKit rollback

## Required Env Mapping

Production mediasoup readiness depends on:
- `MEDIA_SFU_LISTEN_IP`
- `MEDIA_SFU_ANNOUNCED_ADDRESS`
- `MEDIA_SFU_RTC_MIN_PORT`
- `MEDIA_SFU_RTC_MAX_PORT`

The planned candidate RTC range remains `40000-40100/udp`, with no overlap with coturn relay `49160-49240`. Real IPs/FQDNs and real env files remain outside the repo.

## Smoke Plan Captured

Future implementation/readiness runs must prove:
- worker/router startup is observable
- health reports worker pid, router id, codec count, version, active resource counts, failure counters, cleanup summary, and non-secret runtime config
- send/receive WebRTC transports can be created with intended `MEDIA_SFU_*` config
- invalid/reversed RTC range fails with a non-secret reason
- microphone/camera produce/consume works for canary scope
- screen-share is covered if canary scope includes video/screen-share
- leave/rejoin, route away/back, and browser close converge active resources to zero
- process restart/crash behavior is bounded and documented
- direct-vs-relay evidence is captured after coturn readiness exists
- LiveKit rollback works through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`

## What Was Not Changed

- no runtime code changes
- no production mediasoup deploy
- no production env or secret file changes
- no PM2/systemd/Docker/Nginx/firewall config changes
- no production SFU/default gate enablement
- no coturn deploy
- no LiveKit removal
- no Stage 6/Postgres production migration changes

## Remaining Blockers

- production mediasoup is not deployed
- production process owner/restart policy/log source are not implemented
- production `MEDIA_SFU_*` values, owners, and source of truth are not filled
- process-local mediasoup/signaling state remains a production/multi-process blocker
- no shared-state/session ownership design exists
- no production-like SFU/TURN soak has passed
- no rollback drill has passed
- production coturn remains not deployed
- production monitoring/alerting is not implemented
- LiveKit removal remains blocked
- Stage 6 production Postgres migration remains deferred and separate

## Acceptance Criteria

- mediasoup process ownership plan is documented.
- worker/router lifecycle, restart/crash behavior, health/readiness signals, logs, and env mapping are documented.
- process-local state blocker and single-process/single-host boundary are explicit.
- wave/status docs mark Segment 165 done.
- no deploy/runtime/env/firewall/LiveKit/Postgres production changes are included.

## Verification

Run:

```powershell
git diff --check
rg -n "production-mediasoup-process-plan|mediasoup|MEDIA_SFU|process-local|worker|router|transport|restart|LiveKit|Postgres" docs/runbooks docs/waves docs/roadmap docs/delegation apps/api/src/modules/media --glob "*.md" --glob "*.ts"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

## Recommended Next Segment

Recommended next:
- `production-media-process-env-readiness-review`

Acceptable alternative:
- `production-media-staging-smoke-plan`

Do not proceed next to production rollout, LiveKit removal, production firewall implementation, runtime implementation, or Stage 6 production DB cutover.
