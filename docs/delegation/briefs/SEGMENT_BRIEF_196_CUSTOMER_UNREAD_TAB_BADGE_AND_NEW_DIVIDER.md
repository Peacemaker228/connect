# Segment Brief 196: Customer Unread Tab Badge And New Divider

## Metadata

- Branch: `feature/customer-unread-tab-badge-new-divider`
- Base: latest `core/reborn`
- Segment: `customer-unread-tab-badge-new-divider`
- Type: customer-priority unread visibility
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Improve unread visibility without adding a full notification system:

- show global unread count in the browser tab title;
- show a `Новое` divider above the first unread loaded message when opening a channel or direct conversation with unread messages.

## Backend / Contract

Extended existing server-scoped unread summary items with a backend-owned read anchor:

```ts
ChannelUnreadSummaryItemDto.lastReadAt
ConversationUnreadSummaryItemDto.lastReadAt
```

Behavior:

- `lastReadAt` is the persisted read-state timestamp when it exists;
- fallback remains the current member's `createdAt`, matching the existing unread count baseline;
- mark-read responses return the new `lastReadAt` used for the write;
- no schema or migration changes were added.

Existing endpoints remain:

- `GET /api/unread/servers/:serverId/summary`
- `GET /api/unread/servers/summary`
- channel/direct mark-read endpoints.

## Client

Chat:

- `ChatMessages` reads the current server unread summary before mark-read;
- it captures the current channel/direct `lastReadAt` once before mark-read clears unread;
- it renders `Новое` above the earliest loaded unread message after that anchor;
- own messages and deleted messages are ignored for divider placement;
- active chat mark-read behavior is preserved.

Browser title:

- added a client-only document title component under the main authenticated layout;
- title uses `totalUnreadCount` from global unread summary;
- count format is `(N) Ax-Connect` and caps at `(99+)`;
- title returns to the normal base title when the count reaches zero;
- no timers, polling, favicon changes, Notification API, or native badge APIs were added.

Realtime/cache:

- existing global/per-server unread realtime reconciliation remains the source of freshness;
- direct unread optimistic cache items now include a temporary `lastReadAt` anchor so the extended DTO stays valid until backend reconciliation.

## Not Included

- sound notifications;
- OS/browser Notification API;
- PWA/App Badge API;
- notification settings/mute;
- mentions, `@all`, replies;
- link previews;
- copy/reply message actions;
- storage/S3;
- WebRTC/media;
- Prisma schema migration;
- staging/prod deploy or DB commands.

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

- two authenticated users;
- unread in inactive channel/direct;
- browser title count update and clear;
- `Новое` divider on first open;
- reload does not resurrect divider after read;
- existing channel/member/server badges still work.

## Risks / Follow-ups

- If the true first unread message is older than the currently loaded page, the divider is placed above the first unread message present in the loaded range; the client does not fetch the whole history for this segment.
- Segment 194 first-event-after-idle watch item remains unchanged.

## Next Segment

Recommended next segment:

- `customer-unread-sound-and-notification-settings`
