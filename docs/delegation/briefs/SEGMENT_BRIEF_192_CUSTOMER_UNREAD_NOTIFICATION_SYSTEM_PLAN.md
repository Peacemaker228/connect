# Segment Brief 192: Customer Unread Notification System Plan

## Metadata

- Branch: `feature/customer-prisma-active-postgres-migration-chain-repair`
- Segment: `customer-unread-notification-system-plan`
- Type: docs-only customer-priority notification UX plan
- Status: `pass / planned`

## Goal

Define the next unread/notification work as a coherent product track instead of scattering one-off UI badges, sounds, and mention logic across unrelated segments.

The current foundation already provides persisted normal unread counts for channels and direct conversations. The next work should build on that foundation in layers:

1. global/server-level unread visibility;
2. in-chat unread position visibility;
3. browser/desktop notification surfaces;
4. mention/reply attention as a separate stronger signal.

## Current Foundation

Implemented:

- persisted `ChannelReadState` and `ConversationReadState`;
- server-scoped unread summary;
- channel unread realtime event through `server:${serverId}:unread`;
- direct unread realtime event through `member:${memberId}:direct-unread`;
- compact red unread badges for channels and direct/member entries;
- active/open chat mark-read behavior;
- sender/own-message negative cases.

Not yet implemented:

- global unread summary across servers;
- server-list unread badges when another server receives unread messages;
- unread visual emphasis through row text/weight;
- in-chat `New` divider;
- browser tab unread indicator;
- desktop notification and desktop app badge behavior;
- sound/mute preferences;
- mention/reply/`@all` attention logic.

## Planned Segments

### 1. `customer-global-unread-summary-and-server-badges`

Purpose:
- make unread visible even when the user is currently looking at another server.

Expected scope:
- backend global unread summary for all accessible servers;
- per-server aggregate unread counts;
- server-list badge/dot in the left server rail;
- current server/channel/member list row emphasis for unread items;
- keep numeric counters for channels/direct conversations;
- keep normal unread separate from mention/reply attention.

Preferred design:
- backend remains the source of truth;
- client cache reconciles from summary plus Socket.IO events;
- no UI-only unread inference;
- no broad refactor of realtime transport.

Acceptance:
- unread in server A is visible while user is viewing server B;
- active server/channel/direct chat does not show false unread for messages already seen;
- sender does not get own unread;
- reload restores global/server/channel/direct unread state.

### 2. `customer-new-message-divider`

Purpose:
- when opening a chat with unread messages, show a clear divider line labeled `New` / `Новое` at the first unread message.

Expected scope:
- preserve or expose the read anchor before mark-read clears the unread state;
- place divider before the first message newer than the previous `lastReadAt`;
- support channel and direct conversations;
- avoid relying on transient DOM timing or client-only guesses.

Important constraint:
- the chat may mark the conversation read on open, but the divider needs the pre-open read state. The implementation must capture the read anchor before mark-read.

Acceptance:
- divider appears once at the first unread message;
- divider disappears or moves correctly after the chat is read and later receives new messages;
- reload does not create duplicate or stale dividers.

### 3. `customer-notification-sound-browser-desktop-badges`

Purpose:
- make unread visible outside the active chat and outside the browser tab, with user-controlled noise.

Expected scope:
- browser document title indicator, for example `(3) AxConnect`;
- optional favicon red dot or equivalent browser-tab unread marker;
- notification sound for new unread messages;
- mute setting for sound;
- desktop-first follow-up: native desktop notification and app/taskbar badge where supported;
- permission-aware and non-spammy notification behavior.

Preferred design:
- compute notification state from global unread summary and realtime unread events;
- respect active chat/read state;
- expose a user preference for sound/mute before making sound behavior noisy;
- web behavior first, then desktop verification through Electron.

Acceptance:
- browser tab indicates unread after incoming unread message;
- indicator clears when unread is cleared;
- sound plays only when allowed by preference and browser policy;
- desktop app behavior is verified separately from web.

### 4. `customer-mentions-replies-attention`

Purpose:
- distinguish normal chat activity from messages that require direct attention.

Expected scope:
- `@user`;
- `@all`;
- replies to the current user's messages;
- stronger visual state than normal unread;
- attention metadata in backend responses/events.

Important constraint:
- do not fake mention/reply attention by styling all normal unread as mentions.

## Design Notes

- Normal unread and attention unread are different concepts.
- Normal unread can use subtle bold/bright row text plus count badges.
- Mentions/replies should use a stronger marker and should be implemented only after metadata exists.
- Socket.IO remains the current realtime transport. Do not introduce SSE or long polling for this track.
- Desktop-first means web checks are not enough for notification work; desktop verification must be included when the segment touches desktop behavior.

## Not Included In This Plan Segment

- runtime code changes;
- new migration;
- staging/prod migration execution;
- mention/reply parser implementation;
- desktop native notification implementation;
- sound implementation.

## Recommended Next Segment

`customer-global-unread-summary-and-server-badges`

Reason:
- it is the missing foundation for server-level badges, browser title counts, and later desktop notifications. Building sound/browser/desktop indicators before global unread would create duplicated client-only state.
