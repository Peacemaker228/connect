# Desktop Release Roadmap

## Purpose

This document owns the desktop release track for AxConnect.

The product direction is `desktop-first`, but the current desktop implementation is still a thin Electron shell over the web app. That is acceptable for the first releasable desktop line, but only if release, update, notification, packaging, and smoke-test ownership are made explicit.

This roadmap exists so desktop work is shipped as bounded segments instead of ad hoc fixes inside customer chat tasks.

## Current Classification

- desktop product direction: `primary / desktop-first`
- current implementation: `Electron remote-web shell`
- desktop release readiness: `review / staging line forming`
- desktop staging release candidate: `partial / installer, notifications, and auto-update proof exist`
- desktop auto-update: `technical proof, flow hardening, and update-ready UX smoke passed`
- native desktop notifications: `implemented / staging smoke and user soak ongoing`
- desktop runtime smoke: `basic staging smoke passed / repeat after release changes`
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
- there is no updater, no publish provider, native notification bridge implementation is under review pending packaged smoke, no taskbar/dock badge bridge is guaranteed, and no release artifact hosting automation exists.

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
- desktop release artifact hosting runbook is prepared for staging, but public HTTPS verification currently shows `/downloads/desktop/` is still routed through web auth instead of static Nginx hosting;
- auto-update provider/metadata is absent;
- native notification bridge implementation exists locally but still needs packaged smoke; app badge behavior remains best-effort and not guaranteed;
- packaged desktop runtime smoke is not complete;
- code signing is not configured;
- security review for remote web + preload bridge is not complete;
- staging/prod desktop packaging identity is separated, staging artifact hosting paths are documented, public static download hosting is blocked, and update metadata separation is not implemented;
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

### Segment 228. Desktop Staging Download Apply Verification

Status: `blocked initially / closed by Segment 228A`

Goal:
- apply the staging installer download runbook and prove that users can download the staging installer from the web app.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_228_DESKTOP_STAGING_DOWNLOAD_APPLY_VERIFICATION.md`

Expected work:
- upload the versioned staging installer and SHA256 file to the staging VPS;
- publish the `latest` copy;
- apply or verify the Nginx `/downloads/desktop/` static alias;
- verify HTTPS download and SHA256;
- verify the staging web download button uses `NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL`;
- record redacted evidence.

Acceptance:
- staging installer download works from `https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe`, hash matches, and no packaged runtime smoke is claimed yet.

Result:
- branch started from latest `origin/core/reborn` after Segment 227 was merged;
- local installer evidence still matches Segment 226: `dist-desktop\AxConnect-Staging-Setup-0.0.2.exe`, `175306350` bytes, SHA256 `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- staging web HTML contains `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` and does not contain fallback `/downloads/AxConnect-Setup-latest.exe`;
- public `https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` returns `307 Temporary Redirect` to `/sign-in?redirect_url=...` instead of static installer bytes;
- following the redirect downloads sign-in HTML (`26273` bytes, first bytes `<!DOCTYPE html>`) rather than the `175306350` byte installer;
- public `.sha256` URL also redirects to sign-in HTML and does not contain the expected hash;
- no server command, production change, auto-update/native notification work, or packaged desktop runtime smoke was run.

Follow-up:
- Segment 228A diagnosed and closed this blocker: files were published to `/var/www/ax-connect-desktop-downloads/desktop/staging/win/`, the active staging Nginx HTTPS server block now serves `/downloads/desktop/*` directly, GET/HEAD return `200 OK`, SHA verification passes, and the operator confirmed browser download plus Windows installation.

Next operator action:
- continue with Segment 229 packaged desktop runtime smoke.

### Segment 228A. Desktop Staging Download Nginx Route Diagnosis

Status: `pass / staging download route fixed and verified`

