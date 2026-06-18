# Desktop Release Roadmap

## Purpose

This document owns the desktop release track for AxConnect.

The product direction is `desktop-first`, but the current desktop implementation is still a thin Electron shell over the web app. That is acceptable for the first releasable desktop line, but only if release, update, notification, packaging, and smoke-test ownership are made explicit.

This roadmap exists so desktop work is shipped as bounded segments instead of ad hoc fixes inside customer chat tasks.

## Current Classification

- desktop product direction: `primary / desktop-first`
- current implementation: `Electron remote-web shell`
- desktop release readiness: `blocked / planning started`
- desktop staging release candidate: `not ready`
- desktop auto-update: `not implemented`
- native desktop notifications: `not implemented`
- desktop runtime smoke: `not complete`
- link previews and other lower-priority polish: `deferred until desktop release validation`

## Source Of Truth

Read together:

- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `electron/README.md`

## Current Inventory

Current code shape:

- desktop code lives in `electron/*`, not yet in a real `apps/desktop` package;
- root `package.json` points `main` to `electron/main.js`;
- packaged desktop opens the channel-selected URL from `electron/app-config.json`;
- default production `productionUrl` is `https://ax-connect.ru`;
- staging packaged builds select `https://staging.ax-connect.ru`;
- dev desktop opens `http://localhost:3005`;
- the desktop app is a remote web shell, not a locally bundled renderer;
- `DesktopDownloadButton` exists and defaults to `/downloads/AxConnect-Setup-latest.exe`;
- `check:desktop:config` verifies the production channel config;
- `check:desktop:staging-config` verifies the staging channel config;
- `build:desktop` exists through `electron-builder` for production;
- `build:desktop:staging` exists through `electron-builder.staging.json`;
- `release:desktop` currently runs config check plus desktop build;
- preload exposes a small bridge: external links, clipboard text, build info, renderer-ready, auth session callback;
- Electron main process handles deep links, camera/mic/display permissions, screen source picker, clipboard writes, and external URL opening;
- there is no updater, no publish provider, no native notification bridge, no taskbar/dock badge bridge, and no release artifact hosting contract.

Current local build result:

- Windows desktop packaging was revalidated on `2026-06-18` in `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`.
- The first attempt failed while extracting `winCodeSign-2.6.0.7z` because the Windows user could not create symlinks for `libcrypto.dylib` and `libssl.dylib`.
- After the operator used a symlink-capable Windows build context, `bun.cmd run build:desktop` produced `dist-desktop\AxConnect-Setup-0.0.2.exe`.
- Installer size: `175305456` bytes.
- SHA256: `B307A4BFB96BABB655D13855B6A0ADC61715F6F996F182CCCBCF74D347483FDF`.
- This proves the local build path on the configured machine, but official CI/CD release automation is still not implemented.

## Product Requirements

The desktop release must support:

- stable login/session behavior after idle;
- reliable channel/direct chat;
- unread badges, mention/reply attention, and jump-to-new behavior;
- screenshot paste and file upload/download;
- message copy through desktop clipboard;
- clickable links through desktop-safe external browser behavior;
- media permissions and screen share flow where supported;
- native desktop notifications comparable to Telegram/Discord expectations;
- app/taskbar badge or equivalent visible unread signal where the OS supports it;
- a user-friendly installer download path from the web app;
- automatic updates inside the desktop app so users do not manually redownload every build.

## Release Model Decision

Initial release model:

- keep the remote-web Electron shell for the first desktop release line;
- web UI/product fixes continue to ship through the normal web deploy;
- Electron shell/native bridge changes ship through desktop installer/auto-update;
- do not start a full local-renderer or `Next -> React/Vite` rewrite for this track.

Reasoning:

- remote-web shell gives fast product iteration while customer-priority chat work is still moving quickly;
- auto-update is still required because native notifications, badge APIs, updater UX, security hardening, and preload changes live in the desktop shell;
- rewriting renderer ownership now would create more risk than value.

Future option:

- moving `electron/*` into `apps/desktop` remains the target architecture cleanup, but should happen after release/update basics are stable or as a dedicated packaging-structure segment.

## Channel Model

Required channels:

- `staging` desktop build points to `https://staging.ax-connect.ru`;
- `production` desktop build points to `https://ax-connect.ru` or the final production app URL;
- staging and production must not auto-update into each other;
- if both apps can be installed on the same machine, they need separate app ids/product names;
- if only one app is allowed, staging must remain operator/dev-only and production must not consume staging update metadata.

Candidate channel shape:

- production app id: `com.axconnect.desktop`;
- staging app id: `com.axconnect.desktop.staging`;
- production product name: `AxConnect`;
- staging product name: `AxConnect Staging`;
- separate artifact paths and update metadata per channel.

This is implemented for packaging identity and artifact naming, but still needs packaged runtime smoke and later separate update metadata before release readiness.

## Blocking Risks

Release blockers:

- local Windows installer build has been reproduced on a symlink-capable build context, but official repeatable CI/CD release build is not implemented;
- desktop release artifact hosting runbook is prepared for staging, but operator upload/static hosting is not applied yet;
- auto-update provider/metadata is absent;
- native notification and app badge bridge are absent;
- packaged desktop runtime smoke is not complete;
- code signing is not configured;
- security review for remote web + preload bridge is not complete;
- staging/prod desktop packaging identity is separated, staging artifact hosting paths are documented, and update metadata separation is not implemented;
- no CI/CD path builds, verifies, signs, and uploads desktop artifacts.

Product risks:

- web-only notification sound is not the same as native desktop notification;
- current download button may point to a non-existent or stale installer unless release artifacts are published consistently;
- remote web app updates can change desktop behavior without a desktop installer, so desktop smoke must run against the active web deploy too;
- shell/native changes will not reach users without updater or explicit installer distribution;
- Windows SmartScreen may hurt adoption without signing.

## Segment Roadmap

### Segment 224. Desktop Release Readiness Roadmap

Status: `current docs-only segment`

Goal:
- document the desktop release track, blockers, channel model, runbook skeleton, and next implementation order.

Out of scope:
- runtime code;
- package config changes;
- installer build fix;
- updater;
- native notifications.

### Segment 225. Desktop Build Reproducibility Audit

Status: `pass / local installer artifact produced`

Goal:
- make `bun.cmd run build:desktop` reproducible on the chosen build machine or document why CI must own it.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_225_DESKTOP_BUILD_REPRODUCIBILITY_AUDIT.md`

Expected work:
- re-run local Windows build with clean state;
- diagnose `winCodeSign` symlink privilege issue;
- decide Developer Mode/admin/CI runner path;
- verify `dist-desktop` contains the expected NSIS installer;
- record artifact names and generated files;
- do not change app behavior.

Acceptance:
- desktop installer build passes on the official build path, or the blocker is documented with exact next operator action.

Result:
- `bun.cmd run check:desktop:config` passed;
- initial `bun.cmd run build:desktop` failed before NSIS installer creation because the build user could not create `winCodeSign` symlinks;
- after operator symlink/build-context fix, `bun.cmd run build:desktop` passed;
- installer: `dist-desktop\AxConnect-Setup-0.0.2.exe`;
- installer size: `175305456` bytes;
- SHA256: `B307A4BFB96BABB655D13855B6A0ADC61715F6F996F182CCCBCF74D347483FDF`;
- partial/generated output remains ignored and must not be committed;
- next action is `desktop-artifact-download-runbook`.

### Segment 226. Desktop Staging Channel Config

Status: `pass / staging channel config implemented; runtime smoke pending`

Goal:
- create a staging desktop release candidate path that points to `https://staging.ax-connect.ru`.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_226_DESKTOP_STAGING_CHANNEL_CONFIG.md`

Expected work:
- choose staging app id/product name/channel;
- avoid accidental production update/download collision;
- keep production config intact;
- decide whether config is generated at build time or stored as separate checked-in config;
- document operator build command.

Acceptance:
- packaged staging desktop opens staging and can coexist with or safely replace a previous local test build according to the documented decision.

