# Segment 230A. Desktop Native Notification Window Focus Semantics

## Classification

- segment: `desktop-native-notification-window-focus-semantics`
- type: `desktop runtime / notification decision correctness`
- status: `review / implementation added; packaged smoke pending`
- target branch: `feature/desktop-native-notification-window-focus-semantics`
- source branch: latest `origin/core/reborn`
- commit policy: do not commit automatically; return PowerShell-safe `git add` / `git commit` commands

## Preparation Summary

Docs checked before writing this brief:

- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/ARCHITECTURE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `docs/delegation/briefs/SEGMENT_BRIEF_230_NATIVE_DESKTOP_NOTIFICATION_BRIDGE.md`.

Selected rules:

- `rules/rules.md` for baseline workflow;
- `rules/task.md` for shared frontend/runtime behavior;
- `rules/realtime-media.md` because this consumes realtime unread events;
- `rules/sdk-client-access.md` because the work touches client-side query/cache/runtime hooks;
- `rules/architecture-docs.md` because this updates desktop roadmap/status docs;
- `rules/review/mini-review.md` for final self-review.

Legacy/deferred areas intentionally excluded:

- no WebRTC/media work;
- no LiveKit removal;
- no DB/schema/migration work;
- no production rollout;
- no auto-update/signing/CI work;
- no broad notification settings redesign;
- no rewrite of the Electron remote-web model.

## Current State

Segment 230 has been merged into `core/reborn` and deployed through the staging web bundle. The packaged `AxConnect Staging` shell exposes:

- `window.electron.isDesktop`;
- `window.electron.showUnreadNotification(payload)`;
- `window.electron.onUnreadNotificationNavigate(callback)`;
- `window.electron.getBuildInfo()`.

Operator smoke proved:

- manual `window.electron.showUnreadNotification(...)` can produce a Windows native notification;
- `AxConnect Staging` appears in Windows notification settings after a native notification is sent;
- real unread events can route into the native bridge once the staging web bundle is updated.

Observed product issue:

- native notifications can appear when the desktop app is on screen and the user is already in the active chat.

Important review note:

- do not fix this by simply changing active-route suppression to `document.visibilityState === "visible"` only.
- That would suppress notifications too broadly for desktop cases where the app is visible but not actually active, or where the window is covered/behind another app.
- Desktop behavior needs an explicit Electron window state signal instead of relying only on renderer `document.hasFocus()` / `document.visibilityState`.

## Product Decision

Use desktop-aware notification semantics:

1. Same active chat, desktop window focused, visible, near bottom:
   - no native popup;
   - no sound;
   - message can be treated as read by existing active-read behavior.

2. Same active chat, desktop window focused, visible, but user is scrolled up:
   - no native popup;
   - no sound;
   - visual unread / anchor behavior remains.

3. Same active chat, desktop window minimized, hidden, or not focused:
   - native popup may appear if global/per-chat notification sound is enabled and the scope is not muted;
   - visual unread remains.

4. Different channel/server/direct conversation:
   - native popup may appear if not muted and the event passes existing own-message/dedupe/access guards.

5. Global notification sound off or per-chat mute:
   - suppress native popup and sound for this segment;
   - do not suppress visual unread/badges.

This is closer to Discord/Telegram-style desktop behavior: no popup while the user is actively reading, but background/unfocused desktop work can still notify.

## Goal

Replace the current renderer-only focus/visibility decision with a narrow desktop window-state bridge and use it only inside the existing unread native-notification decision path.

## In Scope

- Add a narrow Electron window-state API/event through preload, for example:
  - `window.electron.getWindowState()` returning `{ focused, visible, minimized }`;
  - optionally `window.electron.onWindowStateChange(callback)` if the implementation benefits from cached state.
- Track main-window focus/blur/minimize/restore/show/hide state in `electron/main.js`.
- Use the desktop window state in `src/lib/shared/data-access/unread/use-global-unread-socket.ts` when deciding whether an active-route event is considered actively read or native-notification eligible.
- Preserve browser web behavior when `window.electron?.isDesktop` is false.
- Extend diagnostics so packaged smoke can explain window-state decisions.
- Update Segment 230 docs, desktop roadmap, and stage status.

## Out Of Scope

- No backend/API contract changes.
- No DB/schema/migrations.
- No unread persistence model changes.
- No notification settings UI redesign.
- No browser Notification API.
- No auto-update/signing/CI/CD.
- No taskbar/dock badge implementation unless a trivial best-effort existing bridge already exists and does not broaden scope.
- No file-download UX work.

## Files To Inspect First

