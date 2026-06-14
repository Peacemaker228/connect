# Segment Brief 215: Customer Reply To Message Foundation

- Branch: `feature/customer-reply-to-message-foundation`
- Segment: `customer-reply-to-message-foundation`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Base: latest `origin/core/reborn`
- Priority: P1 customer chat workflow after mention chip navigation

## Goal

Implement the first durable Discord/Telegram-like reply-to-message slice for channel and direct chats.

This slice should let a user choose `Reply`, show reply context in the composer, persist the reply relationship, and render a compact quoted preview above the sent message for all participants after reload/realtime delivery.

This is not Slack-style threads. Replies stay in the normal message timeline.

## Product Decision

Use a calm Discord-like inline reply model:

- message row action: `Reply`;
- composer reply bar: original author + short preview + cancel button;
- sent message: compact quoted block above normal content/file row;
- deleted/inaccessible original: safe fallback label;
- no separate thread pane;
- no partial quote selection in this first slice;
- no reply attention/sound/badge semantics in this first slice.
- message edits preserve the original reply target; changing reply targets during edit is a future product decision.
- newly added reply attention during edit/create is not part of this slice.
- reply previews are rendered from persisted metadata; scrolling/navigating to the original message is deferred.
- message deletion is soft-delete in the current runtime, so deleted originals render a safe fallback; hard-delete/original cleanup policy is not changed here.

Future slices can add:

1. `customer-reply-attention-unread`;
2. `customer-reply-navigation-polish`;
3. optional Telegram-like partial quote or richer thread UI, only if product feedback demands it.

## Implementation Result

Delivered locally:
- added additive reply columns and indexes for channel `Message` and direct `DirectMessage`, aligned with the current `relationMode = "prisma"` migration chain and without database-level foreign keys;
- added endpoint-specific reply target validation so channel replies must target the same channel and direct replies must target the same conversation;
- extended the shared chat message DTO with common `replyTo` preview data and a single create payload field, `replyToMessageId`;
- existing created-message realtime payloads now carry the reply preview because the existing message payload is enriched;
- added a local `ChatReplyProvider` around `ChatMessages` and `ChatInput`, so reply state resets on chat change, cancel, successful send, and unmount;
- added a `Reply` row action for non-deleted channel/direct messages;
- added a composer reply bar with author, short preview, and cancel control;
- added compact inline reply previews above sent messages;
- deleted originals show a safe fallback label through the existing soft-delete path.

Kept out of scope:
- reply attention/badges/sound and `replyCount` increments;
- scroll-to-original/navigation;
- partial quotes, threads, link previews, auth/storage/media changes, and staging/prod migration execution.

## Current Context

- Channel messages use Prisma model `Message`.
- Direct messages use Prisma model `DirectMessage`.
- Current chat UI uses one shared `ChatMessageDto` shape in the client, even though channel and direct rows come from different backend tables.
- Current create/update/delete mutations share `packages/sdk/src/mutations/message.ts`.
- Current infinite chat read path is in `packages/sdk/src/queries/chat.ts`.
- Current realtime delivery uses `createChatMessageCreatedRealtimeEvent(chatId, message)` and update events.
- Existing unread API shape already has `replyCount` and `attentionLevel: 'reply'`, but reply attention is explicitly out of scope for this segment.
- Existing composer and row actions already include send, edit, delete, copy, file upload, mention picker, and mention navigation.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/architecture-docs.md`
- `rules/review/mini-review.md`

Docs:
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_206_CUSTOMER_MESSAGE_COPY_ACTION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_207_CUSTOMER_MESSAGE_EDIT_MODE_CORRECTNESS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_208_CUSTOMER_MESSAGE_EDIT_MENTION_PICKER.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_209_CUSTOMER_CHAT_SEND_BUTTON.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_214_CUSTOMER_MENTION_CHIP_NAVIGATION.md`

## Inspect First

Schema/contracts:
- `prisma/schema.prisma`
- `packages/app-core/src/contracts/domain.ts`
- `packages/app-core/src/schemas/chat-input-schema.ts`
- `packages/app-core/src/contracts/message-slice-realtime.ts`

Backend:
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `apps/api/src/modules/realtime/realtime.events.ts`

SDK/client:
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/queries/chat.ts`
- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/chat-input.tsx`
- existing i18n files for chat row/composer strings.

## In Scope

1. Add an additive Prisma migration for durable reply relationships.
   - Channel `Message` replies must only reference messages in the same channel.
   - Direct `DirectMessage` replies must only reference messages in the same conversation.
   - Add indexes for reply lookup.
   - Do not reset any DB.
2. Extend shared domain DTOs with a compact reply preview shape.
   - Include enough data to render author, deleted state, short text/file fallback, and original id.
   - Keep the shape compatible with both channel and direct messages.
3. Extend message create payload to include a reply target id.
   - Prefer one client payload field if practical, e.g. `replyToMessageId`, with endpoint-specific validation in channel/direct services.
   - If a clearer shape is needed, document it explicitly.
4. Validate reply target server-side.
   - Channel reply target must exist in the same channel and be accessible to the current member.
   - Direct reply target must exist in the same conversation and be accessible to the current member.
   - Cross-channel/cross-conversation replies must be rejected.
   - Self-reply is allowed if the target is in the same chat.