Result:
- `electron/app-config.json` now stores public production and staging channel metadata;
- production remains the default channel and still targets `https://ax-connect.ru`;
- staging builds are selected by `electron-builder.staging.json` `extraMetadata.axConnectDesktopChannel=staging`;
- staging app id is `com.axconnect.desktop.staging`;
- staging product name is `AxConnect Staging`;
- staging protocol is `axconnect-staging`;
- staging artifact is `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`;
- staging installer size is `175306350` bytes;
- staging installer SHA256 is `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- generated `dist-desktop/*` and `electron/build-info.json` remain ignored and must not be committed;
- packaged runtime smoke was not claimed.

### Segment 227. Desktop Artifact Download Runbook

Status: `review / runbook prepared; operator upload pending`

Goal:
- make browser download of the desktop installer real and repeatable.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_227_DESKTOP_ARTIFACT_DOWNLOAD_RUNBOOK.md`

Expected work:
- define versioned artifact path;
- define `latest` artifact path;
- define SHA256/hash publication;
- define Nginx/static hosting path;
- define `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL` per env;
- define rollback to previous installer;
- verify web button downloads the expected installer.

Acceptance:
- a user can download the staging desktop installer from the web app without knowing server paths.

Result:
- Segment 226 was confirmed merged into latest `origin/core/reborn` before this branch was created;
- staging download hosting is documented as an Nginx static alias outside the app repo at `/var/www/ax-connect-desktop-downloads/`;
- final staging URLs are `/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.exe`, `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`, and `/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256`;
- staging web env value is `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`;
- local artifact evidence was rechecked: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`, `175306350` bytes, SHA256 `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- local PowerShell and operator-only VPS Bash commands are documented for upload, Nginx alias, env update, rebuild/restart, verification, and rollback;
- installer upload, Nginx reload, staging web rebuild/restart, browser download verification, and packaged desktop runtime smoke were not executed.

### Segment 228. Desktop Runtime Smoke Pass

Goal:
- prove the packaged desktop app is usable as the primary client.

Required smoke:
- login/logout/session restore and idle recovery;
- server/channel/direct navigation;
- chat history initial load, scroll, jump-to-new/latest;
- text send, edit, delete, copy;
- screenshot paste;
- generic file upload/download/open;
- mentions, `@all`, reply flow, reply navigation;
- unread badges, sound toggle, per-chat mute;
- external link opening;
- deep link handling;
- desktop window resize and theme;
- media permissions/screen share route if in active scope.

Acceptance:
- pass/review/fail report recorded with screenshots or redacted evidence where useful.

### Segment 229. Native Desktop Notification Bridge

Goal:
- route accepted unread/attention events to OS notifications and app-level unread signals.

Expected behavior:
- native popup for eligible incoming unread events when app/window is not actively showing the chat;
- click notification restores/focuses the app and navigates to the relevant channel/direct conversation;
- global/per-chat mute suppresses sound/native popup but not visual unread state, unless product later changes this;
- active visible near-bottom chat does not notify;
- hidden/minimized/unfocused active chat can notify;
- app/taskbar/dock badge or flash behavior is implemented where supported.

Acceptance:
- notification behavior works in packaged desktop and does not regress web notification sound behavior.

### Segment 230. Desktop Auto-Update Proof

Goal:
- implement and prove in-app update flow.

Candidate direction:
- use `electron-updater` with a generic static provider unless a better release hosting target is chosen;
- maintain separate staging/production update metadata;
- check updates on app start and periodically;
- download in background;
- show update-ready state and restart action;
- keep rollback path to previous installer/update metadata.

Acceptance:
- install version N, publish version N+1 to staging update channel, desktop detects update, installs/restarts, and reports new version.

### Segment 231. Desktop Security And Link Hardening

Goal:
- reduce risk from remote web content running inside Electron.

Expected work:
- review `sandbox`, `contextIsolation`, `nodeIntegration`, preload bridge surface, URL allowlists, permission handlers, external link behavior, and screen picker content;
- decide whether arbitrary external links should open in system browser instead of Electron windows;
- verify storage/file download behavior;
- record remaining risks.

Acceptance:
- security decisions are explicit and tested; no broad preload bridge expansion without origin checks.

### Segment 232. Desktop CI/CD Release Pipeline

Goal:
- move desktop release from manual local build to a repeatable release pipeline.

Expected work:
- Windows build runner;
- dependency install cache;
- desktop build;
- signing if available;
- hash generation;
- artifact upload;
- update metadata upload;
- smoke checklist gate;
- release notes or operator handoff.

Acceptance:
- release can be produced from a tag/commit without local-machine-specific steps.

### Segment 233. Production Desktop Rollout Report

Goal:
- release desktop to the active team and record rollout evidence.

Expected work:
- production installer hosted;
- production auto-update metadata hosted;
- web download button verified;
- install/update smoke passed on at least one clean Windows machine;
- user-facing announcement prepared;
- rollback path known.

Acceptance:
- desktop is classified `production pilot ready` or `blocked with concrete blocker`.

## Verification Commands

Baseline local commands:

```powershell
git status --short --branch
bun.cmd run check:desktop:config
bun.cmd run build:desktop
```

Shared verification still applies when runtime code changes:

```powershell
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Add packaged desktop runtime smoke before claiming desktop pass.

## Hard Rules

- Do not claim desktop pass from `check:desktop:config` alone.
- Do not claim release readiness until an installer is produced and launched.
- Do not mix staging and production update channels.
- Do not publish real secrets in docs or release metadata.
- Do not reset staging data for desktop validation.
- Do not resume WebRTC production rollout as part of desktop release work unless explicitly requested.
- Do not start `Next -> React/Vite` rewrite as part of this track.
- Do not merge native notification/update code without packaged desktop smoke.

