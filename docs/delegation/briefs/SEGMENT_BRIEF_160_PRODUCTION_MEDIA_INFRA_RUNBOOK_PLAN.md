# Segment Brief 160. Production Media Infrastructure Runbook Plan

Branch:
- `wave/stage9-production-media-infra-runbook-plan`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-media-infra-runbook-plan`

## Goal

Create a production media infrastructure/runbook plan for a future `mediasoup + coturn` rollout after the Stage 8 local Media MVP pass.

This is a planning/runbook segment only. It does not include production SFU rollout.

## Required Reading

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_157_STAGE8_MEDIA_MVP_LOCAL_COMPLETION_REVIEW.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_159_SFU_CALL_UI_PRODUCT_POLISH.md`
- `infra/coturn/README.md`
- `infra/sfu/README.md`
- `docs/runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md`

## Scope

Allowed:
- add production media runbook plan
- add wave plan
- add handoff brief
- update Stage Status with Wave 34 and planning-started status
- minimal Platform Migration Plan update if needed

Forbidden:
- production SFU enablement
- LiveKit removal
- runtime code changes
- real env/secret changes
- Docker/PM2/systemd/Nginx/firewall implementation changes
- Stage 6 production Postgres migration changes
- mixing media rollout with DB cutover

## Files Changed

Added:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`

Updated:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`

## Decisions Captured

- Stage 8 remains `local complete / production blocked`.
- Stage 9 / production media track is planning-started only.
- Target production topology separates HTTPS/WSS app signaling, mediasoup RTC traffic, and coturn STUN/TURN relay traffic.
- Nginx/reverse proxy owns HTTPS/WSS only; mediasoup RTC and coturn relay traffic must not be proxied through Nginx.
- PM2, systemd, and Docker remain options; no final process manager decision is made in this segment.
- TURN must not be an open relay.
- TURN credentials must be short-lived and issued server-side, with secrets kept server-side only.
- Production env inventory must include media gates, TURN URLs/auth secret or equivalent, mediasoup listen/announced IP, API/CORS URLs, and LiveKit fallback env.
- LiveKit fallback and token path must remain available until a later rollback/removal decision.
- Stage 6 production Postgres migration remains deferred and separate.

## Remaining Blockers

- process-local mediasoup/signaling state
- no multi-process/shared-state design yet
- no production-like soak
- no completed VPS firewall/process plan
- no rollback drill
- exact mediasoup RTC range undecided
- exact coturn listener/relay range undecided
- exact production env names and secret ownership undecided
- production monitoring/alerting not implemented
- LiveKit removal remains blocked

## Acceptance Criteria

- `PRODUCTION_MEDIA_INFRA_RUNBOOK.md` covers current status, target topology, process ownership options, ports/firewall model, TURN/STUN strategy, env inventory, deploy order, smoke checklist, rollback, monitoring, and blockers.
- `PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md` describes wave scope, forbidden items, and future implementation segments.
- `STAGE_STATUS.md` lists Wave 34 and keeps Stage 8 local complete / production blocked.
- Platform roadmap notes the production media infra/runbook planning track without broadly rewriting the roadmap.
- No runtime code, production env, real secrets, LiveKit removal, Stage 6 migration, or deploy/firewall implementation changes are included.

## Verification

Run:
- `git diff --check`
- `rg -n "production media|mediasoup|coturn|TURN|LiveKit|rollback|Stage 6|Postgres" docs/runbooks docs/waves docs/roadmap infra --glob "*.md"`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`

## Recommended Next Segment

Recommended:
- `production-media-topology-decision`

Acceptable alternative:
- `production-media-env-inventory-template`

Do not proceed next to production default switch, LiveKit removal, or Stage 6 production Postgres cutover.
