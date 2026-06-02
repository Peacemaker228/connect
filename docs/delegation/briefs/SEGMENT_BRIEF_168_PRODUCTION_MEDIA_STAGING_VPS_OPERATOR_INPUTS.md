# Segment 168. Production Media Staging VPS Operator Inputs

Branch: `wave/stage9-production-media-staging-smoke-plan`

## Scope

Docs-only operator-input decision segment for the Stage 9 production media track.

This segment records the operator decision to use a separate staging/preprod VPS before any production media canary. It does not bootstrap the server, does not connect to the server, does not change runtime code, does not change real env/secret files, and does not enable production SFU/TURN/default behavior.

## Decisions Recorded

- Staging/preprod will use a separate VPS instead of the current production VPS.
- The staging public web origin target is `https://staging.ax-connect.ru`.
- The production canonical domain direction is `https://ax-connect.ru`; `https://www.ax-connect.ru` should redirect to the canonical origin when the production deploy/runbook work reaches that point.
- The staging VPS public IPv4 exists and is intentionally not committed in repo docs; it is operator-owned outside the repository.
- Initial staging OS target is Ubuntu 22.04.
- The initial root password was shared through chat and must be treated as exposed: rotate it during bootstrap and move to SSH-key-based access.
- Staging bootstrap should create a non-root deploy/operator user before app/media rollout work.
- Coturn staging direction: Docker-managed coturn is preferred for repeatable packaging and future Docker/CI-CD alignment.
- App/API staging direction: keep PM2-style app/API process continuity first unless a later deploy modernization segment explicitly changes it.
- Mediasoup staging direction: keep mediasoup lifecycle owned by `apps/api` for the MVP/staging run, with process-local state still blocking production/multi-process readiness.
- Operator is available for server commands, smoke checks, and low-traffic/maintenance windows when a runbook asks for them.

## Security Notes

- Do not record root passwords, private keys, generated TURN credentials, cookies, auth headers, or secret env values in repo docs or handoffs.
- Because the initial root password was exposed in chat, staging bootstrap must rotate credentials and move to SSH-key access before any serious staging work.
- The old production secrets previously pasted in chat remain out of this segment; secret rotation remains a later controlled production/deploy-window task.

## Updated Plan Implication

The next segment should not be another abstract planning segment. It should be a concrete staging bootstrap handoff:

- `production-staging-vps-bootstrap-brief`

That brief should give the operator exact steps/commands for:

- DNS check for `staging.ax-connect.ru`
- first SSH login
- SSH-key setup and password rotation
- non-root deploy user creation
- base packages
- firewall baseline
- Docker installation
- PM2/Bun/Nginx readiness
- log/status commands
- no production env or real production data

## Verification

Expected verification for this docs-only segment:

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`

## Classification

- staging VPS decision: `pass / recorded`
- staging server bootstrap: `blocked until next brief/run`
- staging smoke run: `blocked until bootstrap/env exists`
- production default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

