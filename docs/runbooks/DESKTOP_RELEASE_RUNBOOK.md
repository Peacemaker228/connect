# Desktop Release Runbook

## Status

Classification: `draft / staging artifact hosting runbook prepared, operator apply pending`

This runbook records the intended desktop release process. It is not a completed release procedure until the roadmap segments close the current blockers.

Current audit result:

- `2026-06-18`: `bun.cmd run check:desktop:config` passed.
- Initial `bun.cmd run build:desktop` failed before producing an NSIS installer because `electron-builder` could not extract `winCodeSign-2.6.0.7z` without Windows symlink privilege.
- After the operator used a symlink-capable Windows build context, `bun.cmd run build:desktop` produced a local installer.
- installer: `dist-desktop\AxConnect-Setup-0.0.2.exe`;
- installer size: `175305456` bytes;
- SHA256: `B307A4BFB96BABB655D13855B6A0ADC61715F6F996F182CCCBCF74D347483FDF`;
- partial/generated output remains ignored under `dist-desktop\*` and `electron\build-info.json`.

## Current App Shape

- Desktop shell: `electron/*`
- Root package entry: `electron/main.js`
- Packaged app URL source: `electron/app-config.json`
- Current production URL: `https://ax-connect.ru`
- Current staging URL: `https://staging.ax-connect.ru`
- Default browser download path: `/downloads/AxConnect-Setup-latest.exe`
- Build output directory: `dist-desktop`
- Current installer target: Windows NSIS

## Current Commands

Local PowerShell:

```powershell
git status --short --branch
bun.cmd run check:desktop:config
bun.cmd run check:desktop:production-config
bun.cmd run check:desktop:staging-config
bun.cmd run build:desktop
bun.cmd run build:desktop:staging
```

Known caution:

- this local Windows build fails without symlink privilege while `electron-builder` extracts signing helper artifacts;
- local builds require Windows Developer Mode, an elevated shell/user with `Create symbolic links` privilege, or a Windows CI runner with symlink support;
- the official release path should still move to CI/CD once staging/prod channel and artifact hosting are defined.

PowerShell cleanup before retry:

```powershell
bun.cmd run clean:desktop
Remove-Item -LiteralPath "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -Recurse -Force
```

Retry only after Windows Developer Mode is enabled, the shell is elevated with symlink privilege, or the command is moved to a Windows CI runner:

```powershell
bun.cmd run build:desktop
```

Current build audit:

- `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`
- local installer build has been reproduced on a symlink-capable Windows build context;
- do not treat this runbook as executable end-to-end until staging/prod channels, artifact hosting, runtime smoke, signing, rollback, and update metadata are implemented and verified.

## Release Channels

Planned channels:

- `staging`
- `production`

Candidate separation:

- staging product name: `AxConnect Staging`
- production product name: `AxConnect`
- staging app id: `com.axconnect.desktop.staging`
- production app id: `com.axconnect.desktop`
- staging renderer URL: `https://staging.ax-connect.ru`
- production renderer URL: `https://ax-connect.ru`
- staging artifact name: `AxConnect-Staging-Setup-<version>.exe`
- production artifact name: `AxConnect-Setup-<version>.exe`

Do not let staging update metadata update production installs, and do not let production update metadata update staging installs.

Implemented local channel commands:

```powershell
bun.cmd run check:desktop:production-config
bun.cmd run build:desktop
```

```powershell
bun.cmd run check:desktop:staging-config
bun.cmd run build:desktop:staging
```

Latest staging build evidence:

- installer: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- size: `175306350` bytes;
- SHA256: `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- generated `latest.yml`, blockmap, `builder-debug.yml`, `dist-desktop\win-unpacked`, and `electron\build-info.json` are local ignored outputs only.

## Artifact Model

Staging artifact hosting decision:

- serve installer files through an Nginx static alias outside the app repository;
- do not put installers under the Next `public` directory or commit them to the repo;
- staging filesystem root: `/var/www/ax-connect-desktop-downloads/`;
- staging public URL prefix: `https://staging.ax-connect.ru/downloads/`;
- this segment prepares the runbook only; upload, Nginx reload, and staging web rebuild/restart are operator actions.

Planned versioned artifacts:

```text
/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe
/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.sha256

/downloads/desktop/production/win/AxConnect-Setup-<version>.exe
/downloads/desktop/production/win/AxConnect-Setup-latest.exe
/downloads/desktop/production/win/AxConnect-Setup-<version>.sha256
```