Goal:
- diagnose why `/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` returns `307` to `/sign-in` before making any Nginx change.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_228A_DESKTOP_STAGING_DOWNLOAD_NGINX_ROUTE_DIAGNOSIS.md`

Expected work:
- verify installer files exist on the staging VPS;
- verify ownership and permissions allow `www-data` to read the installer and hash file;
- inspect active enabled Nginx config for the `staging.ax-connect.ru` HTTPS server block;
- verify whether `location ^~ /downloads/desktop/` exists, is inside the staging HTTPS server block, and takes precedence over generic proxy/auth rules;
- collect redacted `nginx -T` snippets around the staging server block and download locations;
- propose a minimal Nginx patch only after the diagnosis evidence identifies the failure class.

Result:
- diagnosis showed the staging desktop files were initially missing from `/var/www/ax-connect-desktop-downloads/desktop/staging/win/`;
- the versioned installer was uploaded as `AxConnect-Staging-Setup-0.0.2.exe`, `AxConnect-Staging-Setup-latest.exe` was published, and `AxConnect-Staging-Setup-0.0.2.sha256` was generated on the VPS;
- `www-data` read access was confirmed for the latest installer;
- the active `staging.ax-connect.ru` HTTPS Nginx server block now contains `location ^~ /downloads/desktop/` before the generic web proxy, with an alias to `/var/www/ax-connect-desktop-downloads/desktop/`;
- `GET` and `HEAD` for `https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` returned `200 OK`;
- the downloaded latest installer hash matched SHA256 `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- browser download and Windows installation were confirmed by the operator;
- production, app code, DB/env/auth/storage/media runtime, auto-update, and native notification work were not changed;
- packaged desktop runtime smoke was not run and remains Segment 229.

Acceptance:
- staging installer URL serves static bytes without auth redirect;
- SHA verification passes;
- browser download and install pass;
- packaged runtime smoke remains separate.

### Segment 229. Desktop Runtime Smoke Pass

Status: `pass / operator-smoked`

Goal:
- prove the packaged desktop app is usable as the primary client.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_229_DESKTOP_RUNTIME_SMOKE_PASS.md`

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

Result:
- installed `AxConnect Staging` desktop app was manually smoke-tested by the operator;
- no critical runtime blockers were found;
- browser download and Windows installation had already passed in Segment 228A;
- known UX issue: generic non-image/non-PDF file open/download in Electron is awkward because it can open an extra window/native save flow without clear completion state; this is deferred to a focused future `desktop-file-download-ux-polish` segment;
- native OS notifications, taskbar/dock badge behavior, auto-update, signing, and CI/CD release pipeline remain pending.

### Segment 230. Native Desktop Notification Bridge

Status: `review / implementation added; packaged smoke pending`

Goal:
- route accepted unread/attention events to OS notifications and app-level unread signals.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_230_NATIVE_DESKTOP_NOTIFICATION_BRIDGE.md`

Expected behavior:
- native popup for eligible incoming unread events when app/window is not actively showing the chat;
- click notification restores/focuses the app and navigates to the relevant channel/direct conversation;
- global/per-chat mute suppresses sound/native popup but not visual unread state, unless product later changes this;
- active visible near-bottom chat does not notify;
- hidden/minimized/unfocused active chat can notify;
- app/taskbar/dock badge or flash behavior is implemented where supported.

Acceptance:
- notification behavior works in packaged desktop and does not regress web notification sound behavior.

Result:
- narrow preload IPC APIs were added for native unread notifications and notification-click navigation;
- Electron main process validates trusted origin and notification payload before using main-process `Notification`;
- native notification requests are emitted only from the existing global unread realtime path after existing own-message, duplicate, active-read, mute, global sound, and visibility decisions;
- web/non-Electron runtime does not call the native bridge;
- global notification sound off and per-chat mute suppress native popups in this segment;
- notification click restores/focuses the existing app window and routes to the target channel or direct conversation;
- diagnostics record native sent/unsupported/failed and native blocked-by-global/blocked-by-scope outcomes;
- local TypeScript check passed;
- packaged native notification smoke was not run yet, so this segment is not classified as pass.

### Segment 230A. Desktop Native Notification Window Focus Semantics

Status: `review / implementation added; packaged smoke pending`

