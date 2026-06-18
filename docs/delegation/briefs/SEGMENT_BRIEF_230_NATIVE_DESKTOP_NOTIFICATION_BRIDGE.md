# Segment 230. Native Desktop Notification Bridge

## Classification

- segment: `desktop-native-notification-bridge`
- type: `desktop runtime / native notifications`
- status: `ready for implementation`
- target branch: `feature/desktop-native-notification-bridge`
- source branch: latest `origin/core/reborn` after Segment 229 docs are merged
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
- current Electron/unread entrypoints.

Selected rules:

- `rules/rules.md` for baseline workflow;
- `rules/task.md` for shared frontend/runtime UI behavior;
- `rules/realtime-media.md` because the feature consumes realtime unread events;
- `rules/sdk-client-access.md` if query/cache/read-state code is touched;
- `rules/architecture-docs.md` because this segment updates roadmap/runbook/status docs;
- `rules/review/mini-review.md` for the final self-review handoff.

Legacy/deferred areas intentionally excluded:

- no WebRTC/media production rollout;
- no LiveKit removal;
- no production DB migration;
- no auto-update implementation;
- no code signing;
- no desktop CI/CD pipeline;
- no broad Electron rewrite.

Electron docs note:

- use Electron main-process `Notification` for native notifications;
- route renderer events through preload IPC instead of exposing broad Electron APIs;
- notification click handlers should restore/focus the window and route the renderer to the relevant chat;
- badge/flash behavior must be best-effort because OS support differs.

## Current State

Desktop:

- current desktop app is an Electron remote-web shell;
- production default remains protected;
- staging packaging and download are working;
- packaged desktop runtime smoke passed with one known generic-file-download UX issue;
- `electron/preload.js` currently exposes a narrow `window.electron` bridge:
  - `isDesktop`;
  - `openExternal`;
  - `writeClipboardText`;
  - `getBuildInfo`;
  - `notifyReady`;
  - `onAuthSession`.

Unread/notification runtime:

- accepted unread events are already processed in:
  - `src/lib/shared/data-access/unread/use-global-unread-socket.ts`;
  - `src/lib/shared/data-access/unread/use-unread-socket.ts`;
  - `src/lib/shared/data-access/unread/unread-notification-sound.ts`;
  - `src/lib/shared/data-access/unread/unread-notification-diagnostics.ts`;
  - `src/lib/shared/data-access/unread/unread-notification-visibility.ts`;
  - `src/lib/shared/data-access/unread/unread-attention.ts`.
- current web behavior has guards for:
  - own-message suppression;
  - active visible near-bottom suppression;
  - hidden/minimized/unfocused active chat eligibility;
  - duplicate event suppression;
  - global sound toggle;
  - per-chat mute scope;
  - mention/reply/unread attention priority.

## Goal

Add a native desktop notification bridge for eligible unread/attention events in the packaged Electron app.

The implementation must reuse the existing unread decision path instead of creating a second, inconsistent notification policy.

## In Scope

- Add a narrow preload IPC API for desktop notifications and optional badge/attention updates.
- Add Electron main-process handlers that:
  - show native notifications for eligible unread/attention events;
  - focus/restore the existing app window on notification click;
  - route to the correct server/channel or direct conversation when possible;
  - use best-effort app attention signals, such as `flashFrame` on Windows/Linux where appropriate;
  - use `app.setBadgeCount` only as best-effort and never as a guaranteed cross-platform feature.
- Connect the bridge from the existing unread realtime path after existing guards/mute/dedupe decisions.
- Keep web runtime behavior unchanged when `window.electron?.isDesktop` is false.
- Extend diagnostics so native notification decisions can be inspected during smoke.
- Update desktop roadmap/status/runbook docs.

## Out Of Scope

- No backend/API contract changes unless a missing route target is proven unavoidable.
- No DB/schema/migrations.
- No auto-update.
- No code signing.
- No installer rebuild/upload unless needed for manual packaged smoke after implementation.
- No native file-download UX changes.
- No broad notification settings UI rewrite.
- No Notification API implementation for normal browser web.
- No WebRTC/media changes.

