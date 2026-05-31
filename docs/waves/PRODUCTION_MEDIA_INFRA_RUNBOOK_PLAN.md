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
- deploy order, smoke checklist, rollback, monitoring, and blocker documentation
- roadmap/status updates

Forbidden:
- production SFU enablement
- coturn production deployment
- Docker/PM2/systemd/Nginx/firewall implementation changes
- runtime code changes
- real env/secret changes
- LiveKit removal
- Stage 6 production Postgres migration changes
- mixing media rollout with DB cutover

## Current Output

Done:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` exists as a self-contained planning runbook.
- `docs/delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md` records the segment handoff.
- `docs/roadmap/STAGE_STATUS.md` now lists `Wave 34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`.

## Expected Future Implementation Segments

Recommended sequence:
1. `production-media-topology-decision`
   - decide single-host vs split media host
   - decide PM2 vs systemd vs Docker ownership
   - decide bounded mediasoup RTC and coturn relay/listener ranges
2. `production-media-env-inventory-template`
   - map local prototype env names to production-approved names
   - record secret ownership without values
   - keep LiveKit fallback env until rollback removal is approved
3. `production-coturn-readiness-plan`
   - define authenticated TURN config, no-open-relay checks, logs, and allocation smoke
4. `production-mediasoup-process-plan`
   - define mediasoup worker/process lifecycle, health, restart policy, and logs
5. `production-media-staging-smoke-run-report`
   - run direct and relay smoke in staging/non-production
6. `production-media-canary-readiness-decision`
   - decide whether a narrow production canary is allowed
7. `production-media-rollback-drill-report`
   - prove LiveKit rollback/default switch before broader rollout

## Acceptance Criteria

- runbook is usable without chat history
- Stage 8 remains local complete / production blocked
- Stage 9 / production media track is planning-started only
- LiveKit fallback remains preserved
- Stage 6 production Postgres migration remains deferred and separate
- no runtime code, production env, real secrets, or deploy/firewall implementation changed

## References

- [PRODUCTION_MEDIA_INFRA_RUNBOOK.md](../runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md)
- [MEDIA_MVP_IMPLEMENTATION_PLAN.md](./MEDIA_MVP_IMPLEMENTATION_PLAN.md)
- [MEDIA_STACK_TECHNOLOGY_DECISION.md](./MEDIA_STACK_TECHNOLOGY_DECISION.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md)
