# Segment 227. Desktop Artifact Download Runbook

## Classification

- segment: `desktop-artifact-download-runbook`
- type: `desktop release / artifact hosting and operator runbook`
- status: `review / runbook prepared; operator upload pending`
- target branch: `feature/desktop-artifact-download-runbook`
- source branch: latest `origin/core/reborn` after Segment 226 is merged

## Repository State At Brief Creation

- brief prepared from stacked branch: `feature/desktop-artifact-download-runbook-brief`
- parent branch at preparation: `feature/desktop-staging-channel-config`
- worktree at preparation: clean
- Segment 226 was committed locally as `c8f2098 feat(desktop): add staging channel build config`, but was not yet visible in `origin/core/reborn` during initial brief preparation.

Before implementation starts, merge Segment 226 into `core/reborn`, fetch, then create the implementation branch from latest `origin/core/reborn`.

Implementation start evidence:

- `origin/core/reborn` was fetched on `2026-06-18`;
- latest `origin/core/reborn` includes `93c70d0 Merge pull request #171 from Peacemaker228/feature/desktop-staging-channel-config`;
- Segment 226 commit `c8f2098 feat(desktop): add staging channel build config` is therefore in latest `origin/core/reborn`;
- implementation branch `feature/desktop-artifact-download-runbook` was created from `origin/core/reborn` at `93c70d0df256fdfb823ed06c37c3d872eebc6d24`.

## Goal

Make staging desktop installer download real and repeatable for users without implementing auto-update yet.

This segment should define and, if approved by the operator, prepare the artifact hosting/download path for the staging desktop installer:

- versioned installer path;
- latest installer path;
- SHA256 publication;
- staging web `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL`;
- Nginx/static hosting ownership;
- rollback to the previous installer;
- browser download verification.

## Required Reading

