# Segment Brief 195: Customer Global Unread Summary And Server Badges

## Metadata

- Branch: `feature/customer-global-unread-summary-and-server-badges`
- Base: latest `core/reborn`
- Segment: `customer-global-unread-summary-and-server-badges`
- Type: customer-priority global unread visibility
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Add global unread visibility across accessible servers so unread messages in an inactive server are visible from the server rail.

## Backend

Added global unread endpoint:

- `GET /api/unread/servers/summary`

Response shape:

```ts
{
  totalUnreadCount: number
  servers: Array<{
    serverId: string
    memberId: string
    unreadCount: number
    mentionCount: number
    replyCount: number
    attentionLevel: 'none' | 'unread' | 'mention' | 'reply'
  }>
}
```

Behavior:

- includes all servers accessible to the current profile;
- aggregates normal channel and direct unread counts per server;
- excludes own messages and deleted messages through the same read-state logic as the existing per-server summary;
- includes the current member id per server so the client can subscribe to private direct unread keys across all servers;
- does not add mention/reply detection.

Existing server-scoped endpoint remains:

- `GET /api/unread/servers/:serverId/summary`

## Client

Added SDK query:

- `useGlobalUnreadSummary()`
- `getGlobalUnreadSummaryQueryKey()`

Mark-read mutations now invalidate global unread summary after successful channel/DM read.

Added global rail realtime hook:

- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`

Realtime behavior:

- subscribes to `server:${serverId}:unread` for all accessible servers returned by global summary;
- subscribes to `member:${memberId}:direct-unread` for each current member id returned by global summary;
- ignores own messages;
- ignores active channel/DM events so the active route does not show false unread;
- optimistically increments global server unread counts as a fast path;
- invalidates global unread summary after events, duplicate events, reconnect/connect, browser focus, and visibility return;
- keeps Segment 194 duplicate-event guard pattern for global cache updates.

## UI

Server rail:

- `NavigationItem` shows a compact red count badge on servers with unread;
- count caps at `99+`;
- the left rail indicator is slightly taller for unread inactive servers.

Server sidebar rows:

- unread text channels use stronger text/icon contrast and bolder text;
- unread DM/member rows use stronger text and bolder weight;
- numeric row badges are preserved;
- active route still receives `0` unread from `ServerSidebar`, so it does not show false unread emphasis.

## Not Included

- sound;
- browser tab badge;
- desktop native notifications;
- `New` divider;
- mentions, `@all`, replies;
- link previews;
- copy/reply message actions;
- WebRTC/media;
- storage/S3;
- Prisma migrations;
- staging or production DB changes.

## Verification

Passed:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Manual smoke pending:

- two users;
- two servers if possible;
- unread in inactive server shows server rail badge;
- opening server and relevant channel/DM clears appropriate unread;
- own messages do not create own unread;
- channel/direct unread still work inside active server;
- row visual emphasis appears only for unread rows;
- reload restores global unread state;
- no duplicate increment regression from Segment 194.

## Review Follow-ups

Non-blocking findings to keep visible:

- global unread summary currently uses per-server/per-channel/per-conversation count queries; acceptable for the current customer slice, but should be watched and optimized before larger-scale server/channel usage;
- global `attentionLevel` is currently normal-unread only; revisit aggregation when mention/reply/`@all` metadata is implemented;
- do not claim deploy/product pass until a two-user / two-server manual smoke confirms inactive-server badge behavior, clear-on-open, reload restore, and no duplicate increment regression.

## Next Segment

`customer-new-message-divider`
