# Segment 231A. Desktop Auto-Update Flow Hardening

## Classification

- segment: `desktop-auto-update-flow-hardening`
- type: `desktop release / updater runtime hardening`
- status: `review / implementation added; packaged smoke pending`
- target branch: `feature/desktop-auto-update-flow-hardening`
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
- `docs/delegation/briefs/SEGMENT_BRIEF_231_DESKTOP_AUTO_UPDATE_PROOF.md`.

Selected rules for the agent:

- `rules/rules.md` for baseline engineering discipline;
- `rules/task.md` because renderer desktop update status/menu behavior may be touched;
- `rules/architecture-docs.md` because roadmap/runbook/status must stay current;
- `rules/review/mini-review.md` for final self-review and handoff.

Legacy/deferred areas intentionally excluded:

- no production rollout; production is currently inactive and will be rebuilt later;
- no CI/CD/release automation;
- no code signing;
- no update-ready UX polish such as green button/banner/toast/native update-ready prompt;
- no DB/schema/migrations;
- no storage/media/WebRTC;
- no broad Electron security/link hardening;
- no desktop file-download UX polish.

## Current State

Segment 231 proved the staging updater path:

- staging packaged desktop has `electron-updater`;
- staging generic provider points at `https://staging.ax-connect.ru/downloads/desktop/staging/win/`;
- `0.0.3` detected hosted `0.0.4`;
- update downloaded;
- explicit restart/update relaunched the app as `0.0.4`;
- browser web runtime is not the updater target.

The remaining problem is not proof of possibility. The next issue is reliability of the updater lifecycle before we add prominent product UX.

Known current gap:

- update state is mostly visible through the desktop account-menu item;
- status transitions, retries, repeated checks, error recovery, and periodic checks need to be hardened so the future UX has a reliable source of truth.

## Goal

Make the desktop updater runtime dependable enough for user-facing update UX and later CI/CD publishing.

This segment should harden the internal updater flow without changing release hosting or adding polished update-ready UI.

## In Scope

- Inspect the current updater implementation end to end:
  - main process update initialization;
  - preload update bridge;
  - renderer status/action consumption;
  - staging channel config;
  - current build/version metadata.
- Normalize a bounded update status lifecycle:
  - unsupported;
  - idle;
  - checking;
  - available;
  - not_available;
  - downloading;
  - downloaded;
  - error.
- Include useful safe fields where appropriate:
  - `currentVersion`;
  - `updateVersion`;
  - `channel`;
  - `progressPercent`;
  - `lastCheckedAt`;
  - `lastSuccessfulCheckAt`;
  - `lastErrorAt`;
  - sanitized `error`.
- Prevent duplicate concurrent update checks or download storms.
- Add bounded periodic checks for packaged staging desktop only.
  - Recommended interval: 30-60 minutes.
  - Do not check repeatedly while `checking`, `downloading`, or `downloaded`.
- Keep manual check/retry possible from the existing desktop update action.
- Ensure failure cases do not crash the app:
  - missing `latest.yml`;
  - `404`/network failure;
  - invalid metadata;
  - download/hash failure;
  - same-version/no-update response.
- Keep install/restart explicit; do not auto-restart.
- Update docs/runbook/status with final behavior and smoke requirements.

## Out Of Scope

- No update-ready visual polish:
  - no Discord-like green restart button;
  - no banner/toast;
  - no native update-ready notification;
  - no taskbar badge for update availability.
- No CI/CD release pipeline.
- No signing/notarization.
- No production update provider.
- No server/Nginx publishing changes.
- No package version bump solely for proof unless the agent explicitly needs a local smoke artifact and documents that generated output stays ignored.
- No DB/schema/migrations.
- No storage/media/WebRTC/chat feature changes.
- No broad `electron/*` architecture move into `apps/desktop`.

## Files To Inspect First

- `electron/main.js`;
- `electron/preload.js`;
- `global.d.ts`;
- `electron/app-config.json`;
- `electron-builder.staging.json`;
- `electron/validate-production-config.mjs`;
- `electron/README.md`;
- `src/lib/shared/features/backend-user-menu.tsx`;
- any existing desktop update menu/status component if it was split from `backend-user-menu.tsx`;
- `package.json`;
- `electron/package.json`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## Constraints

- Start from latest `origin/core/reborn`.
- The feature branch must not track `origin/core/reborn`; if it does, run `git branch --unset-upstream`.
- Preserve the proven staging update path.
- Keep production update provider disabled/unconfigured unless the current code already has a safe no-op placeholder.
- Do not show updater UI in ordinary browser web runtime.
- Do not expose arbitrary IPC through preload.
- Do not log secrets, cookies, auth headers, storage credentials, or full backend payloads.
- Generated artifacts must remain untracked:
  - `dist-desktop/*`;
  - `electron/build-info.json`;
  - `.exe`;
  - `.blockmap`;
  - `latest.yml`.

