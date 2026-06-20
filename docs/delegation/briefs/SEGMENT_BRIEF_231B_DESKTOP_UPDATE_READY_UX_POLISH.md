# Segment 231B. Desktop Update-Ready UX Polish

## Classification

- segment: `desktop-update-ready-ux-polish`
- type: `desktop release / updater product UX`
- status: `pass / implemented and smoke-tested`
- target branch: `feature/desktop-update-ready-ux-polish`
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
- `docs/delegation/briefs/SEGMENT_BRIEF_231A_DESKTOP_AUTO_UPDATE_FLOW_HARDENING.md`.

Selected rules for the agent:

- `rules/rules.md` for baseline engineering discipline;
- `rules/task.md` because this segment changes shared renderer UI;
- `rules/architecture-docs.md` because roadmap/runbook/status must stay current;
- `rules/review/mini-review.md` for final self-review and handoff.

Legacy/deferred areas intentionally excluded:

- no production update provider; production is currently inactive and will be rebuilt later;
- no CI/CD release automation;
- no code signing;
- no broad Electron security/link hardening;
- no desktop file-download UX polish;
- no DB/schema/migrations;
- no storage/media/WebRTC/chat feature work.

## Current State

The staging desktop auto-update path is now technically proven:

- `0.0.3 -> 0.0.4` update/restart proof passed;
- updater lifecycle hardening was implemented and smoke-tested for no-update, concurrent checks, missing metadata error, retry recovery, and explicit update flow;
- staging app was later rolled forward through the desktop/web/api rollout path.

The remaining UX gap is product visibility:

- update status no longer lives only in the account menu after this implementation pass;
- users now get a compact visible desktop-only signal when an update is downloading or ready;
- restart/update must stay explicit and non-surprising.

## Goal

Add a clear, non-invasive desktop-only update-ready affordance that makes downloaded updates visible without requiring users to open the account menu.

This segment should improve update UX while consuming the existing hardened updater state machine, not rewriting it.

## In Scope

- Inspect current desktop update UI and bridge usage:
  - `DesktopUpdateMenuItem`;
  - account menu placement;
  - top app/status area;
  - existing shadcn/shared UI primitives.
- Add a desktop-only visible update signal for important states:
  - `downloaded`: persistent "Restart and update" affordance;
  - `downloading`: optional compact progress display;
  - `checking` / `available`: optional low-key transient state if already available from the bridge.
- Keep `not_available`, `idle`, and `unsupported` quiet by default.
- Keep `error` non-alarming:
  - account-menu retry remains enough unless a compact retry surface fits naturally;
  - do not show a scary global error banner for transient update checks.
- Use the existing `window.electron` update APIs:
  - `getUpdateStatus`;
  - `onUpdateStatus`;
  - `checkForUpdate`;
  - `installUpdate`.
- Keep install/restart explicit:
  - no automatic restart;
  - no silent install;
  - user must click the update-ready action.
- Prefer existing shared shadcn/Radix components where they fit.
- Update docs/runbook/status with the final UX behavior and smoke checklist.

## Out Of Scope

- No updater state-machine rewrite unless a small UI-consumption bug is found.
- No production update provider.
- No CI/CD artifact publishing.
- No signing/notarization.
- No server/Nginx changes.
- No native update-ready notification unless the implementation is explicitly minimal and non-spammy; prefer in-app visible UX for this segment.
- No taskbar badge for update availability.
- No DB/schema/migrations.
- No storage/media/WebRTC/chat changes.
- No file-download UX polish.

## Files To Inspect First

- `src/lib/shared/features/desktop-update-menu-item.tsx`;
- `src/lib/shared/features/backend-user-menu.tsx`;
- likely app/topbar/status/version components under:
  - `src/lib/navigation/features/`;
  - `src/app/(main)/`;
  - `src/lib/shared/`;
- `global.d.ts`;
- `electron/main.js`;
- `electron/preload.js`;
- `electron/README.md`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## Constraints

