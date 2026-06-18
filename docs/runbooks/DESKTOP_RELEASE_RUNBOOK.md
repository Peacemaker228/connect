# Desktop Release Runbook

## Status

Classification: `draft / not executable end-to-end yet`

This runbook records the intended desktop release process. It is not a completed release procedure until the roadmap segments close the current blockers.

Current audit result:

- `2026-06-18`: `bun.cmd run check:desktop:config` passed, but `bun.cmd run build:desktop` failed before producing an NSIS installer.
- blocker: `electron-builder` cannot extract `winCodeSign-2.6.0.7z` because the current Windows user cannot create symlinks.
- no `AxConnect-Setup-0.0.2.exe`, installer size, or SHA256 is available from this machine.
- partial ignored output may remain under `dist-desktop\win-unpacked` and `electron\build-info.json`.

## Current App Shape

- Desktop shell: `electron/*`
- Root package entry: `electron/main.js`
- Packaged app URL source: `electron/app-config.json`
- Current production URL: `https://ax-connect.ru`
- Default browser download path: `/downloads/AxConnect-Setup-latest.exe`
- Build output directory: `dist-desktop`
- Current installer target: Windows NSIS

## Current Commands

Local PowerShell:

```powershell
git status --short --branch
bun.cmd run check:desktop:config
bun.cmd run build:desktop
```

Known caution:

- this local Windows build currently fails because the user cannot create symlinks while `electron-builder` extracts signing helper artifacts;
- the official release path must either run on a Windows machine with symlink privilege or move to CI.

PowerShell cleanup before retry:

```powershell
bun.cmd run clean:desktop
Remove-Item -LiteralPath "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -Recurse -Force
```

Retry only after Windows Developer Mode is enabled, the shell is elevated with symlink privilege, or the command is moved to a Windows CI runner:

```powershell
bun.cmd run build:desktop
```

Current blocked audit:

- `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`
- do not treat this runbook as executable until a symlink-capable Windows build path produces the NSIS installer and records artifact name, size, and SHA256.

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

Do not let staging update metadata update production installs, and do not let production update metadata update staging installs.

## Artifact Model

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