## Expected Implementation Shape

Prefer a small internal updater state module or clearly separated helpers inside `electron/main.js` if extraction is not worth it yet.

Main process responsibilities:

- own the authoritative updater state;
- guard against unsupported channel/runtime;
- guard against concurrent checks/downloads;
- map `electron-updater` events to the bounded status lifecycle;
- schedule packaged staging periodic checks;
- keep `quitAndInstall` behind explicit renderer action.

Preload responsibilities:

- expose only the existing narrow update API shape or a minimal compatible extension;
- provide `getUpdateStatus`, `checkForUpdate`, `installUpdate`, and status subscription;
- do not expose raw `ipcRenderer`.

Renderer responsibilities:

- keep the existing account-menu update control functional;
- surface retry/error/downloaded state clearly enough for smoke;
- avoid product-level update-ready polish that belongs to the next segment.

## Acceptance Criteria

- Packaged staging desktop initializes updater without crashing.
- Browser web does not expose or render desktop updater controls.
- Production/default desktop config does not consume staging update metadata.
- Same-version/no-update check ends in `not_available` or another intentional non-error state.
- Missing/unreachable update metadata ends in `error` with retry available, not a crash or stuck `checking`.
- Multiple quick manual checks do not start concurrent checks/downloads.
- Periodic check exists for packaged staging and is bounded.
- `downloaded` state remains stable until explicit restart/update.
- `installUpdate()` is ignored or returns a safe error unless update status is `downloaded`.
- Existing Segment 231 `0.0.3 -> 0.0.4` path remains conceptually supported.
- Docs record the final lifecycle, smoke checklist, and remaining UX gap.

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

If updater implementation changes packaging behavior, also run:

```powershell
bun.cmd run build:desktop:staging
```

Do not add generated files.

## Implementation Result

Status:

- implementation added on `feature/desktop-auto-update-flow-hardening`;
- no production update provider was added;
- no update-ready banner/toast/native prompt/green button was added;
- packaged staging smoke was not rerun in this pass.

Updater lifecycle:

- `unsupported`: non-packaged runtime or non-staging packaged channel;
- `idle`: packaged staging updater is available but has not checked yet;
- `checking`: a check is in progress;
- `available`: update metadata says a newer version exists and auto-download is expected to proceed;
- `not_available`: same-version/no-update response;
- `downloading`: update download progress is available;
- `downloaded`: update is ready and remains stable until explicit restart/update;
- `error`: updater error, network failure, missing/invalid metadata, or download/hash failure.

Safe status fields:

- `currentVersion`;
- `updateVersion`;
- `channel`;
- `progressPercent`;
- `lastCheckedAt`;
- `lastSuccessfulCheckAt`;
- `lastErrorAt`;
- sanitized `error`;
- `updatedAt`.

Guard rules:

- updater remains enabled only for packaged `staging`;
- unsupported runtimes return `unsupported` instead of attempting updater calls;
- manual/periodic checks are ignored while status is `checking`, `available`, `downloading`, or `downloaded`;
- `downloaded` is preserved until explicit `installUpdate()`;
- `installUpdate()` returns a safe `update_not_downloaded` error unless status is `downloaded`;
- retry remains available from the existing desktop account-menu action after `error` or `not_available`;
- periodic checks run only for packaged staging, every `45` minutes, and use the same guard as manual checks.

Renderer behavior:

- ordinary browser web runtime still renders no updater control;
- existing account-menu updater item remains the only visible control;
- error state label is a retry action;
- no prominent update-ready UX was added in this segment.

## Manual Smoke

Minimum packaged staging smoke if a build is produced:

1. Install or run a packaged staging build.
2. Confirm `window.electron.getBuildInfo()` reports channel `staging`.
3. Confirm `await window.electron.getUpdateStatus()` returns a supported staging status.
4. Trigger manual check from the account-menu update action or console bridge.
5. Confirm no-update/same-version does not crash and does not stay stuck in `checking`.
6. Trigger two quick checks and confirm there is no duplicate download/check storm.
7. If an update is hosted, confirm `downloaded` state and explicit restart still work.
8. If no hosted update is available, clearly report that `N -> N+1` smoke was not rerun.

Optional negative smoke if operator can safely move/restore metadata:

- temporarily make `latest.yml` unavailable or invalid;
- confirm status becomes `error`;
- restore `latest.yml`;
- confirm manual retry can recover.

Do not perform server publishing changes without explicit operator approval.

## Handoff Format

Return:

- branch/base commit and upstream status;
- changed files;
- update lifecycle states implemented;
- periodic-check interval and guard rules;
- unsupported/runtime/channel behavior;
- verification commands and results;
- packaged smoke result or explicit reason it was not run;
- generated artifacts status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.
