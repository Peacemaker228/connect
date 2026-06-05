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
- `production-media-process-env-readiness-review` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_166_PRODUCTION_MEDIA_PROCESS_ENV_READINESS_REVIEW.md`.
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` now includes a compact Process/Env Readiness Review matrix linking media host address, web/API origins, `MEDIA_TURN_*`, `MEDIA_SFU_*`, coturn/mediasoup process ownership, logs, rollback, firewall, monitoring, and staging smoke prerequisites.
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md` now includes non-secret process/operator checklist items for ownership, logs, firewall review, monitoring, rollback, and staging smoke readiness.
- staging smoke planning is allowed next, but staging smoke execution remains blocked until required operator inputs, owners, log paths, firewall assumptions, and rollback owner are filled outside the repo.
- no production media deploy, real env/secret change, PM2/systemd/Docker/Nginx/firewall config, runtime change, smoke execution, LiveKit removal, or production SFU/default enablement was made.
- `production-media-staging-smoke-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_167_PRODUCTION_MEDIA_STAGING_SMOKE_PLAN.md`.
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` now defines the final planning-only staging smoke order: prerequisites gate, app/API health, mediasoup health, coturn credential/no-open-relay checks, direct private/channel smokes, screen-share, TURN relay private/channel smokes, lifecycle recovery, cleanup convergence, LiveKit rollback, and failure/rollback decision.
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md` now includes a compact staging smoke run output table for a future run report without real values.
- staging smoke plan is `pass / documented`; staging smoke run remains blocked until operator inputs and a staging env exist.
- no staging/prod smoke was run, and no runtime, real env/secret, PM2/systemd/Docker/Nginx/firewall, LiveKit, production default, or Stage 6/Postgres behavior changed.
- `production-media-staging-vps-operator-inputs` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_168_PRODUCTION_MEDIA_STAGING_VPS_OPERATOR_INPUTS.md`.
- operator decision: provision a separate staging/preprod VPS instead of testing staging media on the current production VPS.
- staging origin target is `https://staging.ax-connect.ru`; the real staging public IPv4 remains outside repo docs.
- production canonical origin direction is `https://ax-connect.ru`, with `www` redirect deferred to the later production domain/Nginx segment.
- staging process direction is PM2-style app/API continuity, `apps/api`-owned mediasoup lifecycle for MVP/staging, and Docker-preferred coturn with systemd fallback.
- the initial root credential was exposed in chat; staging bootstrap must rotate credentials and move to SSH-key access before serious staging work.
- `production-staging-vps-bootstrap-brief` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_169_PRODUCTION_STAGING_VPS_BOOTSTRAP_BRIEF.md`.
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md` now includes the staging VPS bootstrap plan covering DNS A-record checks, first SSH login, deploy user creation, SSH-key setup, root password rotation, password-login hardening, base packages, Docker readiness for coturn, Bun/Node/PM2 readiness for app/API, Nginx readiness, UFW/provider firewall discovery, candidate ports, status/log commands, redaction rules, and rollback/no-production-impact guardrails.
- staging VPS bootstrap plan is `pass / documented`; before the run report, actual bootstrap execution remained blocked until operator execution.
- the bootstrap brief itself did not perform staging/prod SSH connection, real IP/secret/env recording, Docker/PM2/Nginx/firewall application, smoke execution, LiveKit removal, production default, or Stage 6/Postgres behavior changes.
- `production-staging-vps-bootstrap-run-report` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_170_PRODUCTION_STAGING_VPS_BOOTSTRAP_RUN_REPORT.md`.
- operator bootstrap on the separate staging VPS passed with redacted evidence: DNS A-record observed, root credential rotated, deploy user and SSH key verified, root/password SSH disabled, base packages installed, Docker/Bun/Node/PM2/Nginx ready, UFW baseline active, provider firewall not found by operator, kernel reboot completed, and no reboot-required flag remains.
- no app/API deploy, staging env fill, coturn container, media smoke, production change, LiveKit removal, production default, or Stage 6/Postgres behavior changed.
- `production-media-staging-env-setup-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_171_PRODUCTION_MEDIA_STAGING_ENV_SETUP_PLAN.md`.
- staging env/deploy setup plan covers `/var/www/ax-connect-staging`, deploy-owned repo layout, PM2 process names `ax-connect-staging-web` and `ax-connect-staging-api`, web/API ports `3001` and `4000`, Nginx staging site/TLS plan for `staging.ax-connect.ru`, env inventory without values, separate staging PostgreSQL decision/options, Docker-preferred coturn config plan, `MEDIA_TURN_*` / `MEDIA_SFU_*` mapping, LiveKit rollback env/checks, and smoke readiness gates.
- no VPS connection, deploy, real env creation, secret/IP recording, PM2/Nginx/coturn/app start, migration, smoke, production change, LiveKit removal, production default, or Stage 6/Postgres production migration change was made.
- `production-media-staging-env-setup-run-report` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md`.
- operator-guided staging setup on the separate staging VPS is `partial pass / redacted evidence recorded`: repo checkout at the approved commit, server-local env files, Docker Postgres, app/API build, PM2 web/API, Nginx staging site, TLS, HTTPS API health, and coturn compose config are complete without recording secret values.
- remaining before staging smoke: staging DB schema/migrations are not run, LiveKit rollback env is missing, Storage env is missing, coturn container is not started, authenticated app/session and mediasoup health are not run, direct/TURN media smoke is not run, production remains untouched.
- `production-media-staging-pre-smoke-readiness-run-report` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_173_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RUN_REPORT.md`.
- operator-guided staging pre-smoke readiness is `partial pass / blocked before media smoke`: LiveKit rollback env is present, Storage is explicitly deferred for media-only pre-smoke, staging DB schema was applied to separate Docker Postgres, PM2 web/API remained online after restart, coturn is running with config loaded, minimal no-open-relay checks passed, authenticated app/session passed, and LiveKit token path passed without recording secrets.
- remaining before direct/TURN media smoke: authenticated mediasoup health is reachable but reports `disabled` because local mediasoup prototype is disabled in production runtime; direct/TURN media smoke was not run and must wait for a scoped staging-safe mediasoup runtime decision.
- `staging-safe-media-sfu-enable-gate` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_174_STAGING_SAFE_MEDIA_SFU_ENABLE_GATE.md`.
- `apps/api` now has a server-only staging/preprod gate, `MEDIA_ENABLE_STAGING_SFU`, that allows mediasoup prototype health/transports/producers/consumers under `NODE_ENV=production` only when explicitly set to `1`, `true`, or `yes`.
- no `NEXT_PUBLIC_*` default gate, production SFU default, LiveKit removal, production env, production VPS change, media smoke, or Stage 6/Postgres production migration change was made.
- `production-media-staging-pre-smoke-readiness-rerun` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_175_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RERUN.md`.
- the merged Segment 174 code was deployed to the separate staging VPS at commit `40dab370279a3d963c6e589201536bcfb65c09a9`; `MEDIA_ENABLE_STAGING_SFU=1` was added only to staging API env, confirmed absent from staging web env, and API was restarted.
- the missing native mediasoup worker artifact was rebuilt on staging; authenticated mediasoup health then passed with status `ready`, enabled `true`, worker/router present, staging gate visible as non-secret runtime metadata, coturn running, LiveKit token path passing, and no direct/TURN media smoke run.

## Expected Future Implementation Segments

Recommended sequence:
1. `production-media-staging-smoke-run-report`
   - run direct and relay smoke in staging/non-production only after authenticated mediasoup health passes with the server-only gate and no production defaults
2. `production-media-canary-readiness-decision`
   - decide whether a narrow production canary is allowed
3. `production-media-rollback-drill-report`
   - prove LiveKit rollback/default switch before broader rollout

Do not proceed directly to production rollout, production default switch, LiveKit removal, or Stage 6 production Postgres cutover. Direct/TURN staging media smoke is allowed only in the next scoped staging smoke run-report segment and must stay non-production with LiveKit fallback preserved.

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
- [SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md](../delegation/briefs/SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md)
- [SEGMENT_BRIEF_173_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RUN_REPORT.md](../delegation/briefs/SEGMENT_BRIEF_173_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RUN_REPORT.md)
- [SEGMENT_BRIEF_174_STAGING_SAFE_MEDIA_SFU_ENABLE_GATE.md](../delegation/briefs/SEGMENT_BRIEF_174_STAGING_SAFE_MEDIA_SFU_ENABLE_GATE.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_160_PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md)
- [SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md](../delegation/briefs/SEGMENT_BRIEF_161_PRODUCTION_MEDIA_TOPOLOGY_DECISION.md)
- [SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md](../delegation/briefs/SEGMENT_BRIEF_162_PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md)
- [SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md](../delegation/briefs/SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md)
- [SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_164_PRODUCTION_COTURN_READINESS_PLAN.md)
- [SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_165_PRODUCTION_MEDIASOUP_PROCESS_PLAN.md)
- [SEGMENT_BRIEF_166_PRODUCTION_MEDIA_PROCESS_ENV_READINESS_REVIEW.md](../delegation/briefs/SEGMENT_BRIEF_166_PRODUCTION_MEDIA_PROCESS_ENV_READINESS_REVIEW.md)
- [SEGMENT_BRIEF_167_PRODUCTION_MEDIA_STAGING_SMOKE_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_167_PRODUCTION_MEDIA_STAGING_SMOKE_PLAN.md)
- [SEGMENT_BRIEF_168_PRODUCTION_MEDIA_STAGING_VPS_OPERATOR_INPUTS.md](../delegation/briefs/SEGMENT_BRIEF_168_PRODUCTION_MEDIA_STAGING_VPS_OPERATOR_INPUTS.md)
- [SEGMENT_BRIEF_169_PRODUCTION_STAGING_VPS_BOOTSTRAP_BRIEF.md](../delegation/briefs/SEGMENT_BRIEF_169_PRODUCTION_STAGING_VPS_BOOTSTRAP_BRIEF.md)
- [SEGMENT_BRIEF_170_PRODUCTION_STAGING_VPS_BOOTSTRAP_RUN_REPORT.md](../delegation/briefs/SEGMENT_BRIEF_170_PRODUCTION_STAGING_VPS_BOOTSTRAP_RUN_REPORT.md)
- [SEGMENT_BRIEF_171_PRODUCTION_MEDIA_STAGING_ENV_SETUP_PLAN.md](../delegation/briefs/SEGMENT_BRIEF_171_PRODUCTION_MEDIA_STAGING_ENV_SETUP_PLAN.md)