Read first:

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_226_DESKTOP_STAGING_CHANNEL_CONFIG.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/ax-connect_runbook.md`
- `electron/README.md`

Selected rules rationale:

- `rules/rules.md`: senior engineering baseline and no assumptions without inspection.
- `rules/for-brief.md`: required because this work may produce operator handoff commands and follow-up briefs.
- `rules/review/mini-review.md`: required for merge readiness and checking generated/uploaded artifact claims.
- `rules/architecture-docs.md`: required because this segment updates release/runbook/status docs and deployment ownership.

## Files To Inspect First

- `src/lib/shared/features/desktop-download-button.tsx`
- `src/lib/shared/utils/desktop-download.ts`
- `messages/en/*`
- `messages/ru/*`
- `electron/README.md`
- `electron-builder.staging.json`
- `electron/app-config.json`
- `package.json`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/ax-connect_runbook.md`

If operator/server commands are prepared, inspect the current staging deploy layout from docs before writing commands:

- staging app path: `/var/www/ax-connect-staging`;
- staging web env path: `/etc/ax-connect-staging/web.env`;
- staging app currently serves real users and must not be treated as disposable.

## Current Context

- Segment 226 created a staging desktop build command: `bun.cmd run build:desktop:staging`.
- Latest local staging installer evidence from Segment 226:
  - `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
  - size `175306350` bytes;
  - SHA256 `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`.
- Existing web download button reads `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` and falls back to `/downloads/AxConnect-Setup-latest.exe`.
- Planned artifact model in the runbook already names:
  - `/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe`;
  - `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
  - `/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.sha256`.
- Auto-update metadata is intentionally deferred.

## In Scope

- decide the staging artifact hosting path and document it;
- decide whether staging downloads are served by Nginx static alias or by the Next public directory, with a clear preference and trade-off;
- define local PowerShell commands to collect installer size and SHA256;
- define VPS Bash commands to create the static directory, upload/copy installer, publish versioned/latest files, and publish SHA256;
- define staging `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` value;
- define required web rebuild/restart step if `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` changes;
- define verification commands for:
  - static file exists on VPS;
  - HTTPS download returns `200`;
  - SHA256 file matches;
  - web button URL points to the expected latest artifact;
- define rollback commands to repoint latest to the previous installer;
- update docs and, only if necessary, small web config/defaults for the download URL.

## Out Of Scope

- do not implement auto-update or `electron-updater`;
- do not publish update metadata for Electron updater;
- do not implement native notifications;
- do not change desktop packaging identity;
- do not rebuild or alter the staging app unless the operator explicitly approves the env/download URL deploy step;
- do not reset staging data;
- do not run DB migrations;
- do not change auth/storage/media/WebRTC runtime behavior;
- do not upload installers to production paths;
- do not expose secrets in docs;
- do not commit installer binaries, SHA files, `dist-desktop/*`, or `electron/build-info.json`.

## Expected Implementation Shape

Prefer static file serving outside the app repo build output.

Recommended staging shape:

```text
/var/www/ax-connect-desktop-downloads/
  desktop/
    staging/
      win/
        AxConnect-Staging-Setup-0.0.2.exe
        AxConnect-Staging-Setup-latest.exe
        AxConnect-Staging-Setup-0.0.2.sha256
```

Recommended public URLs:

```text
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
```

Recommended staging web env:

```env
NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
```

Nginx static alias is preferred over serving large installers through the Next app process. If the agent chooses a different approach, document why and what risk it creates.

## Operator Safety

If server commands are included, split them clearly by shell:

- local Windows PowerShell commands;
- VPS Bash commands.

Do not provide ambiguous mixed-shell command blocks.

Do not run server commands from the repo agent unless explicitly requested. The operator may run them manually and return redacted evidence.

## Acceptance Criteria

Pass if:

- artifact path model is final for staging;
- staging `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` is defined;
- operator commands are PowerShell-safe locally and Bash-safe on VPS;
- rollback path is documented;
- docs say whether the segment actually uploaded/served the installer or only prepared the runbook;
- if upload is executed, HTTPS URL returns the expected installer and SHA256 evidence matches;
- generated binaries/hash files remain untracked and are not committed.

Review if:

- runbook is complete but operator has not uploaded the artifact yet;
- web env value is defined but staging web rebuild/restart is intentionally deferred;
- Nginx alias shape is documented but not applied.

Blocked if:

- staging static hosting path cannot be selected safely;
- current Nginx/staging layout is unknown enough that commands would be unsafe;
- installer artifact is missing or hash does not match Segment 226 evidence.

## Verification Commands

Local PowerShell:

```powershell
git status --short --branch
bun.cmd run check:desktop:staging-config
$installer = Get-ChildItem -Path dist-desktop -Filter 'AxConnect-Staging-Setup-*.exe' -Recurse | Select-Object -First 1
$installer | Select-Object FullName, Length
Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName
```

If runtime/web code changes:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
bun.cmd run check:desktop:staging-config
```

VPS Bash verification examples, only after operator-approved upload/static config:

```bash
curl -I https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
curl -fsS https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
```

## Manual Smoke

If artifact hosting is applied:

- open staging web in a browser;
- confirm the desktop download button resolves to `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
- download the installer;
- compare downloaded file hash with the published SHA256;
- do not claim packaged desktop runtime smoke until Segment 228.

## Docs To Update

- `docs/delegation/briefs/SEGMENT_BRIEF_227_DESKTOP_ARTIFACT_DOWNLOAD_RUNBOOK.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/roadmap/STAGE_STATUS.md`
- `electron/README.md` if desktop artifact commands change
- `docs/ax-connect_runbook.md` only if the staging server static path/Nginx ownership becomes part of the current operator runbook

## Handoff Format

Return:

- branch and upstream status;
- changed files;
- whether this was docs-only, runbook-only, or operator-applied;
- final staging artifact paths;
- local installer artifact name/size/SHA256 used;
- local PowerShell commands;
- VPS Bash commands if prepared;
- whether upload/static hosting was applied;
- verification results;
- rollback instructions;
- generated/untracked artifact status;
- next recommended segment, expected to be `desktop-runtime-smoke-pass` if download hosting is usable.

Do not commit automatically unless explicitly asked.

## Implementation Result

Status: `review / runbook prepared; operator upload pending`

Changed docs:

- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/ax-connect_runbook.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/delegation/briefs/SEGMENT_BRIEF_227_DESKTOP_ARTIFACT_DOWNLOAD_RUNBOOK.md`.

No runtime/web/API/Electron code was changed.

Final staging artifact hosting decision:

- serve staging desktop installers through Nginx static alias, outside the app repo;
- filesystem root: `/var/www/ax-connect-desktop-downloads/`;
- URL prefix: `https://staging.ax-connect.ru/downloads/`;
- no Next `public` directory installer storage;
- no auto-update metadata in this segment.

Final staging paths:

```text
/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
```

Final staging URLs:

```text
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
```

Final staging web env:

```env
NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
```

Local installer evidence rechecked:

- artifact: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- size: `175306350` bytes;
- SHA256: `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`.

Operator status:

- artifact upload was not executed;
- Nginx static alias was not applied;
- staging web env was not changed;
- staging web rebuild/restart was not executed;
- browser download verification was not executed;
- packaged desktop runtime smoke was not executed.

Verification run locally:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath .\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe
bun.cmd run check:desktop:staging-config
git diff --check
```

Generated local outputs remain uncommitted:

```text
dist-desktop\AxConnect-Staging-Setup-0.0.2.exe
dist-desktop\AxConnect-Staging-Setup-0.0.2.exe.blockmap
dist-desktop\latest.yml
dist-desktop\builder-debug.yml
dist-desktop\win-unpacked\
```

Next operator action:

1. Upload the local installer and SHA file to the staging VPS using the PowerShell upload commands from `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`.
2. Apply the documented Nginx static alias in the `staging.ax-connect.ru` server block.
3. Set `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` in `/etc/ax-connect-staging/web.env`.
4. Rebuild/restart only the staging web app after confirming the real staging PM2 process name.
5. Verify HTTPS download, SHA256, and web button link.
