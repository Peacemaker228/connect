# Segment 225. Desktop Build Reproducibility Audit

## Classification

- segment: `desktop-build-reproducibility-audit`
- type: `desktop release / build audit`
- status: `blocked / build environment action required`
- target branch: `feature/desktop-build-reproducibility-audit`
- source branch: latest `origin/core/reborn`

## Repository State At Brief Creation

- brief prepared from branch: `feature/desktop-build-reproducibility-audit`
- worktree at preparation: clean
- upstream tracking at preparation: none shown by `git status --short --branch`
- Segment 224 roadmap commit is already merged into `origin/core/reborn`

## Goal

Prove whether the current Windows desktop installer can be built reproducibly from the repo, or document the exact blocker and official next operator/build-machine action.

This segment is not about adding auto-update, notifications, staging/prod channel separation, or release hosting. It is the build reproducibility gate before those segments.

## Required Reading

Read first:

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_224_DESKTOP_RELEASE_READINESS_ROADMAP.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `electron/README.md`

Inspect before running build:

- `package.json`
- `electron/package.json`
- `electron/app-config.json`
- `electron/generate-build-info.mjs`
- `electron/validate-production-config.mjs`
- `electron/main.js`
- `electron/preload.js`
- `.gitignore`

## Current Context

Current desktop shape:

- Electron code lives in `electron/*`;
- packaged app opens `productionUrl` from `electron/app-config.json`;
- `productionUrl` is currently `https://ax-connect.ru`;
- `build:desktop` runs `prepare:desktop:build-info`, clears `dist-desktop`, then runs `electron-builder --publish never`;
- build config in root `package.json` uses Windows NSIS target and artifact name `${productName}-Setup-${version}.${ext}`;
- `check:desktop:config` verifies only production URL and package version parity;
- previous local build attempt failed while extracting `winCodeSign` because Windows could not create symlinks:
  - `ERROR: Cannot create symbolic link : Клиент не обладает требуемыми правами`;
  - likely needs Windows Developer Mode, elevated/admin context, or CI runner ownership.

## In Scope

- verify local branch and cleanliness before changing anything;
- run the desktop config check;
- run the desktop build command on the current machine;
- capture whether the build passes or fails;
- inspect generated `dist-desktop` output if build passes;
- record installer artifact name, size, and SHA256 if build passes;
- record generated ignored files such as `electron/build-info.json` and `dist-desktop/*` as evidence only, not committed artifacts;
- if build fails, classify the blocker and document the exact error and next operator action;
- update desktop roadmap/runbook/status docs with the result;
- add/update this segment's completion notes in this brief.

## Out Of Scope

- do not implement auto-update;
- do not add `electron-updater`;
- do not configure publish providers;
- do not add native desktop notifications;
- do not add taskbar/dock badge behavior;
- do not create staging/prod desktop channel config yet;
- do not upload installers to any server;
- do not change Nginx or VPS config;
- do not change `productionUrl` or app identity in this segment;
- do not change runtime chat/auth/storage/media code;
- do not run DB migrations;
- do not resume WebRTC/media rollout;
- do not start `Next -> React/Vite` migration;
- do not commit generated installer artifacts or `electron/build-info.json`.

## Expected Work

1. Confirm repository state:

```powershell
git status --short --branch
git log --oneline -5
```

2. Verify desktop config:

```powershell
bun.cmd run check:desktop:config
```

3. Run build:

```powershell
bun.cmd run build:desktop
```

4. If build passes, inspect artifacts:

```powershell
Get-ChildItem -Path dist-desktop -Force
Get-ChildItem -Path dist-desktop -Filter *.exe -Recurse | Select-Object FullName, Length
```

5. If an installer exists, compute hash:

```powershell
Get-FileHash -Algorithm SHA256 -Path "dist-desktop\AxConnect-Setup-0.0.2.exe"
```

Adjust the path to the actual artifact name if it differs.

6. If build fails, do not hide the failure. Record:

- exact command;
- exact error summary;
- whether failure is environment/tooling/config;
- whether retry needs Developer Mode, admin terminal, cleanup of Electron builder cache, CI, or package config changes;
- whether any generated partial artifacts should be ignored or cleaned.

7. Update docs:

- `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/roadmap/STAGE_STATUS.md`.

Only update `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md` if the result changes the ordering of customer-priority desktop validation.

## Acceptance Criteria

