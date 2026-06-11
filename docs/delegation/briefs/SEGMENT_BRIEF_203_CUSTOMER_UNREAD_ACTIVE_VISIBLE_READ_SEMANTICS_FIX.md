# Segment Brief 203: Customer Unread Active Visible Read Semantics Fix

## Metadata

- Branch: `feature/customer-unread-active-visible-read-semantics-fix`
- Base: latest `origin/core/reborn`
- Segment: `customer-unread-active-visible-read-semantics-fix`
- Type: customer-priority unread/read-notification runtime semantics fix
- Status: `pass / implemented locally; manual smoke pending`
- Commit policy: do not commit automatically; provide PowerShell-safe `git add` and `git commit` commands in the handoff

## Context

Segment 201 made active-chat unread and sound decisions visibility/focus-aware. That fixed hidden/minimized active chat events becoming unread/sound eligible, but it made read semantics too strict for a visible chat: `document.hasFocus()` could keep the active chat in an unseen state until the user clicked the page.

The desired product behavior is closer to Discord/Telegram:

- if the active channel/DM is visible and the user is at or near the bottom, incoming messages are seen/read without a click;
- if the active channel/DM is visible but the user is scrolled up, incoming messages remain unread and keep the `New` state until the user returns near bottom;
- if the tab/window is hidden or minimized, the active chat behaves like unseen and remains unread/sound eligible unless muted.

## Scope

In scope:

- split read/seen semantics from sound/notification semantics;
- remove `document.hasFocus()` as a hard gate for mark-read;
- expose active chat near-bottom state from the chat scroll hook;
- keep server rail and channel/member row badges consistent;
- preserve own-message, duplicate, mute, reconnect, and backend summary reconciliation behavior;
- update docs/status.

Out of scope:

- mentions, `@all`, reply attention metadata;
- OS/browser Notification API;
- native desktop popups/taskbar badges;
- backend unread contracts;
- DB schema/migrations;
- auth/session;
- storage/S3;
- WebRTC/media/LiveKit/SFU;
- staging DB reset;
- production Postgres work.

## Implementation

Runtime behavior:

- `getChatVisibilitySnapshot()` now exposes `isPageVisible` separately from `isActuallyVisible`;
- `useMarkChatRead()` uses `document.visibilityState === 'visible'` plus active chat near-bottom state, not `document.hasFocus()`, before marking the open chat read;
- `useChatScroll()` now returns a bounded near-bottom state using the existing 160 px threshold and resets that state when `chatId` changes;
- `ChatMessages` publishes the current active chat read boundary: server id, route parameter, and near-bottom state;
- scoped unread socket handling auto mark-reads active visible near-bottom events and does not increment scoped row unread for them;
- active visible scrolled-up events increment scoped row unread and are not treated as read until the user scrolls near bottom;
- global unread socket handling suppresses server rail unread and sound only for active visible near-bottom events;
- active visible scrolled-up events increment server rail unread but do not play sound for this segment;
- active hidden/minimized events remain unread/sound eligible unless globally or per-chat muted;
- server sidebar hides active row badges only when that active chat is at the read boundary, instead of hiding every active route badge unconditionally.

Diagnostics:

- Segment 201 diagnostics remain available with:

```js
localStorage.setItem('ax-connect:debug-unread-notifications', '1')
```

- added reason codes:
  - `active_visible_auto_read`
  - `active_visible_scrolled_up_unread`
  - `hidden_active_unread_sound_eligible`
  - `read_deferred_not_near_bottom`

## Behavior Before / After

Before:

- active visible chat required page focus before read suppression/mark-read could run;
- the active channel/member row badge was hidden by route equality even when unread had correctly accumulated while the user was scrolled up;
- global server rail and inner row badges could disagree around active scrolled-up and focus edge cases.

After:

- visible active chat at/near bottom auto mark-reads without a click, with no server rail badge, no row badge, and no sound;
- visible active chat scrolled up keeps unread and `New` state without force-scrolling and without sound;
- hidden/minimized active chat creates visual unread and remains sound eligible unless muted;
- opening or returning near bottom marks read and reconciles both scoped and global summaries;
- own messages still never create unread or sound;
- duplicate realtime events still do not double-increment or double-play sound;
- direct unread remains private on `member:${memberId}:direct-unread`;
- unread backend/API contracts and DB schema are unchanged.

## Verification

Passed locally:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Manual smoke:

- pending two-user browser smoke for active visible channel/DM near-bottom, active visible scrolled-up, hidden/minimized active chat, different channel, different server, muted channel/DM, reload/reconnect, and desktop runtime review.

## Handoff Requirements

Return:

- root cause;
- changed files;
- exact read-vs-notification behavior before/after;
- whether `document.hasFocus()` still gates read;
- how near-bottom/read visibility is determined;
- direct unread privacy status;
- summary invalidation/reconciliation behavior;
- verification output;
- manual smoke result;
- risks;
- PowerShell-safe git commands.
