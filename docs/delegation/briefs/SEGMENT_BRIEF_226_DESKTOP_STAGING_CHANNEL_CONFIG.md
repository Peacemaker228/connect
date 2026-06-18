# Segment 226. Desktop Staging Channel Config

## Classification

- segment: `desktop-staging-channel-config`
- type: `desktop release / packaging config`
- status: `pass / staging channel config implemented; runtime smoke pending`
- target branch: `feature/desktop-staging-channel-config`
- source branch: latest `origin/core/reborn`

## Repository State At Brief Creation

- brief prepared from branch: `feature/desktop-staging-channel-config-brief`
- worktree at preparation: clean after switching from `origin/core/reborn`
- upstream tracking at preparation: none shown by `git status --short --branch` after `git branch --unset-upstream`
- Segment 225 build proof is merged into `origin/core/reborn`

## Goal

Create a safe staging desktop build channel that produces a Windows installer for `https://staging.ax-connect.ru` without breaking the current production desktop build defaults.

This is the first channel-separation slice. It must make the staging build explicit and repeatable, but it must not publish artifacts, implement auto-update, or claim desktop runtime smoke pass.

## Required Reading

Read first:

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `electron/README.md`

Selected rules rationale:

- `rules/rules.md`: senior engineering baseline and no assumptions without inspection.
- `rules/for-brief.md`: required because this work may produce follow-up operator/release briefs.
- `rules/review/mini-review.md`: required for handoff review and merge readiness.
- `rules/architecture-docs.md`: this segment changes release/channel architecture docs and desktop packaging boundaries.

## Files To Inspect First

- `package.json`
- `electron/package.json`
- `electron/app-config.json`
- `electron/main.js`
- `electron/preload.js`
- `electron/generate-build-info.mjs`
- `electron/validate-production-config.mjs`
- `electron/README.md`
- `.gitignore`
- `src/lib/shared/features/desktop-download-button.tsx`
- `src/lib/shared/utils/desktop-download.ts`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/roadmap/STAGE_STATUS.md`

## Current Context

- Segment 225 proved the local Windows installer build on a symlink-capable build context.
- Current checked-in desktop config points packaged app to `https://ax-connect.ru`.
- Current root `package.json` Electron Builder config uses:
  - app id: `com.axconnect.desktop`;
  - product name: `AxConnect`;
  - artifact name: `${productName}-Setup-${version}.${ext}`;
  - output directory: `dist-desktop`.
- Current `build:desktop` is production-shaped and should remain production-shaped unless explicitly renamed in this segment.
- `staging.ax-connect.ru` is currently the active user stand and must not be treated as disposable.
- Generated artifacts under `dist-desktop/*` and `electron/build-info.json` are ignored and must not be committed.

## In Scope

- add an explicit staging desktop build path;
- make the staging packaged app open `https://staging.ax-connect.ru`;
- separate staging identity from production enough to avoid accidental install/update collisions:
  - candidate app id: `com.axconnect.desktop.staging`;
  - candidate product name: `AxConnect Staging`;
  - candidate artifact name: `AxConnect-Staging-Setup-<version>.exe`;
- preserve production build behavior and production `AxConnect` identity;
- add or adjust validation scripts so the staging URL/product identity can be checked before build;
- record exact build commands for staging and production;
- build the staging installer locally if the symlink-capable Windows build context is available;
- record generated artifact name, size, SHA256, and generated metadata if build passes;
- update desktop roadmap/runbook/status docs with the implementation result.

## Out Of Scope

- do not publish installers to the VPS or any public download path;
- do not change Nginx or server static hosting;
- do not implement auto-update;
- do not add `electron-updater`;
- do not configure signing, certificates, or publish providers;
- do not implement native notifications or app/taskbar badges;
- do not run packaged desktop runtime smoke as a pass gate beyond a minimal launch/config sanity if explicitly done;
- do not change chat/auth/storage/media/web runtime behavior;
- do not run DB migrations;
- do not resume WebRTC/media rollout;
- do not change production staging server data;
- do not commit generated installers, blockmaps, `latest.yml`, or `electron/build-info.json`.

## Expected Implementation Shape

Prefer a deterministic build-time channel mechanism over manual editing of checked-in files.

Acceptable implementation directions:

- checked-in public config contains production and staging public URLs, while an ignored/generated build-channel file or build config selects the packaged channel;
- separate checked-in Electron Builder configs/scripts for production and staging, as long as production defaults remain intact and the staging output is explicit;
- small Node scripts under `electron/*` to validate/generate channel build metadata, if that keeps commands safer and clearer.

Avoid:

- requiring the operator to manually edit `electron/app-config.json` before each build;
- leaving the repo dirty after a successful staging build;
- making production `build:desktop` silently produce a staging installer;
- storing private secrets or server credentials in desktop config;
- adding broad release automation before the channel model is proven.

## Compatibility Requirements

- Current production command behavior must remain available.
- Staging build must not overwrite production identity in a way that makes both builds indistinguishable.
- Staging and production artifacts must be named clearly enough for an operator not to upload or install the wrong one.
- Desktop runtime must still deny broad/untrusted preload bridge use as before.
- Existing `check:desktop:config` should either keep production semantics or be replaced with clear channel-specific checks, such as `check:desktop:production-config` and `check:desktop:staging-config`.

## Acceptance Criteria