## Expected Implementation Shape

Inspect first:

- `electron/main.js`;
- `electron/preload.js`;
- `src/lib/shared/features/desktop-deep-link-handler.tsx`;
- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`;
- `src/lib/shared/data-access/unread/use-unread-socket.ts`;
- `src/lib/shared/data-access/unread/unread-notification-sound.ts`;
- `src/lib/shared/data-access/unread/unread-notification-diagnostics.ts`;
- `src/lib/shared/data-access/unread/unread-notification-visibility.ts`;
- `src/lib/shared/data-access/unread/unread-attention.ts`;
- `packages/app-core/src/contracts/message-slice-realtime.ts`;
- `packages/sdk/src/queries/unread.ts`.

Preferred shape:

1. Define a narrow payload for native unread notifications, for example:
   - message id;
   - server id;
   - channel id or direct member/conversation target;
   - sender/member display name;
   - short body preview, sanitized and bounded;
   - attention level: `mention`, `reply`, `unread`;
   - mute/sound decision already applied by renderer.
2. Expose a narrow `window.electron.showUnreadNotification(payload)` style API through preload.
3. In `electron/main.js`, validate payload shape defensively before creating `Notification`.
4. On notification click:
   - restore/focus the main window;
   - send a renderer IPC event or use an existing navigation-ready mechanism to route to the target chat;
   - do not create a new window.
5. Keep notification text free of secrets, tokens, file URLs, or raw storage payloads.
6. Integrate from the existing unread hooks only after existing guards say the event is eligible.
7. Preserve mute behavior:
   - global sound off or per-chat mute should suppress native popup and sound;
   - visual unread/badges remain unchanged unless product explicitly changes this later.
8. Preserve active visible near-bottom behavior:
   - no native notification for a chat the user is actively reading.
9. Hidden/minimized/unfocused active chat:
   - native notification may fire if not muted, matching the current product decision for sound/unread eligibility.

## Acceptance Criteria

- Web behavior remains unchanged when not running inside Electron.
- Packaged `AxConnect Staging` can show a native OS notification for an eligible incoming unread event.
- Muted chat does not show native notification.
- Global notification sound off suppresses native notification for this segment unless product later separates popup and sound settings.
- Active visible near-bottom chat does not show native notification.
- Hidden/minimized/unfocused active chat can show native notification.
- Notification click focuses/restores the app and navigates to the relevant channel or direct conversation.
- No broad Electron API exposure is added to `window.electron`.
- No secrets or raw backend/storage payloads appear in notifications.
- Diagnostics can explain whether native notification was sent, skipped, unsupported, blocked by mute, or failed.

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
git diff --check
```

If Electron code changes, also run at least one desktop-mode check:

```powershell
bun.cmd run dev:desktop
```

If packaging is needed for final proof:

```powershell
bun.cmd run build:desktop:staging
```

Do not commit generated files from:

- `dist-desktop\*`;
- `electron\build-info.json`;
- installer `.exe`;
- `.blockmap`;
- `latest.yml`.

## Manual Smoke

Use two authenticated users.

Required packaged desktop smoke after implementation:

1. Desktop user is logged in and app is visible in a different channel: browser/second user sends message to another channel.
   - Expected: native notification appears; visual unread updates.
2. Desktop user is in the same active chat, visible and near bottom: second user sends message.
   - Expected: no native notification.
3. Desktop app minimized or unfocused while same chat is active: second user sends message.
   - Expected: native notification appears if not muted.
4. Per-chat muted channel/DM receives message.
   - Expected: no native notification; visual unread still updates.
5. Mention or reply attention arrives.
   - Expected: notification title/body makes attention understandable without leaking raw ids.
6. Click notification.
   - Expected: app focuses/restores and navigates to the relevant chat.

Record OS/version, desktop artifact version, and whether Windows notification settings allowed notifications.

## Handoff Format

Return:

- files changed;
- exact behavior implemented;
- what is desktop-only vs shared web behavior;
- verification commands and results;
- packaged smoke result, or explicit reason why only dev desktop smoke was possible;
- known OS limitations;
- PowerShell-safe git add/commit commands.