Auto-update metadata paths are intentionally deferred until the updater provider is implemented.

## Staging Installer Download Hosting

Current staging installer evidence:

- installer: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- size: `175306350` bytes;
- SHA256: `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`.

Final staging paths:

```text
/var/www/ax-connect-desktop-downloads/
  desktop/
    staging/
      win/
        AxConnect-Staging-Setup-0.0.2.exe
        AxConnect-Staging-Setup-latest.exe
        AxConnect-Staging-Setup-0.0.2.sha256
```

Final staging URLs:

```text
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
```

Staging web env value:

```env
NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
```

`NEXT_PUBLIC_*` values are compiled into the web bundle, so changing this value on staging requires a staging web rebuild/restart. Do not run that against the active staging server until the operator approves the maintenance window.

Local PowerShell artifact check:

```powershell
$installer = Get-Item -LiteralPath '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe'
$installer | Select-Object FullName, Length
Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName
```

Local PowerShell upload preparation:

```powershell
$installer = Get-Item -LiteralPath '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe'
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName).Hash
Set-Content -LiteralPath '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.sha256' -Value "$hash  AxConnect-Staging-Setup-0.0.2.exe" -Encoding ascii
$StagingSshTarget = 'connect-staging'
scp '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.exe' "$StagingSshTarget`:/tmp/AxConnect-Staging-Setup-0.0.2.exe"
scp '.\dist-desktop\AxConnect-Staging-Setup-0.0.2.sha256' "$StagingSshTarget`:/tmp/AxConnect-Staging-Setup-0.0.2.sha256"
```

VPS Bash publish commands, operator only:

```bash
set -euo pipefail

sudo install -d -m 0755 -o deploy -g www-data /var/www/ax-connect-desktop-downloads/desktop/staging/win