Pass if:

- `check:desktop:config` passes;
- `build:desktop` produces a Windows NSIS installer;
- artifact name, size, and SHA256 are recorded;
- generated artifacts remain untracked/ignored;
- docs classify the official build path as ready for the next segment.

Review if:

- build succeeds only with local-machine assumptions that are not yet reproducible elsewhere;
- build produces partial artifacts but installer launch is not verified;
- docs identify a likely solution but it still needs operator action.

Blocked if:

- `build:desktop` fails;
- the cause is not fixed in-scope;
- the next action requires operator/admin/CI environment changes.

## Verification Commands

Minimum:

```powershell
git diff --check
bun.cmd run check:desktop:config
```

If package/runtime files are changed, also run:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
```

Do not claim packaged desktop runtime pass in this segment unless the installer is launched and smoke-tested. The default expectation is build reproducibility only.

## Completion Notes

Run date: `2026-06-18 19:30 +03:00`

Branch and base:

- branch: `feature/desktop-build-reproducibility-audit`;
- `HEAD`: `d4efb45c7db453f12d64d05a38ac05cbf234c3eb`;
- `origin/core/reborn`: `d4efb45c7db453f12d64d05a38ac05cbf234c3eb`;
- `origin/core/reborn` was confirmed as an ancestor of `HEAD`.

Commands:

```powershell
git status --short --branch
git log --oneline -5
bun.cmd run check:desktop:config
bun.cmd run build:desktop
```

Results:

- `git status --short --branch`: branch was `feature/desktop-build-reproducibility-audit`; docs for this segment were dirty before the build audit and were not reset.
- `git log --oneline -5`: latest commit was `d4efb45 Merge pull request #169 from Peacemaker228/feature/desktop-release-roadmap`.
- `bun.cmd run check:desktop:config`: passed; `productionUrl` is `https://ax-connect.ru`, root/electron versions are `0.0.2`.
- `bun.cmd run build:desktop`: failed before NSIS installer creation.

Exact blocker:

```text
ERROR: Cannot create symbolic link : Клиент не обладает требуемыми правами. : C:\Users\Anal\AppData\Local\electron-builder\Cache\winCodeSign\<cache-id>\darwin\10.12\lib\libcrypto.dylib
ERROR: Cannot create symbolic link : Клиент не обладает требуемыми правами. : C:\Users\Anal\AppData\Local\electron-builder\Cache\winCodeSign\<cache-id>\darwin\10.12\lib\libssl.dylib
```

Failure classification:

- environment/tooling blocker, not package/runtime config;
- `electron-builder` downloads `winCodeSign-2.6.0.7z` and invokes bundled 7-Zip with `-snld`;
- 7-Zip cannot create symlinks in the current Windows user context;
- `electron-builder` retries with new cache ids and fails consistently with exit status `2`.

Artifacts:

- no Windows NSIS installer was produced;
- artifact name/size/SHA256: not available;
- partial ignored output exists under `dist-desktop\win-unpacked`;
- `dist-desktop\builder-debug.yml` exists;
- `electron\build-info.json` exists and records `isDirty: true` because the docs/brief worktree was dirty during this audit;
- `dist-desktop/` and `electron/build-info.json` are ignored by `.gitignore` and must not be committed.

Next operator action:

1. Enable Windows symlink creation for the build context, preferably by enabling Windows Developer Mode or running the build in an elevated/admin PowerShell where the user has `Create symbolic links` privilege.
2. Clean the partial local outputs and the failed `winCodeSign` cache before retrying:

```powershell
bun.cmd run clean:desktop
Remove-Item -LiteralPath "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -Recurse -Force
bun.cmd run build:desktop
```

3. If local symlink privilege cannot be granted, move the official desktop build to a Windows CI runner with symlink support and run the same command there:

```powershell
bun.cmd run build:desktop
```

Next recommended segment:

- `desktop-build-environment-fix` or explicit operator/build-machine action before `desktop-staging-channel-config`.

## Handoff Format

Return:

- branch;
- changed files;
- whether `build:desktop` passed;
- artifact name/size/SHA256 if passed;
- exact blocker if failed;
- whether any partial generated artifacts exist;
- verification commands and results;
- next recommended segment:
  - `desktop-staging-channel-config` if build path is usable;
  - `desktop-build-environment-fix` or operator action if build is blocked.

Do not commit automatically unless explicitly asked.
