# Segment Brief 217: Customer Reply Attention Unread Foundation

- Branch: `feature/customer-reply-attention-unread-foundation`
- Segment: `customer-reply-attention-unread-foundation`
- Status: `planned / ready for implementation`
- Base: latest `origin/core/reborn`
- Priority: P1 customer chat attention workflow after reply foundation and reply preview mention polish

## Goal

Make replies to a user's message produce a clear attention signal in unread summaries and realtime badges.

When another user replies to my channel message or direct message, I should be able to distinguish that from ordinary unread activity. This should use the existing `replyCount` and `attentionLevel: 'reply'` contract fields that already exist in app-core and unread DTOs.

This segment is not a reply visual redesign and not scroll-to-original. It is the first reply attention/unread slice.

## Product Decision

Use Discord/Telegram-like attention semantics, adapted to the current unread model:

- a reply to my message counts as normal unread if I have not read that chat;
- the same event also increments `replyCount` for me and promotes `attentionLevel` to `reply`, unless a mention attention is also present;
- mention attention outranks reply attention: `mention > reply > unread > none`;
- replying to my own message must not create my own unread/reply attention;
- if I am already in the active visible near-bottom chat, it should be marked read and no badge/sound should remain;
- if I am in the active chat but the window/tab is hidden/minimized/unfocused, reply events remain unread and sound-eligible;
- if I am active visible but scrolled up, keep visual unread/reply attention but do not play sound or force-scroll;
- global notification sound and per-chat mute rules still apply. Muted chats should not play sound for replies, but visual unread/reply attention should remain.

## Current Context

- Segment 215 added durable `replyToMessageId` / `replyToDirectMessageId`.
- Segment 216 made reply preview mentions readable/highlighted.
- `packages/app-core/src/contracts/domain.ts` already defines:
  - `replyCount`
  - `attentionLevel: 'reply'`
- `packages/app-core/src/contracts/message-slice-realtime.ts` already includes `replyCount` and `attentionLevel` in unread realtime payloads.
- `apps/api/src/modules/unread/unread.service.ts` already has `getAttentionLevel(unread, mention, reply)`, but current channel/direct summary items pass `replyCount: 0`.
- `apps/api/src/modules/messages/messages.controller.ts` and `apps/api/src/modules/direct-messages/direct-messages.controller.ts` currently emit unread realtime events with `replyCount: 0`.
- Mention attention currently uses `mentionedMemberIds` so each client can locally decide whether a channel broadcast applies to that member.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`

Docs:
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_189_CUSTOMER_UNREAD_MESSAGE_BADGES_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_190_CUSTOMER_UNREAD_DIRECT_MESSAGE_PRIVACY_AND_ACCESS_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_194_CUSTOMER_UNREAD_REALTIME_IDEMPOTENCY_RECONNECT_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_203_CUSTOMER_UNREAD_ACTIVE_VISIBLE_READ_SEMANTICS_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_215_CUSTOMER_REPLY_TO_MESSAGE_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_216_CUSTOMER_REPLY_PREVIEW_MENTION_RENDERING_POLISH.md`

## Inspect First

Backend/API:
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `apps/api/src/modules/unread/unread.service.ts`
- `apps/api/src/modules/realtime/realtime.events.ts`

Contracts/SDK:
- `packages/app-core/src/contracts/domain.ts`
- `packages/app-core/src/contracts/message-slice-realtime.ts`
- `packages/sdk/src/queries/unread.ts`

