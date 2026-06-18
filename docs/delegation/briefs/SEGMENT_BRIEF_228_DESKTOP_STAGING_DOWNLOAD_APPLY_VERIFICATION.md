# Segment 228. Desktop Staging Download Apply Verification

## Classification

- segment: `desktop-staging-download-apply-verification`
- type: `desktop release / staging artifact hosting apply and verification`
- status: `blocked / staging downloads still route through web auth`
- target branch: `feature/desktop-staging-download-apply-verification`
- source branch: latest `origin/core/reborn` after Segment 227 is merged

## Repository State At Brief Creation

- `origin/core/reborn` was fetched on `2026-06-18`;
- latest `origin/core/reborn` includes Segment 227 (`docs(desktop): add artifact download runbook`);
- this brief branch was created from latest `origin/core/reborn`;
- upstream tracking was explicitly removed from the feature branch after creation.

## Goal

Apply the staging desktop installer download runbook and record redacted evidence that a user can download the staging installer from the staging web app.

This segment closes the operator-pending part of Segment 227. It must not claim packaged desktop runtime smoke.

## Required Reading

Read first:

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/ax-connect_runbook.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_226_DESKTOP_STAGING_CHANNEL_CONFIG.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_227_DESKTOP_ARTIFACT_DOWNLOAD_RUNBOOK.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`

Selected rules rationale:

- `rules/rules.md`: required for senior engineering baseline and no assumptions without inspection.
- `rules/for-brief.md`: required because this segment will produce operator commands and a follow-up handoff.
- `rules/review/mini-review.md`: required because the segment verifies another runbook and must not overclaim.
- `rules/architecture-docs.md`: required because this is docs/runbook/status work plus staging operator evidence.

## Current Context

- Segment 226 produced the staging installer:
  - `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
  - size `175306350` bytes;
  - SHA256 `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`.
- Segment 227 documented the staging hosting model:
  - filesystem root: `/var/www/ax-connect-desktop-downloads/`;
  - URL prefix: `https://staging.ax-connect.ru/downloads/`;
  - versioned installer: `/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe`;
  - latest installer: `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
  - SHA file: `/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256`.
- Operator has already reported that staging env cleanup was completed:
  - repo `/var/www/ax-connect-staging/.env.production` removed to quarantine;
  - `STORAGE_*` names are present in `/etc/ax-connect-staging/api.env`;
  - `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` is present in `/etc/ax-connect-staging/web.env`;
  - staging API/web restart and web rebuild were reported as successful.
- This segment still must verify the download hosting path and document only redacted/non-secret evidence.

## Files To Inspect First

- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/ax-connect_runbook.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/roadmap/STAGE_STATUS.md`
- `src/lib/shared/utils/desktop-download.ts`
- `src/lib/shared/features/desktop-download-button.tsx`
- `electron-builder.staging.json`
- `electron/app-config.json`
- `package.json`

## In Scope

- verify the local staging installer artifact still exists and matches Segment 226 SHA256;
- prepare or rerun local PowerShell upload commands for the installer and `.sha256` file;
- guide the operator through VPS Bash publish commands;
- apply or verify the Nginx static alias under the `staging.ax-connect.ru` HTTPS server block;
- verify HTTPS download returns the installer;
- verify SHA256 of the downloaded `latest` installer;
- verify the staging web download button points to `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL`;
- update docs with redacted run report evidence.

## Out Of Scope

- do not implement auto-update or Electron update metadata;
- do not implement native desktop notifications;
- do not install/run the packaged desktop app as a runtime smoke in this segment;
- do not change Electron packaging identity;
- do not change application runtime code unless a blocker proves the web download button cannot point to the configured URL;
- do not reset staging data;
- do not run DB migrations;
- do not change production server, production downloads, production env, or production Nginx;
- do not expose secrets, cookies, auth headers, database URLs, storage keys, or private IPs in docs;
- do not commit installer binaries, `.sha256` files, `dist-desktop/*`, or `electron/build-info.json`.