Pass if:

- there is a documented command to validate staging desktop config;
- there is a documented command to build staging desktop installer;
- staging build targets `https://staging.ax-connect.ru`;
- staging app identity/artifact name is distinguishable from production;
- production build/config remains valid and points to the production URL;
- generated artifacts are ignored/untracked;
- docs record artifact name, size, SHA256 if a staging build is produced.

Review if:

- staging build is configured but local build cannot be run because the symlink-capable build context is unavailable;
- channel separation exists but coexistence with production install still needs a packaged runtime smoke;
- production/staging commands are clear but official CI/CD remains deferred.

Blocked if:

- staging and production cannot be separated without risky package config changes;
- the implementation requires manual checked-in config edits before each build;
- production desktop build behavior is broken.

## Verification Commands

Minimum:

```powershell
git status --short --branch
bun.cmd run check:desktop:config
```

Add the new channel-specific commands introduced by the segment, for example:

```powershell
bun.cmd run check:desktop:staging-config
bun.cmd run build:desktop:staging
```

If package/runtime files are changed, run:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
```

If a staging installer is built, record:

```powershell
$installer = Get-ChildItem -Path dist-desktop -Filter '*Staging*Setup*.exe' -Recurse | Select-Object -First 1
$installer | Select-Object FullName, Length
Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName
git status --short --branch
```

## Manual Smoke

Manual smoke is review-only in this segment unless the operator explicitly runs it:

- launch the staging installer or unpacked staging app only if safe on the local machine;
- confirm the packaged app opens `https://staging.ax-connect.ru`;
- confirm app name/window/install identity says `AxConnect Staging` or the chosen staging product name;
- do not claim full desktop runtime pass until Segment 228.

## Docs To Update

- `docs/delegation/briefs/SEGMENT_BRIEF_226_DESKTOP_STAGING_CHANNEL_CONFIG.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/roadmap/STAGE_STATUS.md`
- `electron/README.md` if build commands/config shape changes

## Handoff Format

Return:

- branch name and whether it tracks any upstream;
- changed files;
- chosen channel config strategy;
- production command/status;
- staging command/status;
- staging artifact name/size/SHA256 if built;
- whether generated artifacts remain untracked/ignored;
- verification commands and results;
- manual smoke result if run;
- remaining risks;
- next recommended segment, expected to be `desktop-artifact-download-runbook` if staging channel config is usable.

Do not commit automatically unless explicitly asked.

## Completion Notes

Run date: `2026-06-18`

Branch and base:

- branch: `feature/desktop-staging-channel-config`;
- upstream tracking: none shown by `git status --short --branch`;
- `HEAD`: `58331629a914d782c70493f4718e909d0a6b484d`;
- `origin/core/reborn`: `58331629a914d782c70493f4718e909d0a6b484d`.

Chosen channel config strategy:

- `electron/app-config.json` now contains public production and staging channel metadata;
- production remains the default channel and keeps `https://ax-connect.ru`;
- staging is selected at packaging time through `electron-builder.staging.json` `extraMetadata.axConnectDesktopChannel=staging`;
- Electron main reads the packaged channel metadata and chooses the matching URL/protocol from `electron/app-config.json`;
- production `build:desktop` still uses the root `package.json` Electron Builder config;
- staging `build:desktop:staging` uses the separate checked-in `electron-builder.staging.json`.

Production channel:

- app id: `com.axconnect.desktop`;
- product name: `AxConnect`;
- renderer URL: `https://ax-connect.ru`;
- artifact pattern: `${productName}-Setup-${version}.${ext}`;
- command:

```powershell
bun.cmd run check:desktop:production-config
bun.cmd run build:desktop
```

Staging channel:

- app id: `com.axconnect.desktop.staging`;
- product name: `AxConnect Staging`;
- renderer URL: `https://staging.ax-connect.ru`;
- protocol: `axconnect-staging`;
- artifact pattern: `AxConnect-Staging-Setup-${version}.${ext}`;
- command:

```powershell
bun.cmd run check:desktop:staging-config
bun.cmd run build:desktop:staging
```

Build result:

- `bun.cmd run check:desktop:config`: passed for production;
- `bun.cmd run check:desktop:production-config`: passed;
- `bun.cmd run check:desktop:staging-config`: passed;
- `bun.cmd run build:desktop:staging`: passed;
- packaged `app.asar` metadata was inspected and contains `axConnectDesktopChannel: staging`;
- packaged `app-config.json` contains `channels.staging.productionUrl: https://staging.ax-connect.ru`.

Staging artifact:

- installer: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- size: `175306350` bytes;
- SHA256: `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- generated metadata:
  - `dist-desktop\latest.yml`;
  - `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe.blockmap`;
  - `dist-desktop\builder-debug.yml`;
  - `electron\build-info.json`.

Generated artifacts:

- `dist-desktop/*` remains ignored;
- `electron/build-info.json` remains ignored;
- generated installer, blockmap, `latest.yml`, debug yaml, and build-info must not be committed.

Manual smoke:

- not run in this segment;
- do not claim packaged desktop runtime pass until Segment 228.

Out of scope remained unchanged:

- no auto-update implementation;
- no artifact upload;
- no native notifications;
- no signing configuration;
- no runtime chat/auth/storage/media changes.

Next recommended segment:

- `desktop-artifact-download-runbook`.
