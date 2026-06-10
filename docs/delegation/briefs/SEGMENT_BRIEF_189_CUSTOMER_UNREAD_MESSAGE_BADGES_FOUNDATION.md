# Segment Brief 189: Customer Unread Message Badges Foundation

## Metadata

- Branch: `feature/customer-unread-message-badges-foundation`
- Segment: `customer-unread-message-badges-foundation`
- Type: persisted unread/read-state foundation
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Add working unread indicators for channel and direct messages without relying on UI-only state.

Unread behavior:

- a message from another member in a non-active text channel creates a red badge on that channel;
- a direct message from another member in a non-active conversation creates a red badge on that member entry;
- own messages do not create own unread badges;
- deleted messages are excluded from backend summary counts;
- opening the channel/conversation marks it read through an idempotent backend upsert;
- reload restores unread state from backend summary.

## Schema

Added additive read-state models:

- `ChannelReadState`
  - unique by `memberId + channelId`
  - stores `lastReadAt`
- `ConversationReadState`
  - unique by `memberId + conversationId`
  - stores `lastReadAt`

Added supporting indexes:

- `Message @@index([channelId, createdAt])`
- `DirectMessage @@index([conversationId, createdAt])`

Migration:

- `prisma/migrations/20260610120000_add_unread_read_state/migration.sql`

The migration is additive. It creates read-state tables and baselines existing channel/conversation read states at migration time so historical messages do not become unread badges on first deploy. Runtime fallback for missing read state starts at the current member creation time, so a newly joined member does not inherit the full historical channel backlog as unread.

## Backend API

New module:

- `apps/api/src/modules/unread/*`

Endpoints:

- `GET /api/unread/servers/:serverId/summary`
  - returns channel unread counts for accessible text channels in the server;
  - returns conversation unread counts for conversations involving the current member;
  - excludes own messages and deleted messages;
  - uses `lastReadAt` comparison.
- `PATCH /api/unread/channels/:channelId/read?serverId=:serverId`
  - marks the current member's channel read state;
  - permission-checks server/channel access.
- `PATCH /api/unread/conversations/:conversationId/read`
  - marks the current member's conversation read state;
  - permission-checks conversation membership.

Summary item shape includes future attention fields:

```ts
{
  unreadCount: number
  mentionCount: number
  replyCount: number
  attentionLevel: 'none' | 'unread' | 'mention' | 'reply'
}
```

This segment sets only normal unread state. Mentions/replies remain future metadata-backed work.

## Realtime

Existing active-chat events are preserved:

- `chat:${chatId}:messages`
- `chat:${chatId}:messages:update`

Added unread events:

- `server:${serverId}:unread`
  - channel unread only
- `member:${memberId}:direct-unread`
  - direct unread only for the recipient member

Payload:

- channel message:
  - `scope: 'channel'`
  - `channelId`
  - `senderMemberId`
- direct message:
  - `scope: 'conversation'`
  - `conversationId`
  - `senderMemberId`

The client subscribes to the current accessible server id for channel unread and to the current member's direct-unread key for direct messages. Direct unread payloads do not include the full conversation member list.

Access fix:

- `GET /api/direct-messages?conversationId=...` now resolves conversation membership before returning messages, so a known `conversationId` is not enough to read another user's direct messages.

## Client/UI

Added SDK query/mutations:

- `packages/sdk/src/queries/unread.ts`

Added client hooks:

- `src/lib/shared/data-access/unread/use-unread-socket.ts`
- `src/lib/shared/data-access/unread/use-mark-chat-read.ts`

Updated UI:

- `ServerSidebar` fetches unread summary and subscribes to current server unread events.
- `ServerSidebar` also subscribes to the current member direct-unread key.
- `ServerChannel` renders a compact red count badge for text-channel unread.
- `ServerMember` renders a compact red count badge for direct-message unread.
- `ChatMessages` marks the current chat read on open.
- Incoming realtime messages for the currently active channel/conversation also trigger mark-read, so reload does not reclassify active-chat messages as unread.

Badges are normal unread indicators only. They intentionally do not imply direct mention or reply attention.

## Not Included

- notification sound / mute setting;
- mention parsing or `@all`;
- reply-to-message metadata;
- raw text parsing for fake mention/reply detection;
- WebRTC/media changes;
- staging DB reset or destructive Prisma commands;
- production Postgres migration work.

## Verification

Passed:

```bash
bun.cmd x prisma generate
bun.cmd x prisma validate
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Manual smoke pending:

- two authenticated users in the same server;
- channel unread badge appears for non-active channel message from another user;
- channel badge clears on open and survives reload while unread;
- direct-message member badge appears for non-active DM from another user;
- direct badge clears on open and survives reload while unread;
- own messages do not create unread badges;
- active chat realtime message insertion still works.

## Recommended Next Segment

`customer-unread-message-sound-toggle`

If sound remains intentionally split, continue after that to `customer-mentions-user-and-all`.