## Expected Operator Flow

Local PowerShell, from `D:\Projects\connect`:

```powershell
$installer = Get-Item -LiteralPath '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe'
$installer | Select-Object FullName, Length
Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName).Hash
Set-Content -LiteralPath '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.sha256' -Value "$hash  AxConnect-Staging-Setup-0.0.2.exe" -Encoding ascii

$StagingSshTarget = 'connect-staging'
scp '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe' "$StagingSshTarget`:/tmp/AxConnect-Staging-Setup-0.0.2.exe"
scp '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.sha256' "$StagingSshTarget`:/tmp/AxConnect-Staging-Setup-0.0.2.sha256"
```

VPS Bash:

```bash
set -euo pipefail

sudo install -d -m 0755 -o www-data -g www-data /var/www/ax-connect-desktop-downloads/desktop/staging/win

sudo install -m 0644 -o www-data -g www-data /tmp/AxConnect-Staging-Setup-0.0.2.exe /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
sudo install -m 0644 -o www-data -g www-data /tmp/AxConnect-Staging-Setup-0.0.2.sha256 /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
sudo cp -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
sudo chown www-data:www-data /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
sudo chmod 0644 /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
```

Nginx location to verify or add inside the `staging.ax-connect.ru` HTTPS server block. This location must be placed before the generic Next proxy/auth location so `/downloads/desktop/*` is served by Nginx directly and cannot be redirected to `/sign-in`.

```nginx
location ^~ /downloads/desktop/ {
    alias /var/www/ax-connect-desktop-downloads/desktop/;
    default_type application/octet-stream;
    add_header X-Content-Type-Options nosniff always;
    autoindex off;
}
```

VPS Bash validation:

```bash
sudo nginx -t
sudo systemctl reload nginx

test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256

curl -I https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
curl -fsS https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256

curl -fsS -o /tmp/AxConnect-Staging-Setup-latest.exe https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
echo '794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164  /tmp/AxConnect-Staging-Setup-latest.exe' | sha256sum -c -
```

Browser verification:

- open `https://staging.ax-connect.ru`;
- check that the desktop download button link resolves to `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
- download the installer;
- confirm local downloaded file SHA256 matches `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- do not install/run it as runtime smoke in this segment unless the user explicitly expands scope.

## Acceptance Criteria

Pass if:

- versioned installer and latest installer exist on the staging VPS;
- SHA256 file exists on the staging VPS;
- `curl -I` for the latest installer returns `200` or another explicitly understood successful static response;
- downloaded latest installer hash matches `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- staging web button points to the configured latest installer URL;
- docs record redacted evidence and do not expose secrets;
- generated binaries and SHA files remain untracked.

Review if:

- static HTTPS download works but browser button verification is deferred;
- operator applied upload but did not provide enough evidence to classify pass;
- staging env was already applied before the segment and only verified by key names/non-secret output.

Blocked if:

- local installer artifact is missing or hash mismatches;
- Nginx static location cannot be applied safely;
- HTTPS download does not return the installer;
- staging web still points to fallback `/downloads/AxConnect-Setup-latest.exe` after rebuild.

## Verification Commands

Repository-side:

```powershell
git status --short --branch
git diff --check
bun.cmd run check:desktop:staging-config
git status --ignored --short dist-desktop electron/build-info.json
git ls-files dist-desktop electron/build-info.json
```

If any runtime/web code changes are made unexpectedly:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
```

## Docs To Update

- `docs/delegation/briefs/SEGMENT_BRIEF_228_DESKTOP_STAGING_DOWNLOAD_APPLY_VERIFICATION.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md` only if the operator flow needs correction
- `docs/ax-connect_runbook.md` only if the live staging operator commands need correction

## Handoff Format

Return:

- branch and upstream status;
- changed files;
- whether server upload/Nginx/env/web rebuild was applied or only verified from operator evidence;
- local artifact path, size, SHA256;
- VPS file paths verified;
- HTTPS URL and response status;
- downloaded file SHA256 verification result;
- browser button URL verification result;
- generated/untracked artifact status;
- explicit statement that packaged desktop runtime smoke was or was not run;
- next recommended segment, expected to be `desktop-runtime-smoke-pass`.

Do not commit automatically unless explicitly asked.

## Verification Result

Status: `blocked / staging downloads still route through web auth`

Branch/base evidence:

- branch: `feature/desktop-staging-download-apply-verification`;
- branch `HEAD` equals latest `origin/core/reborn` at `552a881c35609684748026de955efdf72b0e2140`;
- latest `origin/core/reborn` includes Segment 227 via `552a881 Merge pull request #172 from Peacemaker228/feature/desktop-artifact-download-runbook`.

Local artifact evidence:

- local installer exists: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- size: `175306350` bytes;
- SHA256: `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- local generated SHA file prepared at `dist-desktop\AxConnect-Staging-Setup-0.0.2.sha256`;
- generated `dist-desktop/*` and `electron/build-info.json` remain untracked/ignored and must not be committed.

Public HTTPS verification:

```text
GET/HEAD https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
HTTP/1.1 307 Temporary Redirect
location: /sign-in?redirect_url=%2Fdownloads%2Fdesktop%2Fstaging%2Fwin%2FAxConnect-Staging-Setup-latest.exe
```

```text
GET/HEAD https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
HTTP/1.1 307 Temporary Redirect
location: /sign-in?redirect_url=%2Fdownloads%2Fdesktop%2Fstaging%2Fwin%2FAxConnect-Staging-Setup-0.0.2.exe
```

```text
GET/HEAD https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
HTTP/1.1 307 Temporary Redirect
location: /sign-in?redirect_url=%2Fdownloads%2Fdesktop%2Fstaging%2Fwin%2FAxConnect-Staging-Setup-0.0.2.sha256
```

Following redirects downloads the sign-in HTML page, not the installer:

```text
downloaded latest URL bytes: 26273
expected installer bytes: 175306350
downloaded latest URL SHA256: 86D4CA68CE8B4F12DEA610317B154B4DC3D20B20F3E8859F7B7D3E8C6B5B67AA
first bytes: 3C 21 44 4F 43 54 59 50 45 20 68 74 6D 6C 3E 3C
```

Following the `.sha256` URL downloads sign-in HTML too:

```text
downloaded .sha256 URL bytes: 26279
contains expected hash: false
first line starts with: <!DOCTYPE html>
```

Browser/web button verification:

- staging HTML contains `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
- staging HTML does not contain fallback `/downloads/AxConnect-Setup-latest.exe`;
- this verifies the web env/button side only;
- clicking the button would still hit the blocked HTTPS download path above.

What was not done:

- no SSH/server command was executed from the repo agent;
- no production path was touched;
- no DB migration, auth/storage/media runtime change, auto-update, native notification work, or packaged desktop runtime smoke was performed.

Blocker:

- the staging `/downloads/desktop/` path is still handled by the web app/auth middleware instead of an Nginx static alias, or the alias is not taking precedence in the `staging.ax-connect.ru` HTTPS server block.

Next operator action:

1. On the staging VPS, verify that these files exist:
   - `/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe`;
   - `/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
   - `/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256`.
2. Ensure the `staging.ax-connect.ru` HTTPS server block contains a higher-priority static location for `/downloads/desktop/` before the generic Next proxy/auth path:

```nginx
location ^~ /downloads/desktop/ {
    alias /var/www/ax-connect-desktop-downloads/desktop/;
    default_type application/octet-stream;
    add_header X-Content-Type-Options nosniff always;
    autoindex off;
}
```

3. Run operator-only VPS Bash:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
curl -fsS https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
curl -fsS -o /tmp/AxConnect-Staging-Setup-latest.exe https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
echo '794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164  /tmp/AxConnect-Staging-Setup-latest.exe' | sha256sum -c -
```

4. Re-run this segment's public HTTPS verification before starting packaged desktop runtime smoke.
