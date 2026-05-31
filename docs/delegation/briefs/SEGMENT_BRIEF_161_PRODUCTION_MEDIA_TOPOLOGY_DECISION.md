# Segment Brief 161. Production Media Topology Decision

Branch:
- `wave/stage9-production-media-topology-decision`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-media-topology-decision`

## Goal

Decide the initial production media topology for a future `mediasoup + coturn` rollout without performing production rollout.

This is docs-only. It does not change runtime code, production defaults, real env files, deploy configs, firewall rules, or Stage 6 production Postgres migration/cutover.

## Required Reading

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `infra/coturn/README.md`
- `infra/sfu/README.md`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md`

Updated:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

Not updated:
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md` because the existing Wave 34 planning note is still accurate and no broad roadmap direction changed.

## Topology Decision Summary

Chosen initial topology:
- single VPS / single media host first for production MVP/canary, unless an operator later identifies a hard blocker.
- `web` and `apps/api` stay in the current app deploy contour.
- `apps/api` owns media control-plane and signaling.
- mediasoup worker lifecycle is owned by the backend/media process for the MVP.
- coturn runs separately as a managed service/container/process.
- Nginx owns HTTPS/WSS only.
- mediasoup RTC and coturn relay traffic go direct to the media host, not through Nginx.

Rejected/deferred alternatives:
- split media host is deferred until capacity, network, or isolation evidence requires it.
- full Docker migration is deferred because it would widen scope beyond media topology.
- distributed SFU cluster is rejected for first rollout because state is process-local and shared-state design does not exist yet.
- proxying media through Nginx is rejected.

## Process Ownership Direction

Recommended MVP direction:
- keep `web` and `apps/api` compatible with current PM2-style deploy for first VPS rollout.
- keep mediasoup lifecycle inside backend/media process for MVP.
- run coturn separately through either systemd or Docker; final implementation choice remains later.
- do not introduce full Docker migration yet unless explicitly approved.

Tradeoffs captured:
- PM2 gives continuity for current app/API deploy but is not the preferred sole owner for coturn.
- systemd fits coturn service ownership and restart/log policy but needs a later unit design.
- Docker fits repeatable coturn packaging and port exposure review but should not become a broad app migration in this segment.

## Candidate Port And Range Summary

Chosen candidate model:
- `443/tcp`: HTTPS/WSS through Nginx.
- `3478/udp` and `3478/tcp`: coturn listener.
- `5349/tcp`: coturn TLS listener deferred unless restrictive-network evidence requires it.
- `49160-49240`: coturn relay candidate range for first canary.
- `40000-40100/udp`: mediasoup RTC candidate range.
- mediasoup TCP fallback: explicit review/defer unless needed.

Rules:
- no overlap between mediasoup RTC range and coturn relay range.
- no broad ephemeral range exposure for first canary.
- ranges are candidates only; no firewall or deploy config is applied in this segment.

## Public Address / Announced IP Decision

Production must record:
- public reachable IP or FQDN for the media host.
- mediasoup announced address matching the client-reachable media host address.
- coturn `external-ip` or equivalent matching the reachable VPS/media host address.

Future split-host topology must revisit:
- announced IP and external IP values.
- firewall rules.
- DNS/FQDN assumptions.
- API/CORS origins where hostnames change.

## State And Scaling Boundary

Current blocker:
- mediasoup/signaling state is process-local.

Decision:
- initial topology is single-process/single-host MVP/canary only.
- multi-process or multi-node rollout requires later shared-state/session design.
- no production readiness claim is made by this topology decision.
- a narrow canary can only proceed if this blocker is explicitly accepted with LiveKit rollback available.

## Rollback Boundary

Rollback requirements:
- LiveKit fallback remains required.
- no LiveKit removal.
- production canary/default gates must be reversible.
- `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false` remain rollback controls.
- rollback drill remains required before broader rollout.

## Remaining Undecided

- production env variable names and secret ownership.
- coturn systemd vs Docker implementation.
- exact Nginx/API/WSS hostnames for production media canary.
- exact firewall implementation commands.
- coturn TLS listener need.
- mediasoup TCP fallback need.
- monitoring/alerting implementation.
- multi-process/shared-state/session design.

## Blockers Before Implementation

- production env inventory not complete.
- real public IP/FQDN ownership not recorded.
- TURN secret rotation/ownership not recorded.
- coturn process owner not finalized.
- firewall plan not implemented or reviewed.
- no production-like soak.
- no rollback drill.
- process-local state remains a production/multi-process blocker.
- Stage 6 production Postgres remains deferred and separate.

## Acceptance Criteria

- runbook records the chosen initial topology, process direction, candidate port/range model, public address requirements, state/scaling boundary, and rollback boundary.
- wave/status docs record Segment 161 as a completed docs-only topology decision.
- no runtime code, production default, real env, LiveKit removal, production commands, deploy configs, firewall configs, or Stage 6 Postgres changes are included.

## Verification

Run:
- `git diff --check`
- `rg -n "single-host|single VPS|mediasoup|coturn|TURN|Nginx|PM2|systemd|Docker|3478|49160|40000|LiveKit|Stage 6|Postgres" docs/runbooks docs/waves docs/roadmap docs/delegation --glob "*.md"`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`

## Recommended Next Segment

Recommended:
- `production-media-env-inventory-template`

Do not proceed next to production default switch, LiveKit removal, production commands, deploy/firewall implementation, or Stage 6 production Postgres cutover.
