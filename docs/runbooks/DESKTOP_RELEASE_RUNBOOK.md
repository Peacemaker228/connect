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

Staging auto-update metadata path is implemented for the proof channel:

```text
/downloads/desktop/staging/win/latest.yml
/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe
/downloads/desktop/staging/win/AxConnect-Staging-Setup-<version>.exe.blockmap
```

Production auto-update metadata remains unconfigured until a production rollout segment explicitly enables it.

## Staging Auto-Update Proof

Current proof implementation:

- package/app version baseline: `0.0.3`;
- staging updater provider: generic static URL `https://staging.ax-connect.ru/downloads/desktop/staging/win/`;
- updater runtime is enabled only for packaged `staging` desktop channel;
- renderer exposes a desktop-only account-menu update action;
- renderer also shows a compact desktop-only visible restart/update control near the account controls when update status
  reaches `downloaded`;
- restart/update is explicit and only available after update status reaches `downloaded`.

Current UX behavior:

- `idle`, `not_available`, `unsupported`, and `error` remain quiet outside the account menu;
- `downloading` can show compact desktop-only progress near the account controls;
- `downloaded` shows a compact desktop-only `Restart` action near the account controls;
- the visible action calls the existing `installUpdate()` bridge and does not restart/update without an explicit user click;
- account-menu check/retry/restart remains available.

Current lifecycle hardening gap:

- the staging `0.0.3 -> 0.0.4` proof passed, and the updater flow now has focused internal hardening before prominent UX is added;
- `desktop-auto-update-flow-hardening` normalizes status states, guards concurrent checks/downloads, adds bounded packaged-staging periodic checks, preserves manual retry, and ensures missing metadata/network/download errors move to `error` instead of crashing the app or leaving the updater stuck;
- this is separate from CI/CD: CI/CD will automate building and publishing artifacts, while flow hardening makes the installed app's internal update behavior reliable.

Hardened updater lifecycle:

- statuses: `unsupported`, `idle`, `checking`, `available`, `not_available`, `downloading`, `downloaded`, `error`;
- safe fields: `currentVersion`, `updateVersion`, `channel`, `progressPercent`, `lastCheckedAt`, `lastSuccessfulCheckAt`, `lastErrorAt`, sanitized `error`, `updatedAt`;
- packaged staging periodic interval: `45` minutes;
- checks are skipped while status is `checking`, `available`, `downloading`, or `downloaded`;
- `downloaded` remains stable until explicit restart/update;
- `installUpdate()` returns safe `update_not_downloaded` unless an update is downloaded;
- account-menu retry remains available after `error` or `not_available`;
- visible update-ready UX remains desktop-only and uses the same status snapshot/subscription path as the account menu;
- production provider remains unconfigured.

Latest staging rollout evidence:

- staging desktop/web/api were rolled forward to version `0.0.5`;
- installer: `AxConnect-Staging-Setup-0.0.5.exe`;
- size: `94294597` bytes;
- SHA256: `7FB31ED52ED3431A2FD822F6822A641CCD464F60039B4A46B017706E6C48DD9B`;
- desktop build info for that rollout reported `version: "0.0.5"`, `channel: "staging"`, `commitHash: "2bf12af..."`, and `isDirty: false`.
- update-ready UX smoke later used `0.0.6 -> 0.0.7`;
- `0.0.7` installer: `AxConnect-Staging-Setup-0.0.7.exe`;
- `0.0.7` size: `94294749` bytes;
- `0.0.7` SHA256: `D1AF57AC134D6277ED17E1017914FBCCF0E74C22FEF8C94AE21C6E2F8DA2AF77`.

Latest hardening smoke result:

- no-update check returned `not_available`;
- repeated concurrent manual checks did not start a visible check/download storm;
- missing `latest.yml` moved status to `error`;
- restoring `latest.yml` allowed manual retry recovery back to `not_available`;
- later full staging desktop update/deploy completed successfully.
- visible update-ready UX smoke passed after staging web deploy: installed desktop `0.0.6` detected hosted `0.0.7`, rendered the compact `Restart` action for `downloaded` status, and completed update/restart.
- note for future remote-web desktop checks: renderer UI changes require staging web deploy; desktop installer/update artifacts alone do not update the React UI.

Local proof artifacts:

- `0.0.3` installer: `AxConnect-Staging-Setup-0.0.3.exe`, `94294315` bytes, SHA256 `6CF9EA77BD1F6DFB7AA06CE271D01DCD709508E0B17FD6892D584FFF1D977E27`;
- `0.0.3` blockmap: `184199` bytes, SHA256 `2C9774D26DC520346F5DCF23C6F5DA775D205F62538E25AB2C6BA261E35A7BBE`;
- `0.0.4` installer: `AxConnect-Staging-Setup-0.0.4.exe`, `94294272` bytes, SHA256 `3F82312FFF09641CA8E30BF69BDE2F1E58F303D180DC3D85D5774B2585D9702F`;
- `0.0.4` blockmap: `184261` bytes, SHA256 `22FB2E07566A1E55514C7DA086AE261EB3B9C70553D7C1C8B2FCE9CB88A78FB0`;
- `0.0.4` `latest.yml`: `363` bytes, SHA256 `0BFD1362322A9F5C041B1A96E28F176E8AFA82CD014DFB5276301FBBC8F25122`.

Operator proof sequence:

1. Install `AxConnect-Staging-Setup-0.0.3.exe`.
2. Confirm `window.electron.getBuildInfo()` reports `version: "0.0.3"` and `channel: "staging"`.
3. Publish `0.0.4` installer, blockmap, and `latest.yml` to `/var/www/ax-connect-desktop-downloads/desktop/staging/win/`.
4. Start installed `0.0.3`.
5. Use startup auto-check or the account-menu update action.
6. Confirm update status reaches `downloaded`.
7. Click `Restart and update`.
8. Confirm relaunched app reports `version: "0.0.4"`.

Latest operator result: `pass`. The installed staging desktop `0.0.3` detected hosted `0.0.4`, downloaded it, restarted through the explicit update action, and relaunched with `window.electron.getBuildInfo()` reporting `version: "0.0.4"`.

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
- follow-up brief exists: `docs/delegation/briefs/SEGMENT_BRIEF_231C_DESKTOP_FILE_DOWNLOAD_UX_POLISH.md`.

Desktop file download UX implementation:

- generic non-image/non-PDF attachment rows use a desktop-only controlled download bridge when running inside Electron;
- the bridge accepts only trusted renderer/configured API `/api/storage/access` `messageFile` URLs;
- files are saved to the OS Downloads directory with sanitized unique filenames;
- success feedback may offer `Show in folder`, but the app must not auto-open or execute downloaded generic/executable-like files;
- ordinary browser web, image inline preview, PDF behavior, and message copy are expected to stay unchanged;
- packaged desktop smoke for this specific UX is still required before classifying Segment 231C as pass.

Additional smoke when native features are implemented:

- native notification popup;
- notification click routes to the correct chat;
- app/taskbar/dock badge count;
- auto-update check/download/restart;
- deep link open.

## Native Notification Bridge

Current implementation status:

- native unread notifications are requested from the existing global unread decision path only after own-message, duplicate, active-read, mute, global sound, and visibility guards;
- web/non-Electron runtime does not call the native bridge;
- global notification sound off and per-chat mute suppress the native popup for this segment;
- notification text is generic and must not include raw message content, storage URLs, secrets, or backend payloads;
- Windows native notifications require the app Start Menu registration and AppUserModelID to match the active desktop
  channel app id: production `com.axconnect.desktop`, staging `com.axconnect.desktop.staging`;
- desktop active-chat suppression uses Electron window state from the narrow preload bridge:
  focused, visible, and not minimized suppresses popup/sound; minimized, hidden, or unfocused active chat can notify if not muted;
- notification click restores/focuses the existing app window and routes the renderer to the target channel or direct conversation;
- diagnostics are available through the existing unread notification debug buffer and include native sent/unsupported/failed and blocked-by-global/scope outcomes.

Required smoke before classifying native notifications as pass:

- eligible unread in another chat shows native popup;
- Windows notification settings lists the installed sender as the expected product name for the active channel;
- active visible near-bottom chat does not show native popup;
- minimized or unfocused active chat can show native popup;
- debug entries include `desktopWindowFocused`, `desktopWindowVisible`, and `desktopWindowMinimized` for desktop decisions;
- muted channel/DM does not show native popup;
- global notification sound off suppresses native popup;
- notification click focuses/restores the app and navigates to the target chat.

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

