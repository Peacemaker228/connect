# Wave 34. Production Media Infrastructure Runbook Plan

## Goal

Create the first production media infrastructure/runbook planning track after the Stage 8 local Media MVP pass.

This wave prepares a future `mediasoup + coturn` rollout plan. It does not implement production SFU/TURN infrastructure and does not enable production media defaults.

## Position In The Main Plan

Mapping:
- `Wave 32 / MEDIA_STACK_TECHNOLOGY_DECISION` fixed the target stack as `mediasoup + coturn`.
- `Wave 33 / MEDIA_MVP_IMPLEMENTATION_PLAN` delivered the local/dev MVP track and closed Stage 8 as local pass / production blocked.
- `Wave 34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN` records the operator-facing production media rollout plan and blockers before implementation.

## Scope

Allowed:
- production media runbook documentation
- topology and process-ownership options
- port/firewall model planning
- TURN/STUN credential strategy
- production env inventory planning
- production-safe runtime config mapping for approved media env names
- deploy order, smoke checklist, rollback, monitoring, and blocker documentation
- roadmap/status updates

Forbidden:
- production SFU enablement
- coturn production deployment
- Docker/PM2/systemd/Nginx/firewall implementation changes
- runtime feature changes beyond scoped media config mapping
- real env/secret changes
- LiveKit removal
- Stage 6 production Postgres migration changes
- mixing media rollout with DB cutover

## Current Output

Done:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` exists as a self-contained planning runbook.
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md` records the segment handoff.
- `docs/roadmap/STAGE_STATUS.md` now lists `Wave 34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`.
- `production-media-topology-decision` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md`.
- initial topology is single VPS / single media host first for MVP/canary.
- candidate ranges are `40000-40100/udp` for mediasoup RTC and `49160-49240` for coturn relay, with coturn listener `3478/udp` and `3478/tcp`; `5349/tcp` and mediasoup TCP fallback are deferred.
- process direction is PM2-style continuity for `web`/`apps/api`, backend/media-owned mediasoup worker lifecycle for MVP, and separately managed coturn via systemd or Docker in a later implementation segment.
- `production-media-env-inventory-template` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`.
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md` now separates public build-time env, server-only API/media env, secret env, and LiveKit rollback env, and proposes production mapping candidates for current `LOCAL_*` prototype names.
- `production-media-runtime-config-mapping` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md`.
- `apps/api` now recognizes `MEDIA_TURN_*` and `MEDIA_SFU_*` runtime config names with `LOCAL_*` local/dev fallback compatibility.
- production SFU/TURN endpoints remain disabled by the existing production guards, and no real env/secret values were changed.
- `production-coturn-readiness-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md`.
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` now defines coturn readiness criteria covering no-open-relay policy, TURN REST auth through `MEDIA_TURN_STATIC_AUTH_SECRET`, listener/relay/public-address requirements, smoke/log/cleanup evidence, and rollback requirements.
- no production coturn deploy, production env/secret change, firewall change, runtime change, or production SFU/TURN/default enablement was made.
- `production-mediasoup-process-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md`.
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` now defines mediasoup process criteria covering backend/media-owned MVP process direction, PM2 vs dedicated process vs systemd/Docker criteria, worker/router lifecycle, restart/crash behavior, health/readiness signals, `MEDIA_SFU_*` env mapping, smoke/readiness checks, and the single-process boundary.
- no production mediasoup deploy, production env/secret change, PM2/systemd/Docker/Nginx/firewall config, runtime change, or production SFU/default enablement was made.

## Expected Future Implementation Segments

Recommended sequence:
1. `production-media-process-env-readiness-review`
   - review filled production media env/process ownership prerequisites without applying them
2. `production-media-staging-smoke-plan`
   - define staging/non-production smoke order before implementation
3. `production-media-staging-smoke-run-report`
   - run direct and relay smoke in staging/non-production
4. `production-media-canary-readiness-decision`
   - decide whether a narrow production canary is allowed
5. `production-media-rollback-drill-report`
   - prove LiveKit rollback/default switch before broader rollout

## Acceptance Criteria

- runbook is usable without chat history
- Stage 8 remains local complete / production blocked
- Stage 9 / production media track is planning-started only
- LiveKit fallback remains preserved
- Stage 6 production Postgres migration remains deferred and separate
- no production SFU/TURN enablement, production env, real secrets, or deploy/firewall implementation changed

## References

- [PRODUCTION_MEDIA_INFRA_RUNBOOK.md](../runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md)
- [MEDIA_MVP_IMPLEMENTATION_PLAN.md](./MEDIA_MVP_IMPLEMENTATION_PLAN.md)
- [MEDIA_STACK_TECHNOLOGY_DECISION.md](./MEDIA_STACK_TECHNOLOGY_DECISION.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md)
- [SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md](../delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md)
- [SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md](../delegation/briefs/SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md)
- [SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md](../delegation/briefs/SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md)
- [SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md)
- [SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md)
