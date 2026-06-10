# Segment Brief 190: Customer Unread Direct Message Privacy And Access Fix

## Metadata

- Branch: `feature/customer-unread-message-badges-foundation`
- Segment: `customer-unread-direct-message-privacy-and-access-fix`
- Type: privacy/access correction for unread foundation
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Close the blocker found during review of the unread badge foundation: direct-message unread realtime must not be broadcast server-wide, and direct-message history reads must require conversation membership.

## Changes

- `GET /api/direct-messages?conversationId=...` now calls the existing conversation membership resolver before querying messages.
- Direct unread realtime no longer uses `server:${serverId}:unread`.
- Direct unread realtime uses `member:${recipientMemberId}:direct-unread`.
- Direct unread events are emitted only to the recipient member id, not the sender.
- Direct unread payload no longer includes `memberIds`.
- Client unread subscription now listens to:
  - `server:${serverId}:unread` for channel unread;
  - `member:${currentMemberId}:direct-unread` for direct unread.
- Missing read-state fallback uses `currentMember.createdAt` instead of `new Date(0)`.

## Not Touched

- database schema beyond the existing unread foundation migration;
- unread sound;
- mentions/replies;
- WebRTC/media;
- storage/S3;
- production or staging data.

## Verification

Passed after this fix:

```bash
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Manual two-user smoke remains required before merge.
