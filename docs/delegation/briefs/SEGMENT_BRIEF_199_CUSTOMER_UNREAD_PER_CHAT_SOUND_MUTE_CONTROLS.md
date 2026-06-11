# Segment Brief 199: Customer Unread Per-Chat Sound Mute Controls

## Metadata

- Branch: `feature/customer-unread-per-chat-sound-mute-controls`
- Base: latest `origin/core/reborn`
- Segment: `customer-unread-per-chat-sound-mute-controls`
- Type: customer-priority notification UX
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Allow users to mute unread notification sound for a specific channel or direct conversation without disabling visual unread badges, counts, row emphasis, server rail badges, tab title count, or the `New` divider.

## Implementation

Storage:

- per-chat mute state is browser-local for this slice;
- storage key: `ax-connect:unread-notification-muted-scopes`;
- value shape: JSON string array of muted scope keys;
- channel scope: `channel:${serverId}:${channelId}`;
- direct conversation scope: `conversation:${serverId}:${memberId}`;
- the existing global sound setting remains under `ax-connect:unread-notification-sound-enabled`.

Sound blocking:

- accepted unread realtime events still pass through the existing own-message, active-chat, access/current-member, and duplicate-event guards;
- after those guards, the sound helper resolves the scope from the realtime payload;
- channel payloads use `payload.serverId` plus `payload.channelId`;
- direct payloads use `payload.serverId` plus `payload.senderMemberId`, matching the recipient-side member row/conversation route;
- `playUnreadNotificationSoundOnce` receives `enabled && !isScopeMuted`;
- the message id is still marked in the bounded sound dedupe map even when global sound or a specific scope is muted, so replayed old events do not sound later after unmute.

UI:

- channel rows expose a compact speaker/mute control on hover/focus;
- direct member rows expose the same control;
- muted rows keep the muted icon visible;
- clicking or pressing Enter/Space on the control stops row navigation and toggles only the local sound mute state;
- unread badges/counts and row emphasis are not changed by mute state.

## Not Included

- backend persistence for notification settings;
- DB schema/migrations;
- server-wide mute settings;
- OS/browser Notification API;
- native desktop popups;
- taskbar/app icon badge;
- mentions, `@all`, replies;
- link previews;
- copy/reply;
- storage/S3;
- WebRTC/media;
- staging/prod deploy.

## Verification

Passed:

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

Manual smoke pending:

- two users / two browsers;
- mute one channel, send message there, confirm badge/count appears with no sound;
- send message to unmuted channel, confirm badge/count and sound;
- mute one direct conversation, send message there, confirm visual unread with no sound;
- global sound off overrides per-chat unmuted state;
- reload preserves per-chat mute state in the same browser;
- active chat and own messages still do not sound.

## Risks / Follow-ups

- Mute state is local to the browser/device. Backend profile persistence remains a future notification-settings segment.
- Server-wide mute is intentionally not implemented in this slice.

## Next Segment

Recommended next segment:

- `customer-mentions-replies-attention`

Alternative if notification controls remain more urgent:

- `customer-notification-settings-backend-persistence`