Goal:
- make native notification eligibility use desktop window focus/minimize state instead of relying only on renderer `document.visibilityState` / `document.hasFocus()`.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_230A_DESKTOP_NATIVE_NOTIFICATION_WINDOW_FOCUS_SEMANTICS.md`

Expected behavior:
- active same chat with focused desktop window does not show a native popup;
- active same chat with minimized or unfocused desktop window can show a native popup if not muted;
- different channel/server/DM can show a native popup if not muted;
- browser foreground-read behavior is finalized by Segment 230B.

Reason:
- Segment 230 proved the Electron native notification bridge can work, but packaged smoke showed the decision path needs a desktop-aware window-state signal so "actively reading" is not guessed from renderer-only visibility/focus state.

Result:
- Electron main process now exposes a narrow window-state bridge: `getWindowState()` plus `onWindowStateChange(...)` for focus/blur/minimize/restore/show/hide state;
- renderer caches the latest desktop window state for synchronous realtime notification decisions;
- browser web behavior remained unchanged in Segment 230A, but Segment 230B supersedes the foreground-read rule for both web and desktop;
- desktop active same-chat suppression now requires focused, visible, non-minimized Electron window state;
- diagnostics include desktop-focused auto-read, desktop-focused scrolled-up suppression, background active-chat eligibility, and the focused/visible/minimized snapshot fields;
- packaged smoke remains pending before classifying native notifications as pass.

### Segment 230B. Unread Foreground Read Semantics Unification

Status: `review / staging deploy and initial operator smoke passed; user soak pending`

Goal:
- use one foreground-read rule across web and desktop so minimized/unfocused active chats are notification-eligible instead of being treated as already visible.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_230B_UNREAD_FOREGROUND_READ_SEMANTICS_UNIFICATION.md`

Expected behavior:
- foreground active chat near bottom is read and suppresses sound/native notification;
- foreground active chat while scrolled up keeps visual unread/new-below and suppresses sound/native notification;
- minimized, hidden, or unfocused active chat is treated as background and can play sound/native notification if not muted;
- global sound off and per-chat mute still block sound/native notification but preserve visual unread.

Result:
- shared foreground helper added for unread read/suppression decisions;
- browser foreground requires visible document plus focused window;
- desktop foreground uses the Electron focused/visible/minimized bridge when available;
- active mark-read re-evaluates on desktop window-state changes;
- backend/API/DB/storage/media/update pipeline were not changed;
- staging web deploy was completed after merge to `core/reborn`;
- initial operator smoke passed for the corrected foreground notification behavior;
- broader staging web and packaged desktop user soak remains pending.

### Segment 231. Desktop Auto-Update Proof

Status: `pass / staging auto-update proof passed`

Goal:
- implement and prove in-app update flow.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_231_DESKTOP_AUTO_UPDATE_PROOF.md`

Candidate direction:
- use `electron-updater` with the staging generic static provider;
- maintain separate staging/production update metadata;
- check updates on app start and periodically;
- download in background;
- show update-ready state and restart action;
- keep rollback path to previous installer/update metadata.

Acceptance:
- install version N, publish version N+1 to staging update channel, desktop detects update, installs/restarts, and reports new version.

Current constraints:
- staging is the active channel for proof;
- production is currently inactive/dead and must not receive an update rollout;
- current staging static hosting can serve installer bytes under `/downloads/desktop/staging/win/`;
- generated artifacts must remain ignored and uncommitted.

Result:
- `electron-updater` was added as a runtime dependency;
- source package/app version was bumped to `0.0.3` for staging proof baseline `N`;
- staging builder config now has generic publish URL `https://staging.ax-connect.ru/downloads/desktop/staging/win/`;
- packaged staging main process enables updater only for channel `staging`, never ordinary browser runtime;
- preload exposes narrow update status/check/install/status-subscribe APIs;
- account menu shows desktop-only update status and explicit restart/update action after download;
- local `0.0.3` and temporary `0.0.4` staging artifacts plus `latest.yml`/blockmap were built; `0.0.4` source bump was reverted after artifact generation;
- operator installed `0.0.3`, published `0.0.4` update metadata/artifacts to staging static hosting, verified hosted installer SHA256, triggered the update flow, restarted, and confirmed the relaunched desktop reported `version: "0.0.4"`.

Product UX gap:
- the update path is technically proven, and a compact desktop-only update-ready action now makes downloaded updates visible without opening the account menu;
- the visible action is intentionally narrow: `downloading` can show compact progress, `downloaded` shows `Restart`, and idle/no-update/error states stay quiet outside the account menu;
- packaged staging smoke proved the visible action during a real N -> N+1 flow after staging web was deployed with the renderer UI.

Recommended follow-up sequence:
- desktop file-download UX polish, desktop security/link hardening, and CI/CD release pipeline.

### Segment 231A. Desktop Auto-Update Flow Hardening

Status: `pass / implementation and packaged smoke passed`

