# Segment Brief 201: Customer Unread Notification Pipeline Reliability

## Metadata

- Branch: `feature/customer-unread-notification-pipeline-reliability`
- Base: latest `core/reborn`
- Segment: `customer-unread-notification-pipeline-reliability`
- Type: customer-priority notification/realtime reliability
- Status: `pass / implemented locally; manual notification smoke pending`
- Commit policy: do not commit automatically; provide PowerShell-safe `git add` and `git commit` commands in the handoff

## Context

Unread notification behavior already had persisted unread state, channel/direct badges, global server badges, browser title count, `Новое` divider, notification sound, a global sound toggle, and per-channel/per-DM sound mute.

Observed reliability issue:

- messages/badges could arrive while sound did not play;
- the previous decision path made it hard to tell whether the signal was lost at route-active suppression, mute/global preference, dedupe, or browser audio policy;
- active-chat suppression used route equality as a visibility proxy, so the same open chat was treated as seen even when the tab/window was hidden, minimized, or unfocused.

## Goal

Make each incoming unread realtime message produce an explainable client-side decision:

- own message ignored;
- duplicate ignored;
- inaccessible/missing server context ignored;
- active visible chat suppressed and marked/read through the scoped path;
- active hidden/unfocused chat remains unread/sound eligible;
- global or per-chat mute blocks sound while visual unread remains;
- sound playback success/failure is diagnosable.

## Scope

In scope:

- visibility/focus-aware active-chat handling;
- small shared visibility helper;
- bounded non-secret notification diagnostics behind a localStorage debug flag;
- sound playback result reporting;
- preserving own-message and duplicate guards;
- preserving global/per-chat mute behavior;
- preserving backend reconcile on events/focus/reconnect;
- docs/status updates.

Out of scope:

- OS/browser Notification API;
- native desktop popups;
- taskbar/app badge;
- mentions, `@all`, replies;
- DB schema/migrations;
- storage/S3;
- auth/session changes;
- WebRTC/media/LiveKit/coturn;
- staging DB reset;
- production Postgres work.

## Implementation

Runtime behavior:

- added `getChatVisibilitySnapshot()` / `isPageActuallyVisibleForChat()`;
- active chat is now considered visibly seen only when `document.visibilityState === 'visible'` and `document.hasFocus()` is true;
- `useUnreadSocket()` only auto mark-reads active channel/DM events when the page is actually visible/focused;
- hidden/minimized/unfocused active chat events update unread cache and reconcile like inactive chat events;
- `useMarkChatRead()` now marks the open chat read only when the page is actually visible/focused, and re-runs on `focus` / `visibilitychange`;
- `useGlobalUnreadSocket()` only suppresses global unread/sound for active visible chat;
- active hidden/unfocused chat events remain eligible for global unread/title/server badge and sound unless muted;
- `playUnreadNotificationSoundOnce()` now returns a playback decision result: `played`, `failed`, `deduped`, `disabled`, or `not_available`.

Diagnostics:

- added a bounded in-memory ring buffer and optional console diagnostics;
- enable with:

```js
localStorage.setItem('ax-connect:debug-unread-notifications', '1')
```

- inspect latest entries in the browser with:

```js
window.__axUnreadNotificationDebug.getEntries()
```

- entries include non-secret fields only: scope, visible server/channel/conversation/member ids, message id, reason code, visibility state, focus state, global sound enabled, per-scope muted, and browser sound failure name when available.

Reason codes:

- `ignored_own_message`
- `ignored_duplicate`
- `ignored_inaccessible_context`
- `active_visible_suppressed`
- `sound_blocked_global`
- `sound_blocked_scope`
- `sound_deduped`
- `sound_not_available`
- `sound_played`
- `sound_failed`

## Behavior Before / After

Before:

- active route always suppressed global unread/sound even when the tab/window was hidden or unfocused;
- active route events in the scoped unread hook were immediately mark-read regardless of page visibility;
- sound playback failures were intentionally silent and not classifiable;
- mute/global/dedupe decisions were not observable without stepping through code.

After:

- visible/focused active chat stays quiet and mark-read behavior is preserved;
- hidden/minimized/unfocused active chat is treated as not visibly seen, so unread/title/server badge and sound remain eligible;
- muted chats still suppress only sound while visual unread remains;
- duplicate realtime events do not double-play sound;
- reload/focus/reconnect summary refetches do not play historical sound;
- debug flag exposes reason-coded notification decisions.

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

- pending two-user browser smoke for channel and DM visible-active, hidden-active, muted, duplicate, reload, focus, and debug reason-code cases.

## Handoff Requirements

Return:

- root cause or narrowed diagnosis;
- changed files;
- exact notification decision behavior before/after;
- whether active-chat hidden/minimized behavior changed;
- whether sound diagnostics were added and how to enable them;
- whether unread socket contracts changed;
- whether backend/API/DB changed;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe git commands.
