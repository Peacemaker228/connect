# Segment Brief 167. Production Media Staging Smoke Plan

Branch:
- `wave/stage9-production-media-staging-smoke-plan`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-media-staging-smoke-plan`

## Goal

Document the exact staging/non-production media smoke order for a future run.

This is the final pure planning segment before either operator-input fill or an actual staging smoke run/report. It does not run smoke, does not change runtime code, does not change real env files or secrets, does not add Docker/PM2/systemd/Nginx/firewall config, does not enable production SFU/TURN/default gates, does not remove LiveKit, and does not touch Stage 6/Postgres production migration.

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
- `docs/delegation/briefs/SEGMENT_BRIEF_166_PRODUCTION_MEDIA_PROCESS_ENV_READINESS_REVIEW.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_167_PRODUCTION_MEDIA_STAGING_SMOKE_PLAN.md`

Updated:
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Classification

- staging smoke plan: `pass / documented`
- staging smoke run: `blocked until operator inputs and staging env exist`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

## Staging Smoke Phases

The runbook now documents this phase order:
1. Preflight: operator inputs filled, env presence only, process owner, logs, rollback owner.
2. App/API health.
3. Mediasoup health.
4. Coturn credential issuance and no-open-relay smoke.
5. Direct private SFU smoke.
6. Direct channel `AUDIO` smoke.
7. Direct channel `VIDEO` smoke.
8. Screen-share smoke.
9. TURN relay private/channel smoke.
10. Route away/back, Restart, Leave/rejoin, and offline/restore where available.
11. Cleanup convergence.
12. LiveKit rollback query.
13. Failure/rollback decision.

## Operator Inputs Required Before Execution

No manual user check is required in this planning segment.

Before any staging smoke run/report, an operator must fill or confirm outside the repo:
- media host public address / owner
- staging web/API origins
- `MEDIA_TURN_*` presence, owner, and secret source without values
- `MEDIA_SFU_*` presence and owner
- coturn process owner, log path, and status command
- mediasoup process owner, log path, and health command
- firewall assumptions
- rollback owner and LiveKit env presence
- staging smoke run window

Without these inputs, do not run `production-media-staging-smoke-run-report`.

## Direct And TURN Matrix

The runbook now separates:
- direct private SFU
- direct channel `AUDIO`
- direct channel `VIDEO`
- direct screen-share
- TURN relay private
- TURN relay channel `AUDIO` or `VIDEO` where canary scope requires it
- TURN screen-share where video relay is in scope
- lifecycle recovery checks
- LiveKit rollback checks

Direct path must run before relay path so SFU/app issues are not confused with TURN issues.

## Evidence Template

The runbook and env inventory template now define output fields for a future run report:
- run id
- commit SHA
- staging origins presence
- `MEDIA_TURN_*` and `MEDIA_SFU_*` presence/owner metadata without values
- coturn process/log/status evidence
- mediasoup process/health/log evidence
- firewall assumption review
- phase classifications
- before/during/after health snapshots
- coturn allocation/log summary
- failure counters
- human/operator notes
- final decision and recommended next

## What Was Not Changed

- no staging or production smoke was run
- no runtime code changed
- no real env or secret file changed
- no Docker/PM2/systemd/Nginx/firewall config changed
- no production SFU/TURN/default gate was enabled
- no production coturn or mediasoup deployment was performed
- no LiveKit removal
- no Stage 6/Postgres production migration changes

## Remaining Blockers

- operator inputs are not filled
- staging env existence is not confirmed
- process-local mediasoup/signaling state remains a production/multi-process blocker
- no production-like soak has passed
- no completed VPS firewall/process implementation exists
- coturn process owner remains unresolved unless an operator fills it
- mediasoup process implementation/restart/log ownership is not complete
- candidate ranges are not implemented or load-proven
- no rollback drill has passed
- production monitoring/alerting is not implemented
- LiveKit removal remains blocked
- production rollout/default remains blocked
- Stage 6/Postgres production migration remains deferred and separate

## Acceptance Criteria

- runbook contains staging smoke phases/order.
- prerequisites gate is explicit.
- direct and TURN smoke matrix is documented.
- rollback verification and failure/rollback decision rules are documented.
- evidence/output template exists.
- human/operator inputs are called out.
- wave/status docs mark Segment 167 done and do not recommend another abstract planning segment by default.
- no runtime/env/infra/production behavior changed.

## Verification

Run:

```powershell
git diff --check
rg -n "production-media-staging-smoke-plan|staging smoke|MEDIA_TURN|MEDIA_SFU|coturn|mediasoup|rollback|LiveKit|operator|Postgres|run report" docs/runbooks docs/waves docs/roadmap docs/delegation --glob "*.md"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

## Recommended Next Segment

Recommended next depends on operator input status:
- `production-media-process-env-fill-operator-inputs` if required values, owners, logs, firewall assumptions, rollback owner, or staging run window are not filled.
- `production-media-staging-smoke-run-report` only if operator inputs are filled and staging env exists.

Do not proceed next to:
- another abstract planning segment by default
- staging smoke run without operator inputs
- production rollout/default switch
- LiveKit removal
- production firewall/runtime implementation without a scoped segment
- Stage 6 production DB cutover
