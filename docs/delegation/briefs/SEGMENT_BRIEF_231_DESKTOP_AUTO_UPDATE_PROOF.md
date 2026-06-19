# Segment 231. Desktop Auto-Update Proof

## Classification

- segment: `desktop-auto-update-proof`
- type: `desktop release / update pipeline proof`
- status: `brief ready`
- target branch: `feature/desktop-auto-update-proof`
- source branch: latest `origin/core/reborn`
- commit policy: do not commit automatically; return PowerShell-safe git commands

## Preparation Summary

Docs checked before writing this brief:

- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/ARCHITECTURE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `electron/README.md`;
- `package.json`;
- `electron-builder.staging.json`;
- `electron/app-config.json`;
- `electron/main.js`;
- `electron/preload.js`.

Official updater docs checked:

- Electron Builder Auto Update: `https://www.electron.build/docs/features/auto-update/`;
- Electron Builder Publish: `https://www.electron.build/docs/publish`;
- Electron Publishing and Updating overview: `https://electronjs.org/docs/latest/tutorial/tutorial-publishing-updating`.

Selected rules:

- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this adds desktop-facing UI/status behavior;
- `rules/sdk-client-access.md` only for client/runtime state discipline if renderer UI is touched;
- `rules/architecture-docs.md` because this updates desktop release roadmap/runbook/status;
- `rules/review/mini-review.md` for final self-review.

Legacy/deferred areas intentionally excluded:

- no production rollout; current production app/server is not the active target;
- no DB/schema/migrations;
- no storage/media/WebRTC;
- no auth/session rewrite;
- no code signing;
- no CI/CD pipeline;
- no app/taskbar badge expansion;
- no desktop file-download UX polish in this segment.

## Current State

- Staging is the active user-facing stand.
- The staging desktop installer can be downloaded from:
  - `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`.
- Nginx serves `/downloads/desktop/*` statically outside the app repo.
- `AxConnect Staging` packaging identity is separated:
  - app id: `com.axconnect.desktop.staging`;
  - product name: `AxConnect Staging`;
  - protocol: `axconnect-staging`;
  - renderer URL: `https://staging.ax-connect.ru`.
- Current `package.json` version is `0.0.2`.
- `electron-updater` is not installed.
- `electron-builder.staging.json` does not yet define a `publish` provider.
- `build:desktop:staging` currently uses `--publish never`.

## Product Goal

Prove that the staging desktop app can update itself without asking users to manually open the browser and download a new installer every time.

Desired user-facing model:

1. App starts and checks the staging update channel.
2. If a newer version exists, it downloads the update in the background or through an explicit user action.
3. The app shows a clear update-ready state.
4. User chooses restart/update.
5. App restarts into the newer version.

Staging and production update channels must stay separate even though production is currently inactive and expected to be rebuilt later.

## In Scope

- Add `electron-updater` as a runtime dependency.
- Configure staging generic update provider for static hosting.
- Add narrow main/preload update bridge:
  - check for update;
  - report status/progress;
  - install/restart when ready.
- Add minimal desktop-only renderer UI/status for updates.
- Keep update checks disabled/no-op outside packaged desktop where appropriate.
- Produce a manual staging proof plan for version `N -> N+1`.
- Update desktop runbook, roadmap, and stage status.

## Out Of Scope

- No production update publishing.
- No code signing.
- No GitHub Actions / CI/CD.
- No automatic forced restart.
- No database or API changes.
- No web-only update UX.
- No app/taskbar badge.
- No file download UX polish.

## Constraints

- Do not commit generated artifacts:
  - `dist-desktop/*`;
  - `electron/build-info.json`;
  - installer `.exe`;
  - `.blockmap`;
  - `latest.yml`.
- Do not rely on production URLs for the staging update proof.
- Do not make staging update into production or production update into staging.
- Do not call updater code from ordinary browser web runtime.
- Do not silently quit/restart while the user is working; use explicit user confirmation for `quitAndInstall`.
- Keep logs and docs free of secrets.

## Expected Implementation Shape

1. Dependency/config:
   - add `electron-updater` to runtime dependencies;
   - add staging generic `publish` config pointing to the staging static update URL;
   - preserve production build defaults unless explicitly adding a safe inactive production provider placeholder.

2. Electron main process:
   - initialize updater only for packaged desktop;
   - use channel-aware config from the existing desktop channel model;
   - wire updater events to a bounded status object:
     - idle;
     - checking;
     - available;
     - not_available;
     - downloading;
     - downloaded;
     - error.
   - expose narrow IPC handlers through preload.

3. Renderer:
   - show desktop-only update status in a low-risk location, preferably account/user menu or a small desktop status control;
   - do not show update UI in browser web;
   - allow explicit `Restart and update` only after download completes;
   - avoid noisy UI while no update is available.

4. Staging proof:
   - build/install version `N` that contains updater support;
   - publish version `N+1` artifacts and metadata to the staging static update path;
   - prove the installed app detects, downloads, and restarts into `N+1`.

## Versioning Decision For Proof

The proof requires two versions. The agent must choose one safe route and document it:

- Preferred: make a deliberate desktop version bump for the staging proof, such as `0.0.3`, and record the artifact/hash evidence.
- Alternative: if version bump is not acceptable in the same PR, document a two-commit local proof procedure, but do not claim auto-update pass until `N -> N+1` is actually proven.

Do not fake the proof by only calling `checkForUpdates()` against the same version.

## Expected Staging Update Paths

Use the already working static hosting family:

```text
https://staging.ax-connect.ru/downloads/desktop/staging/win/latest.yml
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe.blockmap
```

Keep the existing manual download aliases:

```text
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.sha256
```

## Files To Inspect First

- `package.json`;
- `bun.lock` / lockfile after dependency install;
- `electron-builder.staging.json`;
- `electron/app-config.json`;
- `electron/main.js`;
- `electron/preload.js`;
- `global.d.ts`;
- `src/lib/shared/features/backend-user-menu.tsx`;
- `src/lib/shared/features/desktop-deep-link-handler.tsx`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## Acceptance Criteria

- Staging packaged app can query staging update metadata.
- Same-version check reports no update instead of error.
- Version `N` detects version `N+1`.
- Version `N+1` download completes.
- User sees explicit restart/update action.
- After restart, `window.electron.getBuildInfo()` or visible app version reports `N+1`.
- Staging and production channel configs remain separated.
- Browser web runtime does not expose or show desktop update UI.
- Generated artifacts remain untracked.

## Verification Commands

Local PowerShell:

```powershell
git status --short --branch
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
bun.cmd run check:desktop:staging-config
node --check .\electron\main.js
node --check .\electron\preload.js
git diff --check
```

Desktop build proof:

```powershell
bun.cmd run build:desktop:staging
```

Do not add generated files.

## Manual Smoke

1. Install staging desktop version `N`.
2. Confirm app opens staging.
3. Confirm `window.electron.getBuildInfo()` reports version `N`, channel `staging`.
4. Publish version `N+1` staging artifacts plus `latest.yml` to `/var/www/ax-connect-desktop-downloads/desktop/staging/win/`.
5. Start version `N`.
6. Trigger/check update.
7. Confirm update status reaches downloaded/update-ready.
8. Click restart/update.
9. Confirm app relaunches.
10. Confirm `window.electron.getBuildInfo()` reports version `N+1`.
11. Confirm normal login/chat still works after update.

## Handoff Format

Return:

- changed files;
- exact version(s) used;
- artifact names, sizes, SHA256;
- whether `latest.yml` and blockmap were generated and hosted;
- exact local build command;
- exact VPS publish commands used or prepared;
- manual smoke result;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