Goal:
- harden the internal desktop updater lifecycle before adding prominent user-facing update UX.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_231A_DESKTOP_AUTO_UPDATE_FLOW_HARDENING.md`

Expected work:
- normalize updater status states;
- prevent concurrent checks/download storms;
- add bounded packaged-staging periodic checks;
- keep manual retry available;
- handle missing metadata, network errors, invalid metadata, same-version/no-update, and download/hash failures without crashing or getting stuck;
- keep install/restart explicit;
- update runbook/status after implementation.

Out of scope:
- update-ready visual polish such as green button/banner/toast/native prompt;
- CI/CD release pipeline;
- production update provider;
- code signing;
- server artifact publishing;
- DB/storage/media/WebRTC/chat changes.

Acceptance:
- packaged staging desktop has reliable updater state and retry behavior;
- browser web does not expose updater controls;
- production/default channel does not consume staging metadata;
- future update-ready UX has a dependable status source.

Result:
- updater status lifecycle now includes `unsupported`, `idle`, `checking`, `available`, `not_available`, `downloading`, `downloaded`, and `error`;
- status snapshots include current/update version, channel, progress, sanitized error, `lastCheckedAt`, `lastSuccessfulCheckAt`, `lastErrorAt`, and `updatedAt`;
- manual and periodic checks share the same guard and do not run while checking, available, downloading, or downloaded;
- packaged staging periodic check interval is `45` minutes;
- `downloaded` remains stable until explicit restart/update;
- install/restart returns a safe `update_not_downloaded` error unless an update is downloaded;
- existing account-menu item keeps retry available without adding banner/toast/native prompt/polished update-ready UI.

Smoke result:
- operator smoke passed for no-update, concurrent manual checks, missing `latest.yml` error, metadata restore/retry recovery, and explicit update flow;
- staging desktop/web/api were later rolled forward to `0.0.5`, then the desktop update-ready UX smoke used `0.0.6 -> 0.0.7`.
- `0.0.5` staged desktop build evidence: `AxConnect-Staging-Setup-0.0.5.exe`, `94294597` bytes, SHA256 `7FB31ED52ED3431A2FD822F6822A641CCD464F60039B4A46B017706E6C48DD9B`.
- `0.0.7` staged desktop update evidence: `AxConnect-Staging-Setup-0.0.7.exe`, `94294749` bytes, SHA256 `D1AF57AC134D6277ED17E1017914FBCCF0E74C22FEF8C94AE21C6E2F8DA2AF77`.

### Segment 231B. Desktop Update-Ready UX Polish

Status: `pass / implemented and smoke-tested`

Goal:
- make downloaded desktop updates obvious without requiring users to open the account menu.

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_231B_DESKTOP_UPDATE_READY_UX_POLISH.md`

Expected work:
- add a compact desktop-only visible update-ready affordance for `downloaded` update status;
- preserve explicit restart/update;
- keep no-update/unsupported states quiet;
- keep ordinary browser web unchanged;
- preserve existing account-menu update action;
- update docs and smoke checklist.

Out of scope:
- CI/CD release pipeline;
- production update provider;
- signing/notarization;
- server/Nginx publishing;
- native update-ready notification unless explicitly minimal and non-spammy;
- DB/storage/media/WebRTC/chat changes.

Acceptance:
- installed packaged staging desktop shows a visible update-ready action when update status is `downloaded`;
- clicking the visible action restarts/updates through the existing `installUpdate()` bridge;
- browser web shows no updater UI;
- account-menu updater remains functional.

Result:
- shared renderer hook `useDesktopUpdateStatus()` now owns the update status snapshot/subscription path for update UI;
- account-menu updater was refactored to use the shared hook and remains the retry/check/restart surface;
- server sidebar footer now renders a compact desktop-only update control near the account controls;
- `downloading` shows quiet compact progress, `downloaded` shows an explicit `Restart` action, and idle/no-update/unsupported/error render nothing globally;
- browser web remains quiet because the visible control only renders when the Electron update bridge is available;
- Electron main/preload, production update provider, CI/CD, signing, DB/storage/media/WebRTC/chat logic were not changed;
- packaged staging smoke passed after staging web deploy: installed desktop `0.0.6` detected hosted `0.0.7`, the compact visible `Restart` action appeared for `downloaded` status, and update/restart completed successfully.

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