sudo install -m 0644 -o deploy -g www-data /tmp/AxConnect-Staging-Setup-0.0.2.exe /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
cd /var/www/ax-connect-desktop-downloads/desktop/staging/win
cp -f AxConnect-Staging-Setup-0.0.2.exe AxConnect-Staging-Setup-latest.exe
sha256sum AxConnect-Staging-Setup-0.0.2.exe > AxConnect-Staging-Setup-0.0.2.sha256
sudo chown -R deploy:www-data /var/www/ax-connect-desktop-downloads
sudo find /var/www/ax-connect-desktop-downloads -type d -exec chmod 0755 {} \;
sudo find /var/www/ax-connect-desktop-downloads -type f -exec chmod 0644 {} \;
sudo -u www-data test -r AxConnect-Staging-Setup-latest.exe
```

Before changing Nginx, collect the diagnosis evidence in `docs/delegation/briefs/SEGMENT_BRIEF_228A_DESKTOP_STAGING_DOWNLOAD_NGINX_ROUTE_DIAGNOSIS.md`. Do not assume the static alias is the only possible problem: first verify files, ownership, permissions, active server block, enabled config, and route matching.

Candidate Nginx static alias to add only if diagnosis proves the active `staging.ax-connect.ru` HTTPS server block is missing or misplacing the download route. This location must be placed before the generic Next proxy/auth location so `/downloads/desktop/*` is served by Nginx directly and cannot be redirected to `/sign-in`.

```nginx
location ^~ /downloads/desktop/ {
    alias /var/www/ax-connect-desktop-downloads/desktop/;
    default_type application/octet-stream;
    add_header X-Content-Type-Options nosniff always;
    autoindex off;
}
```

VPS Bash Nginx validation/reload, operator only:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

VPS Bash staging env update, operator only:

```bash
set -euo pipefail

sudo cp /etc/ax-connect-staging/web.env /etc/ax-connect-staging/web.env.bak.$(date +%Y%m%d%H%M%S)
if sudo grep -q '^NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=' /etc/ax-connect-staging/web.env; then
  sudo sed -i 's#^NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=.*#NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe#' /etc/ax-connect-staging/web.env
else
  echo 'NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe' | sudo tee -a /etc/ax-connect-staging/web.env >/dev/null
fi
```

VPS Bash staging web rebuild/restart, operator only:

```bash
set -euo pipefail

cd /var/www/ax-connect-staging
bun install
bun run build:web
pm2 status
STAGING_PM2_PROCESS="replace-with-staging-pm2-process-name"
pm2 restart "$STAGING_PM2_PROCESS"
```

Use the real staging PM2 process name from `pm2 status`; do not restart production by mistake.

VPS Bash verification after operator publish, operator only:

```bash
set -euo pipefail

test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe
test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
test -f /var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256

curl -I https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
curl -fsS https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256

curl -fsS -o /tmp/AxConnect-Staging-Setup-latest.exe https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
echo '794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164  /tmp/AxConnect-Staging-Setup-latest.exe' | sha256sum -c -
```

Manual web verification after staging web rebuild:

- open `https://staging.ax-connect.ru`;
- confirm the desktop download button link is `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
- download the installer and compare SHA256 with `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- do not claim packaged desktop runtime smoke until the dedicated runtime smoke segment.

Applied staging evidence from 2026-06-18:

- versioned installer was uploaded to `/var/www/ax-connect-desktop-downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe`;
- `AxConnect-Staging-Setup-latest.exe` was published as the stable download target;
- `AxConnect-Staging-Setup-0.0.2.sha256` was generated on the VPS;
- `www-data` read access was confirmed;
- active Nginx HTTPS server block for `staging.ax-connect.ru` includes `location ^~ /downloads/desktop/` before the generic web proxy;
- `GET` and `HEAD` for `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` returned `200 OK`;
- downloaded latest installer SHA256 matched `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- browser download and Windows installation were confirmed by the operator;
- packaged desktop runtime smoke is still pending and must be handled by Segment 229.

Rollback before auto-update:

```bash
set -euo pipefail

PREVIOUS_VERSION="replace-with-previous-version"
cd /var/www/ax-connect-desktop-downloads/desktop/staging/win
sudo cp -f "AxConnect-Staging-Setup-${PREVIOUS_VERSION}.exe" AxConnect-Staging-Setup-latest.exe
sudo chown www-data:www-data AxConnect-Staging-Setup-latest.exe
sudo chmod 0644 AxConnect-Staging-Setup-latest.exe
curl -I https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
```

Keep versioned files for audit. Rollback only repoints the `latest` copy unless the operator intentionally removes a bad versioned artifact.

## Manual Release Order

Future release order:

1. Confirm source branch and commit.
2. Confirm package version and desktop build info.
3. Run web/API/type checks if renderer behavior changed.
4. Run `check:desktop:config`.
5. Build desktop installer.
6. Record artifact name, size, and SHA256.
7. Upload versioned artifact.
8. Update latest artifact pointer/copy.
9. Update auto-update metadata when updater exists.
10. Verify web download button.
11. Install on a clean Windows machine.
12. Run packaged desktop smoke.
13. Publish user-facing release note.

This order is not yet fully executable because artifact hosting, updater metadata, and official build environment are not implemented.

## Required Desktop Smoke

Minimum smoke before a staging desktop release candidate:

- launch packaged app;
- login;
- reload/restart app and keep session;
- idle recovery check;
- channel message send;
- direct message send;
- unread badge and sound toggle;
- per-chat mute;
- `@user` / `@all` mention send and display;
- reply create/cancel/navigation;
- screenshot paste;
- generic file download/open;
- message copy;
- clickable external link;
- app resize and theme switch;
- logout.

Current staging evidence:

- `AxConnect Staging` installer `0.0.2` was downloaded, installed, and manually smoke-tested by the operator on Windows;
- no critical runtime blockers were found in the installed app;
- known UX issue: generic non-image/non-PDF file open/download in Electron can open an extra window/native save flow without clear completion state; keep this as `review / UX issue` for a later desktop file-download UX segment, not as a blocker for the first staging desktop runtime smoke.

Additional smoke when native features are implemented:

- native notification popup;
- notification click routes to the correct chat;
- app/taskbar/dock badge count;
- auto-update check/download/restart;
- deep link open.

## Rollback

Before updater:

- keep the previous versioned installer available;
- restore `latest` artifact to previous version if the new installer is bad;
- announce reinstall instructions if needed.

After updater:

- keep previous update metadata/artifacts;
- know how to repoint metadata to previous stable version;
- document whether downgrade is supported or requires reinstall.

## Security Checklist

Before production pilot:

- review preload bridge methods and origin checks;
- review external link behavior;
- review permission handlers for camera, microphone, display capture, notifications, fullscreen;
- review `sandbox` decision;
- verify no secrets are bundled into Electron artifacts;
- verify app config contains only public URLs;
- decide code signing path.

