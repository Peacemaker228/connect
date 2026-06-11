# Segment Brief 204: Customer Mentions Attention Foundation

## Metadata

- Branch: `feature/customer-mentions-attention-foundation`
- Base: latest `origin/core/reborn`
- Segment: `customer-mentions-attention-foundation`
- Type: customer-priority chat attention/unread foundation
- Priority: P1 after auth/unread/paste stability slices
- Commit policy: do not commit automatically. Return PowerShell-safe `git add` / `git commit` commands.

## Repository Reality

Checked before drafting:

- current source base: `core/reborn` contains Segment 202 screenshot paste/focus and Segment 203 active visible unread semantics;
- Wave 35 remains the active customer-priority track;
- unread summaries/realtime contracts already carry `mentionCount`, `replyCount`, and `attentionLevel`, but current message controllers still emit `mentionCount: 0`, `replyCount: 0`, and `attentionLevel: 'unread'`;
- `apps/api/src/modules/unread/unread.service.ts` currently computes mention/reply counts as zero placeholders;
- `Message` and `DirectMessage` currently have no persisted mention metadata.

## Implementation Result

Status: `implemented locally / command verification passed; manual smoke pending`

Delivered:

- Added additive channel-message mention metadata through `MessageMentionKind` and `MessageMention`.
- Resolved channel-message mentions server-side from stable `<@memberId>` / `<@all>` tokens and current raw `@DisplayName` / `@all` text.
- Allowed explicit self-mentions and `@all` self-target rows for rendering/target highlight, while own messages still do not create own unread or sound, and skipped ambiguous raw display-name matches.
- Returned mention metadata with chat messages and rendered mention chips in existing message text; raw `@name` / `@all` tokens render as fallback chips only when a client temporarily lacks the `mentions` metadata field.
- Highlighted the whole message only for the current member when backend mention metadata targets that member directly or through `@all`.
- Counted mention rows per recipient in server-scoped and global unread summaries.
- Added channel realtime `mentionedMemberIds` so only the mentioned recipient promotes a normal unread event to mention attention.
- Kept direct unread on recipient-private `member:${memberId}:direct-unread`.
- Kept normal unread, Segment 203 active visible read semantics, attachments, storage, auth, media/WebRTC, Notification API, link rendering, message copy, and reply-to-message behavior separate.

Known limitations:

- Mention autocomplete/picker UX is deferred; users can currently type supported tokens/text directly.
- Raw `@DisplayName` parsing intentionally skips duplicate display names; stable member tokens are the safer future picker output.
- UI/dev note: the stable supported member token is `<@memberId>`, not `@memberId`.
- Explicit self-mentions and `@all` self-target rows are persisted for rendering/highlight, but own messages still do not create own unread or sound.
- Edit-time mention metadata is recomputed and rendering updates through the existing message update event, but edit-created mention attention is not separately replayed as a new unread event in this foundation slice.
- Historical messages are not backfilled into mention rows.

Verification:

- `git diff --check`: pass, with existing CRLF conversion warnings only.
- `bun.cmd x prisma validate`: pass.
- `bun.cmd x prisma generate`: pass.
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass.
- `bun.cmd run typecheck:api`: pass.
- `bun.cmd run build:api`: pass.
- `bun.cmd x next lint`: pass.
- `bun.cmd run build:web`: pass.
- `bun.cmd run check:desktop:config`: pass.
- `bun.cmd x prisma migrate status`: initially reported `20260611130000_add_message_mentions` pending on local `connect_validation`.
- `bun.cmd x prisma migrate deploy`: pass on local `connect_validation`, applied only `20260611130000_add_message_mentions`.
- `bun.cmd x prisma migrate status`: pass after deploy, local `connect_validation` schema up to date.

Manual smoke:

- Initial smoke stopped on rendering/attention findings: mention chips could differ between clients when one client lacked the `mentions` metadata field, `@all` remained unproven, stable syntax needed explicit documentation, and target-user whole-message highlight was missing.
- Pending repeat two/three-user authenticated browser smoke for plain unread, `@user`, explicit self-mention rendering/highlight, `@all` including sender rendering/highlight, sender own-message unread/sound negative case, non-target normal unread, active-visible auto-read, scrolled-up/hidden attention, read clearing, reload restore, muted channel visual attention, and desktop runtime review.

## Goal

Add the first metadata-backed mention/attention slice so normal unread and direct attention are no longer conflated.

Users should be able to send channel messages that mention:

- one or more server members;
- `@all` for everyone in the channel/server scope, including the sender for rendering/highlight.

Mentioned recipients should get stronger attention metadata through backend summaries and realtime unread events, while non-mentioned recipients still get normal unread only.

## Required Reading

Rules:

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/architecture-docs.md`
- `rules/review/mini-review.md`

Docs:

- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_192_CUSTOMER_UNREAD_NOTIFICATION_SYSTEM_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_195_CUSTOMER_GLOBAL_UNREAD_SUMMARY_AND_SERVER_BADGES.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_196_CUSTOMER_UNREAD_TAB_BADGE_AND_NEW_DIVIDER.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_201_CUSTOMER_UNREAD_NOTIFICATION_PIPELINE_RELIABILITY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_203_CUSTOMER_UNREAD_ACTIVE_VISIBLE_READ_SEMANTICS_FIX.md`

## Inspect First

- `prisma/schema.prisma`
- `packages/app-core/src/contracts/domain.ts`
- `packages/app-core/src/contracts/message-slice-realtime.ts`
- `packages/app-core/src/schemas/chat-input-schema.ts`
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/queries/chat.ts`
- `packages/sdk/src/queries/unread.ts`
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `apps/api/src/modules/unread/unread.service.ts`
- `src/lib/chat/features/chat-input.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/server-list/features/server-channel.tsx`
- `src/lib/server-list/features/server-member.tsx`
- `src/lib/server-list/features/server-sidebar.tsx`
- `src/lib/shared/data-access/unread/use-unread-socket.ts`
- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`