5. Include reply preview data in message list responses and created-message realtime payloads.
6. Add a `Reply` row action for non-deleted channel/direct messages.
7. Add composer reply state.
   - It must work for channel and direct chats.
   - It should be local to the active chat and reset on chat change, send, cancel, and unmount.
   - Prefer a small chat reply context/provider or equivalent local state shared by `ChatMessages` and `ChatInput`; do not use localStorage.
8. Add a composer reply bar above the input.
   - Show original author and compact preview.
   - Include a cancel button.
   - Preserve current focus behavior after selecting/canceling reply.
9. Render a compact quoted reply block above the message content/file row.
   - Show author and preview.
   - Use a calm Discord-like visual style that fits the current dark UI.
   - Deleted or inaccessible originals must show a safe fallback such as `Message deleted` / `Сообщение удалено`.
10. Preserve existing behavior:
   - send button;
   - Enter / Shift+Enter;
   - screenshot paste;
   - file upload;
   - mention picker;
   - mention navigation;
   - edit/delete/copy actions;
   - link rendering;
   - unread/realtime normal flow.

## Out Of Scope

- Reply attention/badges/sound semantics.
- `replyCount` incrementing in unread summaries.
- Browser/desktop native notifications for replies.
- Scroll-to-original if the original message is outside the loaded range.
- Loading around an original message.
- Separate thread UI.
- Partial quote selection.
- Replying across chats.
- Replying to multiple messages at once.
- Editing an existing message to change its reply target.
- Mention parser changes.
- Link preview/unfurl.
- Storage policy changes.
- Auth/session changes.
- Media/WebRTC changes.
- Staging/prod migration execution.

## Constraints

- Additive migration only.
- No destructive migrations.
- No DB reset / force reset.
- No staging DB reset.
- No production Postgres migration work in this segment.
- Do not touch WebRTC/media staging work.
- Direct unread privacy must stay unchanged.
- Existing normal unread behavior must stay unchanged. Reply attention is a later segment.
- Desktop-first: shared chat UI changes must keep `bun.cmd run check:desktop:config` green.

## Expected Implementation Shape

Schema:
- Add nullable self-reference fields to `Message` and `DirectMessage`, or an equivalent minimal additive model.
- Prefer self-reference fields over a polymorphic table unless inspection proves the existing schema makes that unsafe.
- Include reply preview relation data in existing query includes.

Backend:
- Keep channel and direct validation in their respective services.
- Keep controller realtime emission on the existing chat message created event.
- Do not add a new realtime event for reply foundation unless strictly necessary.

Client:
- Keep reply state close to chat UI. A small client provider/context around `ChatMessages` and `ChatInput` is acceptable.
- Prefer existing shared/shadcn/Radix primitives for buttons/tooltips where appropriate.
- Use `lucide-react` `Reply` / `X` icons where useful.
- The reply bar and quoted block should not be nested cards.
- Keep text compact and desktop-friendly.

Preview:
- Short text preview should be bounded/truncated.
- File-only messages should show a generic attachment preview label.
- Deleted messages should show a deleted fallback and not leak deleted content.

## Acceptance Criteria

- User can click `Reply` on a non-deleted channel message.
- Composer shows reply context and a cancel control.
- Sending creates a message linked to the original channel message.
- Reply survives reload.
- Other connected participants receive/render the reply preview through existing realtime message delivery.
- User can click `Reply` on a non-deleted direct message.
- Direct reply survives reload and renders for both participants.
- Cross-channel/cross-conversation reply targets are rejected server-side.
- Deleted original renders a safe fallback after reload at minimum.
- Existing send/edit/delete/copy/mention/link/file behaviors still work.
- No reply attention badge/sound claims are made in this segment.

## Manual Smoke

Run authenticated web smoke:

Channel:
1. User A replies to User B's text message.
2. Confirm reply bar appears before send.
3. Cancel reply and confirm normal send has no reply preview.
4. Reply again and send.
5. Confirm User A and User B both see the quoted preview.
6. Reload both users and confirm reply preview remains.
7. Delete the original message and reload; confirm safe deleted fallback.

Direct:
1. User A replies to User B's DM text message.
2. Confirm both users see the preview.
3. Reload both users and confirm persistence.

Regression:
1. Send normal text without reply.
2. Send message with mention.
3. Send message with link.
4. Send file/image attachment if available.
5. Copy a reply message and confirm copy does not produce broken values.
6. Edit/delete owner permissions still work.
7. Quick desktop config check remains green.

Security/access negative checks:
1. Try API payload with a reply target from another channel; expect rejection.
2. Try API payload with a reply target from another conversation; expect rejection.

## Verification Commands

Run from repo root in PowerShell:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x prisma generate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

If local disposable Postgres is available, also run migration verification against local/dev only:

```powershell
bun.cmd x prisma migrate dev
bun.cmd x prisma migrate status
```

Do not run staging/prod migrations in this implementation segment.

## Handoff Format

Do not commit automatically.

Return:
- branch and base commit;
- changed files;
- migration name;
- schema/DTO/API shape;
- channel reply behavior;
- direct reply behavior;
- deleted original behavior;
- explicit out-of-scope items that remain deferred;
- verification results;
- manual smoke status;
- PowerShell-safe git add/commit commands.

Suggested commit message:

`feat(customer): add reply to message foundation`
