# Segment Brief 164. Production Coturn Readiness Plan

Branch:
- `wave/stage9-production-coturn-readiness-plan`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-coturn-readiness-plan`

## Goal

Define the production coturn readiness plan for a future production TURN rollout.

This is a planning/readiness segment only. It does not deploy coturn, does not change production env/secrets, does not change Docker/PM2/systemd/Nginx/firewall config, does not enable production SFU/TURN/default gates, does not remove LiveKit, and does not touch Stage 6/Postgres production migration.

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
- `infra/coturn/README.md`
- `infra/coturn/docker-compose.local.yml`
- `infra/coturn/local-turn.env.example`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md`

Updated:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Readiness Classification

- production coturn readiness plan: `pass / documented`
- production coturn implementation: `blocked`
- production TURN availability: `blocked`
- production media default: `blocked`
- LiveKit fallback: `required / preserved`

## Readiness Plan Captured

The runbook now defines:
- no-open-relay policy
- authenticated TURN REST model through `MEDIA_TURN_STATIC_AUTH_SECRET`
- short-lived credential requirement through `MEDIA_TURN_TTL_SECONDS`
- listener requirement: `3478/udp` and `3478/tcp`
- relay candidate range: `49160-49240`
- external/public IP requirement aligned with `MEDIA_HOST_PUBLIC_ADDRESS`
- explicit production realm requirement
- coturn log capture requirements
- credential/secret ownership and rotation requirements
- systemd vs Docker decision criteria
- no public admin/CLI exposure requirement
- direct-vs-relay evidence requirements
- LiveKit rollback verification requirement

## Smoke Plan Captured

Future implementation/readiness runs must prove:
- backend credential issuance works for authenticated app users without exposing secrets
- unauthenticated relay allocation fails
- invalid credentials fail
- expired credentials fail
- authenticated allocation succeeds through the approved listener/range
- `CREATE_PERMISSION` succeeds only after authenticated allocation
- `CHANNEL_BIND` or equivalent relay data flow works for the selected smoke path
- allocations clean up after client close/TTL
- direct vs relay mode is observable
- coturn logs are captured and redacted
- LiveKit rollback works through `?mediaProvider=livekit`, `?livekit=true`, or `?sfu=false`

## What Was Not Changed

- no production coturn deploy
- no production env or secret file changes
- no Docker/PM2/systemd/Nginx/firewall config changes
- no runtime code changes
- no production SFU/TURN/default gate enablement
- no LiveKit removal
- no Stage 6/Postgres production migration changes

## Remaining Blockers

- production coturn is not deployed
- coturn systemd-vs-Docker implementation is not decided
- production values, owners, and secret source are not filled
- TURN secret rotation drill is not defined
- no production firewall/process implementation exists
- no production-like TURN/SFU soak has passed
- no rollback drill has passed
- process-local mediasoup/signaling state remains a production/multi-process blocker
- production monitoring/alerting is not implemented
- LiveKit removal remains blocked
- Stage 6 production Postgres migration remains deferred and separate

## Acceptance Criteria

- production coturn readiness checklist is documented in the runbook.
- no-open-relay requirements are explicit.
- TURN REST auth through `MEDIA_TURN_STATIC_AUTH_SECRET` is documented.
- required listener, relay range, external IP, realm, logs, and smoke evidence are documented.
- systemd vs Docker decision criteria are documented without adding production unit/compose files.
- wave/status docs mark Segment 164 done and point next to `production-mediasoup-process-plan`.
- no deploy/runtime/env/firewall/LiveKit/Postgres production changes are included.

## Verification

Run:

```powershell
git diff --check
rg -n "production-coturn-readiness-plan|coturn|TURN|MEDIA_TURN|LOCAL_TURN|3478|49160|49240|open relay|LiveKit|Postgres" docs/runbooks docs/waves docs/roadmap docs/delegation infra --glob "*.md" --glob "*.yml" --glob "*.example"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

## Recommended Next Segment

Recommended next:
- `production-mediasoup-process-plan`

Do not proceed next to production rollout, LiveKit removal, production firewall implementation, or Stage 6 production DB cutover.