## In Scope

- Persist mention metadata for channel messages.
- Parse supported mention tokens on message create.
- Support `@all` attention for channel/server scope, including the sender for rendering/highlight while preserving own-message unread/sound suppression.
- Support explicit member mentions in channel messages.
- Return mention metadata in chat message DTOs enough for rendering.
- Render mentions in message text with a distinct mention style.
- Update unread summary computation so mentioned recipients get `mentionCount > 0` and `attentionLevel: 'mention'`.
- Update realtime unread payload handling so mentioned recipients get mention attention without incorrectly marking all recipients as mentioned.
- Keep normal unread count behavior unchanged for non-mentioned recipients.
- Keep active visible read semantics from Segment 203 unchanged.
- Update docs/status.

## Out Of Scope

- Full reply-to-message implementation.
- Reply attention metadata.
- Link rendering or link previews.
- Message copy action.
- OS/browser Notification API.
- Native desktop popups or taskbar badges.
- Sound behavior changes beyond existing mention attention metadata flowing through unread state.
- Storage/S3 changes.
- Auth/session changes.
- WebRTC/media/LiveKit/SFU changes.
- Staging DB reset.
- Production Postgres migration.
- Broad realtime transport/Nginx/socket hardening.

## Expected Implementation Shape

Preferred direction:

1. Add a small app-core mention contract:
   - token/target shape for message mentions;
   - `@all` vs member mention;
   - DTO fields for rendered chat messages.

2. Add minimal persisted metadata:
   - use normalized rows rather than client-only styling;
   - make mention lookup/counting possible per recipient member;
   - persist explicit sender self-mentions for rendering/highlight without creating own unread or sound.

3. Parse mentions server-side on create:
   - channel messages only in this first segment;
   - resolve member ids against the same server;
   - handle duplicate mention tokens idempotently;
   - `@all` targets accessible server/channel members, including sender for rendering/highlight;
   - if raw-name parsing is ambiguous, prefer a stable token format generated by the UI and document any limitation.

4. Keep message write path backend-owned:
   - SDK payload may carry mention tokens/metadata only if needed;
   - backend remains authoritative for resolving member targets;
   - do not trust client-provided target member ids without server membership validation.

5. Realtime/unread:
   - do not broadcast one `mentionCount: 1` payload to every server member for a single-user mention;
   - either include enough visible metadata for each client to decide whether the current member is mentioned, or emit recipient-specific mention attention through a safe existing/private channel;
   - direct unread privacy on `member:${memberId}:direct-unread` must remain unchanged.

6. UI:
   - render mention tokens as readable `@DisplayName` / `@all`;
   - avoid breaking normal multiline text and attachments;
   - keep the composer usable if autocomplete is deferred;
   - if mention autocomplete is too large, record it as Segment 205 and keep Segment 204 focused on metadata/render/attention correctness.

## Acceptance Criteria

Channel mentions:

- User A sends a channel message mentioning User B.
- User B sees normal unread plus mention attention.
- Other users see normal unread only.
- User A can explicitly mention User A and see mention rendering/highlight on the own message.
- User A does not get own unread or sound from the own message.
- Reload restores mention attention from backend summary.
- Reconnect/focus refetch does not duplicate mention counts.

`@all`:

- User A sends `@all` in a channel.
- All other channel/server recipients get mention attention.
- User A is included in `@all` rendering/highlight for the own message, but still gets no own unread or sound.
- `@all` renders distinctly.

Rendering:

- Mentioned users render as readable mention chips/text in existing message UI.
- Plain text without mentions renders unchanged.
- Attachments still send/render through the existing path.
- Editing/deleting existing messages does not corrupt mention rendering. If edit-time mention recomputation is deferred, document the limitation explicitly.

Unread/notification:

- `mentionCount` and `attentionLevel: 'mention'` are correct in server-scoped and global unread summaries.
- Server rail and channel/member row visual states remain consistent.
- Muted chats still block sound only; visual mention attention remains.
- Active visible near-bottom chat still auto-reads without badge/sound per Segment 203.
- Active visible scrolled-up chat keeps mention attention until read.

Compatibility:

- No production/staging secrets are printed or committed.
- No staging DB reset.
- No broad auth/storage/media/realtime rewrites.

## Verification

Run:

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

If a Prisma migration is added, also run the repo's normal Prisma migration validation path for a disposable/local database and document exactly what was run.

## Manual Smoke

Two or three users in one server/channel:

1. User A sends plain message: normal unread only.
2. User A mentions User B: B gets mention attention, User C gets normal unread only.
3. User A sends `@all`: B and C get mention attention.
4. User A can explicitly mention self for rendering/highlight, but does not get own unread/sound.
5. Open/read channel clears mention and unread counts.
6. Reload restores current backend state.
7. Hidden/minimized and active visible scrolled-up behavior still follows Segment 203.
8. Muted channel blocks sound only, not visual mention attention.

Desktop:

- run desktop config check;
- if packaged desktop runtime smoke is not run, mark desktop runtime as review, not pass.

## Docs To Update

- `docs/delegation/briefs/SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Handoff Requirements

Return:

- branch name;
- root cause/current gap;
- changed files;
- exact mention token/metadata model;
- whether DB schema/migration changed;
- whether backend/API/SDK contracts changed;
- whether realtime unread contracts changed;
- direct unread privacy status;
- read-vs-mention behavior before/after;
- verification results;
- manual smoke status;
- known limitations, especially autocomplete/edit-time recomputation if deferred;
- PowerShell-safe git commands.