Client unread/realtime:
- `src/lib/shared/data-access/unread/unread-attention.ts`
- `src/lib/shared/data-access/unread/use-unread-socket.ts`
- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`
- `src/lib/shared/data-access/unread/unread-notification-sound.ts`
- `src/lib/server-list/features/server-channel.tsx`
- `src/lib/server-list/features/server-member.tsx`
- `src/lib/navigation/features/navigation-item.tsx`

## In Scope

1. Backend unread summary:
   - count unread channel messages that reply to the current member's messages;
   - count unread direct messages that reply to the current member's direct messages;
   - expose `replyCount` through existing summary DTOs;
   - keep `attentionLevel` precedence as `mention > reply > unread > none`.
2. Realtime unread events:
   - channel message-created events should provide enough data for each client to apply reply attention only if the reply targets that member's message;
   - direct message-created events are already recipient-specific and should set `replyCount: 1` only when replying to the recipient's message;
   - sender should not get own unread/reply attention.
3. Client unread cache:
   - update reply attention handling in scoped and global unread sockets;
   - preserve current mention logic and ensure mention still outranks reply;
   - keep active visible read-boundary behavior from Segment 203.
4. UI:
   - reuse existing attention badge/row emphasis paths where practical;
   - if reply attention needs a distinct small visual treatment, keep it subtle and document it;
   - do not redesign sidebar rows.
5. Docs/status updates for Segment 217.

## Out Of Scope

- New DB schema/migrations.
- Reply notification preferences persisted on backend.
- New realtime event type.
- Scroll-to-original.
- Reply preview visual redesign.
- Thread UI or partial quotes.
- Mention parser changes.
- Link previews.
- Message copy changes.
- File transfer/storage changes.
- Auth/session changes.
- Media/WebRTC work.
- Staging/prod migration execution.

## Constraints

- Do not reset any database.
- Do not run staging/prod migrations.
- Direct unread privacy must stay on `member:${memberId}:direct-unread`.
- Channel unread may remain server-scoped broadcast, but each client must only promote reply attention for its own member.
- Existing normal unread count must remain correct.
- Existing mention attention must remain correct and higher priority than reply attention.
- Sound must respect existing global and per-chat mute settings.
- Shared UI changes must keep desktop config green.
- Do not commit automatically.
- Feature branch must be created from latest `origin/core/reborn` and must not track `origin/core/reborn`; verify with `git status --short --branch`.

## Expected Implementation Shape

Backend:
- for channel created-message unread payload, include reply target member information analogous to `mentionedMemberIds`, for example `repliedToMemberId` or `replyTargetMemberIds`;
- for direct created-message unread payload, compute whether the reply target belongs to the recipient;
- update unread summary counts by querying messages/directMessages where the reply target's `memberId` is the current member and the new message is unread/non-deleted/not authored by current member.

Client:
- extend the existing unread attention helper so it can compute member-specific `replyCount` for channel broadcasts;
- keep `mentionCount` logic intact;
- update scoped/global unread cache increments to add reply counts;
- update attention styling only if existing `attentionLevel: 'reply'` already produces acceptable output. If it currently looks identical to normal unread, add a minimal distinct marker after inspection.

## Acceptance Criteria

Channel:
- User A sends a normal message.
- User B replies to A's message while A is not actively reading at the read boundary.
- User A sees unread count plus reply attention on the channel/server.
- User C does not get reply attention for B's reply to A, though C may get ordinary unread if applicable.
- User B does not get own unread/reply attention.
- If B's reply also mentions C, C gets mention attention and mention outranks reply where applicable.

Direct:
- User A sends a DM.
- User B replies to A's DM.
- User A gets direct unread plus reply attention.
- User B does not get own unread/reply attention.

Read behavior:
- opening/read-boundary clears reply attention with normal mark-read;
- active visible near-bottom chat suppresses persistent unread/reply attention;
- active visible scrolled-up keeps visual unread/reply attention without sound;
- hidden/minimized active chat can produce sound unless muted.

Regression:
- existing normal unread still works;
- existing mention attention still works;
- per-chat mute blocks sound only, not visual attention;
- reload restores reply attention from backend summary;
- reconnect/focus reconciliation does not duplicate reply counts.

## Manual Smoke

Run authenticated 3-user channel smoke:

1. A sends `base from A`.
2. B replies to A while A is in another channel/server or hidden.
3. Confirm A sees reply attention; C does not see reply attention for that reply.
4. A opens the channel near bottom; confirm reply attention clears.
5. B replies to A while A is scrolled up in the same channel; confirm visual attention remains and no sound is expected.
6. B replies to A while A's tab/window is hidden; confirm sound follows existing mute setting.
7. B replies to A and includes `@C`; confirm C receives mention attention, not just reply.

Run direct smoke:

1. A sends DM to B.
2. B replies to A's DM while A is away.
3. Confirm A sees direct reply attention and sound follows mute setting.
4. Confirm reload restores the summary until A opens/reads the DM.

## Verification Commands

Run from repo root in PowerShell:

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

If implementation touches no Prisma schema, do not run migrations. If Prisma schema is unexpectedly changed, stop and explain why before running migration commands.

## Handoff Format

Do not commit automatically.

Return:
- branch and base commit;
- changed files;
- backend summary behavior;
- realtime payload shape;
- client attention behavior;
- UI behavior for `attentionLevel: 'reply'`;
- explicit confirmation that DB schema/migrations were not changed, or a clear explanation if they were;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`feat(customer): add reply attention unread state`