- `electron/main.js`;
- `electron/preload.js`;
- `global.d.ts`;
- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`;
- `src/lib/shared/data-access/unread/unread-native-notification.ts`;
- `src/lib/shared/data-access/unread/unread-notification-diagnostics.ts`;
- `src/lib/shared/data-access/unread/unread-notification-visibility.ts`;
- `src/lib/shared/data-access/unread/active-chat-read-state.ts`;
- `src/lib/shared/features/desktop-deep-link-handler.tsx`;
- `docs/delegation/briefs/SEGMENT_BRIEF_230_NATIVE_DESKTOP_NOTIFICATION_BRIDGE.md`;
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## Expected Implementation Shape

1. Keep Electron APIs narrow:
   - expose only window notification state, not arbitrary Electron objects;
   - validate IPC sender origin where existing patterns do so;
   - remove listeners on cleanup.

2. Prefer a cached renderer state plus initial async read:
   - native notification decisions happen in realtime callbacks, so do not add slow or fragile IPC calls in the hot path if a cached state is enough;
   - if using async IPC directly in the event path, keep ordering/dedupe safe and document why.

3. Define a helper for desktop active-read notification suppression:
   - browser web path keeps current behavior;
   - desktop path uses Electron window state when available;
   - if Electron window state is unavailable, fall back conservatively to the existing renderer visibility/focus behavior.

4. Preserve existing guards:
   - own message;
   - inaccessible server/member;
   - duplicate event dedupe;
   - active visible near-bottom read boundary;
   - scrolled-up visual unread behavior;
   - global sound toggle;
   - per-chat mute;
   - mention/reply/unread attention priority.

5. Diagnostics should record enough to distinguish:
   - active route suppressed because desktop window is focused/visible;
   - active route eligible because desktop window is minimized/hidden/unfocused;
   - native sent/failed/unsupported;
   - blocked by global sound off;
   - blocked by per-chat mute.

## Acceptance Criteria

- Web browser behavior is unchanged.
- Desktop same active chat, app window focused and near bottom: no native notification.
- Desktop same active chat, app window focused but scrolled up: no native notification; visual unread/new-below behavior remains.
- Desktop same active chat, app minimized or unfocused: native notification appears if not muted.
- Desktop different channel/server/DM: native notification appears if not muted.
- Global sound off suppresses native popup and sound.
- Per-chat mute suppresses native popup and sound for that scope.
- Notification click still restores/focuses and navigates correctly.
- Diagnostics show the window-state decision path.
- No generated desktop artifacts are committed.

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

If packaged proof is required, build staging installer:

```powershell
bun.cmd run build:desktop:staging
```

Do not commit generated files:

- `dist-desktop\*`;
- `electron\build-info.json`;
- installer `.exe`;
- `.blockmap`;
- `latest.yml`.

## Manual Packaged Smoke

Use two authenticated users, one in packaged `AxConnect Staging`, one in browser.

1. Desktop user opens channel A and stays near bottom. Browser user sends to channel A.
   - Expected: no native popup, no sound, active-read behavior preserved.

2. Desktop user opens channel A, scrolls up enough to show the jump/down anchor. Browser user sends to channel A.
   - Expected: no native popup; visual unread/new-below state appears.

3. Desktop user opens channel A, then minimizes the desktop app. Browser user sends to channel A.
   - Expected: native popup appears if not muted.

4. Desktop user opens channel A, then switches focus to another application while AxConnect remains open. Browser user sends to channel A.
   - Expected: native popup appears if not muted.

5. Desktop user opens channel A. Browser user sends to channel B or a DM.
   - Expected: native popup appears if not muted.

6. Mute channel B / direct chat and repeat.
   - Expected: no native popup, visual unread still appears.

7. Disable global notification sound and repeat an eligible event.
   - Expected: no native popup and no sound for this segment.

8. Click native notification.
   - Expected: app restores/focuses and navigates to the relevant chat.

Before smoke, enable diagnostics in desktop DevTools:

```js
localStorage.setItem('ax-connect:debug-unread-notifications', '1')
```

Inspect:

```js
window.__axUnreadNotificationDebug?.getEntries?.().slice(-20)
```

## Implementation Result

Status:

- implementation added on `feature/desktop-native-notification-window-focus-semantics`;
- packaged smoke is still required before classifying native notifications as pass.

Window-state API added:

- `window.electron.getWindowState()` returns `{ focused, visible, minimized } | null`;
- `window.electron.onWindowStateChange(callback)` subscribes to focused/blurred/minimized/restored/shown/hidden state changes;
- Electron main process validates the caller origin for the snapshot IPC read;
- renderer caches the latest state through `src/lib/shared/data-access/unread/unread-desktop-window-state.ts` so realtime unread callbacks do not perform async IPC in the hot path.

Decision behavior:

- browser web path remains based on existing renderer visibility behavior and does not use the Electron window-state bridge;
- desktop active-route suppression now requires Electron window state `focused === true`, `visible === true`, and `minimized === false`;
- if Electron window state is not available yet, desktop falls back conservatively to the previous renderer visibility/focus behavior;
- focused/visible active chat near bottom remains auto-read with no native popup/sound;
- focused/visible active chat while scrolled up keeps visual unread/new-below behavior with no native popup/sound;
- minimized, hidden, or unfocused active chat is eligible for native popup/sound when global sound is enabled and the scope is not muted.

Diagnostics added:

- `active_desktop_window_focused_auto_read`;
- `active_desktop_window_focused_scrolled_up_unread`;
- `desktop_window_background_active_unread_sound_eligible`;
- debug entries now include `desktopWindowFocused`, `desktopWindowVisible`, and `desktopWindowMinimized` when the bridge is available.

## Handoff Format

Return:

- branch/base commit;
- files changed;
- exact desktop window-state API added;
- how browser web behavior was preserved;
- how active-chat/focused/minimized/unfocused cases behave;
- diagnostic reason codes added/changed;
- verification command results;
- packaged smoke result or explicit pending status;
- PowerShell-safe git add/commit commands.