- Start from latest `origin/core/reborn`.
- The feature branch must not track `origin/core/reborn`; if it does, run `git branch --unset-upstream`.
- Browser web runtime must not show desktop update controls.
- Production/default desktop channel must not consume staging update metadata.
- Do not expose new broad IPC APIs.
- Do not log secrets, cookies, auth headers, storage credentials, or full backend payloads.
- Generated artifacts must remain untracked:
  - `dist-desktop/*`;
  - `electron/build-info.json`;
  - `.exe`;
  - `.blockmap`;
  - `latest.yml`.
- Keep UI compact and suitable for a work app:
  - no modal on update availability;
  - no blocking overlay;
  - no large marketing-style banner.

## Expected Implementation Shape

Recommended shape:

- extract a small renderer hook if useful, for example `useDesktopUpdateStatus()`, so the account-menu item and new visible affordance do not duplicate bridge subscription logic;
- keep the existing account-menu item functional;
- add one compact desktop-only update-ready component in a globally visible place, preferably near the existing top status/version area or account/user controls;
- for `downloaded`, render a clear action with restart/update wording and icon;
- for `downloading`, render compact progress only if it does not create layout noise;
- for ordinary browser runtime, render `null`;
- for unsupported/no-update, render `null`.

If the selected top-level placement is not obvious, document the reason in the handoff.

## Acceptance Criteria

- Installed packaged staging desktop shows a visible update-ready action when status is `downloaded`.
- Clicking the visible action calls `installUpdate()` and preserves the existing explicit restart/update flow.
- Account-menu update item still works.
- Ordinary browser web runtime shows no updater UI.
- No-update state is quiet and does not show a persistent indicator.
- Error state remains retryable and does not create a noisy global error surface.
- Update UI survives renderer reload by reading `getUpdateStatus()`.
- Update UI reacts to `onUpdateStatus` changes without requiring a full reload.
- Layout remains stable on common desktop widths and does not obscure chat controls.
- Docs record the final behavior and smoke requirements.

## Implementation Result

- Added `useDesktopUpdateStatus()` so renderer update UI shares one bridge snapshot/subscription path.
- Refactored `DesktopUpdateMenuItem` to use the shared hook while preserving check/retry/restart behavior.
- Added `DesktopUpdateReadyAction` in the server sidebar footer, next to account controls.
- `downloading` renders compact desktop-only progress; `downloaded` renders an explicit `Restart` button that calls `installUpdate()`.
- `idle`, `not_available`, `unsupported`, and `error` render no global update UI; retry stays in the account menu.
- Browser web renders no updater UI because the component requires the Electron update bridge.
- Electron main/preload, production update provider, CI/CD, signing, DB/storage/media/WebRTC/chat logic were not changed.
- Packaged staging smoke passed after the remote-web requirement was handled: the desktop shell updated from `0.0.6` to `0.0.7`, staging web was deployed with this renderer UI, the visible `Restart` action appeared for downloaded update status, and update/restart completed successfully.

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

If desktop packaging or preload/main behavior changes, also run:

```powershell
bun.cmd run build:desktop:staging
```

Do not add generated files.

## Manual Smoke

Minimum smoke:

1. In ordinary browser web, confirm no desktop update UI is visible.
2. In packaged staging desktop with no update available, confirm no persistent update-ready indicator is visible and account-menu check still works.
3. Publish an N+1 staging update, or use the existing operator update proof process.
4. Run installed N.
5. Confirm status eventually reaches `downloaded`.
6. Confirm the new visible update-ready action appears without opening the account menu.
7. Click the visible action.
8. Confirm the app restarts/updates and `window.electron.getBuildInfo()` reports the N+1 version.
9. Confirm the visible action disappears after the update.
10. Confirm account-menu update behavior still works after the update.

Negative smoke:

- temporarily make `latest.yml` unavailable only if the operator approves;
- confirm the account-menu retry path handles `error`;
- confirm no noisy global error banner appears.

## Handoff Format

Return:

- branch/base commit and upstream status;
- changed files;
- exact UI placement and behavior by status;
- whether a shared hook/component was added;
- browser/desktop separation evidence;
- verification commands and results;
- packaged smoke result or explicit reason it was not run;
- generated artifacts status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.
