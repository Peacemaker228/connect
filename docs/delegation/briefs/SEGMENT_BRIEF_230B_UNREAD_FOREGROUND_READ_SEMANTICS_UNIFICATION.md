# Segment 230B. Unread Foreground Read Semantics Unification

## Classification

- segment: `unread-foreground-read-semantics-unification`
- type: `notification/read-semantics correctness`
- status: `implementation added / verification pending`
- target branch: `feature/unread-foreground-read-semantics-unification`
- source branch: latest `origin/core/reborn`
- commit policy: do not commit automatically

## Problem

After Segment 230A, packaged desktop native notifications worked for generic eligible events, but an important active-chat case remained wrong:

- if the user was currently routed to a channel/direct conversation;
- then minimized the desktop app or minimized/blurred the browser window;
- and another user posted into that same active chat;
- the event could still be treated as already visible/read because parts of the unread pipeline used `document.visibilityState === "visible"` or stale foreground assumptions.

The same issue was reproduced in web sound behavior: a minimized browser window on the active chat could suppress sound because the active route was treated as visible enough.

## Product Decision

Use one foreground-read rule for web and desktop:

- foreground active chat near bottom: read/suppress notification;
- foreground active chat scrolled up: keep visual unread/new-below, suppress sound/native popup;
- minimized, hidden, or unfocused active chat: treat as background, so unread sound/native notification is eligible when not muted;
- different channel/server/direct chat: unchanged eligible unread behavior;
- global sound off or per-chat mute: still suppresses sound/native popup but not visual unread state.

This intentionally means "active route" is not enough to read/suppress notifications. The user must actually be in a foreground-readable window.

## Implementation Notes

- Added a shared foreground helper used by local unread summary updates, global unread sound/native decisions, and active mark-read.
- Browser foreground now requires `document.visibilityState === "visible"` and `document.hasFocus()`.
- Desktop foreground uses the Electron window-state bridge when available: focused, visible, and not minimized.
- Desktop falls back to browser foreground semantics if the bridge is unavailable.
- Active-chat mark-read now re-evaluates when the desktop window-state snapshot changes, so restore/focus can mark read when appropriate.

## In Scope

- `use-global-unread-socket` active-route sound/native suppression.
- `use-unread-socket` server-scoped unread cache and active-chat auto-read.
- `use-mark-chat-read` mount/focus/visibility/window-state read behavior.
- Shared foreground helper and documentation.

## Out Of Scope

- No backend/API contract changes.
- No DB/schema/migrations.
- No notification settings UI changes.
- No auto-update/signing/CI/CD.
- No storage/media/WebRTC work.
- No taskbar badge work.

## Manual Smoke Required

Use two users.

1. Web: user A opens channel near bottom, minimizes or switches away from browser. User B sends into same channel.
   - Expected: sound eligible if not muted; unread visual state appears.
2. Web: user A opens channel near bottom and keeps browser foreground. User B sends into same channel.
   - Expected: no sound; active read path works.
3. Desktop: user A opens channel near bottom, minimizes app. User B sends into same channel.
   - Expected: native popup and sound eligible if not muted.
4. Desktop: user A opens channel near bottom and keeps app foreground. User B sends into same channel.
   - Expected: no native popup; no sound; active read path works.
5. Desktop/web: repeat while scrolled up in the same active chat.
   - Expected: visual unread/new-below remains; sound/native suppressed only while foreground, eligible while background.
6. Repeat with global sound off and per-chat mute.
   - Expected: sound/native blocked; visual unread remains.

## Verification Commands

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
bun.cmd run check:desktop:staging-config
```

