# Segment 224. Desktop Release Readiness Roadmap

## Classification

- segment: `desktop-release-readiness-roadmap`
- type: `docs-only planning`
- status: `pass / documented`
- runtime changes: `none`
- desktop build changes: `none`
- production/staging changes: `none`

## Branch

- branch used: `feature/desktop-release-roadmap`
- base branch: `core/reborn`

## Goal

Create an explicit desktop release roadmap and runbook skeleton so AxConnect can move from a thin Electron shell to a controlled desktop-first release line with staging/prod channels, downloads, auto-update, native notifications, runtime smoke, and release hardening.

## Required Reading For Next Desktop Segment

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `electron/README.md`
- `package.json`
- `electron/main.js`
- `electron/preload.js`
- `electron/app-config.json`

## What Was Added

- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
  - desktop product requirements;
  - current inventory;
  - blockers;
  - staging/prod channel model;
  - phased segment roadmap from build reproducibility through production rollout;
  - verification and hard rules.
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
  - draft release process;
  - artifact model;
  - future manual release order;
  - desktop smoke checklist;
  - rollback and security checklist.

## What Was Updated

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`

## Current Desktop Findings

- Desktop is currently a remote-web Electron shell over the deployed app.
- This is acceptable for the first desktop release line, but it is not enough for desktop-first production readiness.
- Web UI updates can reach desktop through web deploys, but native shell/preload/updater/notification changes require a desktop release/update path.
- `check:desktop:config` is not a runtime smoke.
- Desktop release readiness is blocked until packaging, artifact hosting, auto-update, native notifications, and packaged runtime smoke are addressed.

## Explicit Non-Goals

- no Electron runtime code changes;
- no package config changes;
- no auto-update implementation;
- no native notification implementation;
- no desktop artifact upload;
- no staging/prod deploy;
- no WebRTC production rollout;
- no DB/schema/migration work;
- no `Next -> React/Vite` rewrite.

## Recommended Next Segment

`desktop-build-reproducibility-audit`

Expected focus:

- re-run and fix or document `bun.cmd run build:desktop`;
- decide official build environment;
- prove a Windows installer can be produced;
- record exact artifact names/output;
- keep behavior unchanged.

Acceptable follow-up after that:

- `desktop-staging-channel-config`;
- `desktop-artifact-download-runbook`;
- `desktop-runtime-smoke-pass`;
- `desktop-native-notification-bridge`;
- `desktop-auto-update-proof`.

## Verification

Docs-only verification should include:

```powershell
git diff --check
bun.cmd run check:desktop:config
```

If the next segment touches runtime/package code, run the broader set:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Do not claim desktop pass without packaged app smoke.

