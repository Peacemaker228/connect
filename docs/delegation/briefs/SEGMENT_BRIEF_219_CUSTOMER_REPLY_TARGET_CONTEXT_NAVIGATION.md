# Segment Brief 219: Customer Reply Target Context Navigation

- Branch: `feature/customer-reply-target-context-navigation`
- Segment: `customer-reply-target-context-navigation`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Base: latest `origin/core/reborn`
- Priority: P1 reply UX correctness after loaded-range reply navigation

## Goal

Make reply-preview navigation work when the original replied-to message is outside the currently loaded chat range.

Segment 218 intentionally handled only the already-rendered case. This segment should close the main functional gap: when the target original is not loaded, the app should load a bounded context/window around that original, render it in the current chat view, then scroll to and highlight it.

This is a functional navigation segment. It is not the reply visual redesign segment.

## Product Decision

Use a Discord/Telegram-like expectation for reply navigation:

- clicking a sent reply preview should take the user to the original message whenever the original belongs to the same channel/conversation and is accessible;
- if the original is already loaded, keep the Segment 218 behavior: scroll and highlight;
- if the original is not loaded, load a bounded context around the target from the backend, then scroll and highlight;
- if the original is soft-deleted, still navigate to the deleted row/fallback when it is accessible and can be loaded;
- if the original is inaccessible or belongs to another channel/conversation, fail safely without wrong navigation.

Do not implement an unbounded loop that repeatedly clicks or calls "load previous messages" until the target appears. That is brittle, slow, and hard to reason about.

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
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_215_CUSTOMER_REPLY_TO_MESSAGE_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_216_CUSTOMER_REPLY_PREVIEW_MENTION_RENDERING_POLISH.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_217_CUSTOMER_REPLY_ATTENTION_UNREAD_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_218_CUSTOMER_REPLY_NAVIGATION_LOADED_RANGE_POLISH.md`

## Repository Reality Checklist

Before changing code:

```powershell
git fetch origin
git switch core/reborn
git pull --ff-only origin core/reborn
git switch -c feature/customer-reply-target-context-navigation
git status --short --branch
```

The feature branch must not track `origin/core/reborn`. If `git status --short --branch` shows the wrong upstream, run:

```powershell
git branch --unset-upstream
```

Do not overwrite uncommitted work from another branch or agent.

## Inspect First

Backend:
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`

SDK/contracts:
- `packages/app-core/src/contracts/domain.ts`
- `packages/sdk/src/queries/chat.ts`
- existing SDK HTTP client/query key patterns around chat reads.

Frontend:
- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/message-reply-preview.tsx`
- `src/lib/shared/utils/hooks/use-chat-scroll.ts`
- any helper introduced by Segment 218 for loaded-row registration/highlight.

## In Scope

1. Add bounded backend context reads for reply targets.
   - Channel target context: validate current member access and target belongs to the same channel/server context.
   - Direct target context: validate current member is in the conversation and target belongs to that same conversation.
   - Include soft-deleted target messages so deleted rows can still be navigated to as safe fallback rows.
   - Return a bounded window/page around the target, not the whole history.
2. Add typed SDK query/helper for target context.
   - Keep request/response types explicit.
   - Reuse existing chat DTO shapes when practical.
   - Preserve existing chat infinite-query behavior for normal loading.
3. Update reply-preview navigation flow.
   - If target is already loaded: keep Segment 218 scroll/highlight behavior.
   - If target is not loaded: fetch context, merge/replace the currently loaded range in a controlled way, render the target, then scroll/highlight.
   - Avoid duplicate rows if some messages in the context are already loaded.
   - Do not scroll to the wrong message if the target cannot be loaded.
4. Support channel and direct chats.
5. Support soft-deleted originals.
6. Keep current reply attention/unread, mention rendering, copy/edit/delete, file/link rendering, and active-read semantics unchanged.
7. Update docs/status for Segment 219.

## Out Of Scope

- Reply block visual redesign.
- Curved connector line, avatar/name layout, one-line ellipsis redesign.
- New visual treatment for messages that reply to the current user.
- Reply attention/badge/sound changes.
- Thread UI.
- URL hash/deep-link routes.
- Cross-channel/cross-conversation navigation.
- Loading arbitrary search results.
- Prisma schema/migration changes unless inspection proves there is no safe alternative.
- Realtime event changes.
- Auth/session changes.
- Storage/file changes.
- Media/WebRTC changes.
- Staging/prod DB migrations or resets.

## Constraints

- No unbounded history-fetch loop.
- No "keep clicking load previous" implementation.
- Backend must remain the authority for target access and same-chat validation.
- Do not trust client-provided `replyTo` preview as proof of access.
- Keep controllers thin and services explicit.
- Keep SDK ownership in `packages/sdk`; do not scatter raw transport calls through UI components.
- Prefer existing shared/shadcn/Radix primitives when they fit the UI behavior; document any custom control choice.
- Desktop-first: shared chat UI changes must keep desktop config green.
- Do not commit automatically.

## Expected Implementation Shape

Backend:
- Add a focused context endpoint or equivalent service method for channel messages, for example:
  - `GET /api/messages/:messageId/context?serverId=...&channelId=...`
- Add a focused context endpoint or equivalent service method for direct messages, for example:
  - `GET /api/direct-messages/:directMessageId/context?conversationId=...`
- Return a bounded list/window containing the target plus nearby messages.
- Use the same enriched `ChatMessageDto` mapping path as normal chat reads, including `replyTo`, mentions, deleted state, author/member data, and file metadata.

SDK:
- Add typed helpers in `packages/sdk/src/queries/chat.ts` or a nearby existing chat query module.
- Keep naming aligned with existing chat read helpers and query keys.
- Surface errors so UI can fail silently or with a small non-disruptive fallback without crashing.

Frontend:
- Reuse the Segment 218 loaded-row map/highlight path.
- On unloaded target context success, integrate the returned window into the displayed message list so the target row is mounted.
- After mount, scroll/highlight the target.
- Preserve current infinite scroll behavior after context navigation as much as practical.

If merging a context window into the existing infinite-query cache is too risky, prefer a contained chat-local state layer with clear comments over broad cache mutation that breaks pagination. Document the trade-off.

## Acceptance Criteria

Channel:
- Reply preview targeting an already-loaded original still scrolls/highlights as in Segment 218.
- Reply preview targeting an older not-loaded original loads a bounded context, renders the original, then scrolls/highlights it.
- Reply preview targeting a soft-deleted original loads/navigates to the deleted fallback row when accessible.
- Cross-channel target context is rejected server-side.
- No duplicate message rows appear after context navigation.
- Existing "load previous messages" behavior still works after context navigation.

Direct:
- Reply preview targeting an already-loaded DM original still scrolls/highlights.
- Reply preview targeting an older not-loaded DM original loads context and scrolls/highlights.
- Cross-conversation target context is rejected server-side.

Regression:
- Reply preview mention rendering still works.
- Reply attention/unread still works.
- Normal mention chip navigation still works.
- Edit/delete/copy row actions still work.
- File-only reply preview still renders attachment fallback.
- Active read/scroll behavior is not broken.

## Manual Smoke

Run authenticated web smoke:

1. Channel loaded target:
   - create A original;
   - create B reply;
   - click B reply preview while A original is already visible/loaded;
   - confirm scroll/highlight.
2. Channel unloaded target:
   - create enough messages so A original is outside the loaded range;
   - click B reply preview;
   - confirm context loads, target appears, scroll/highlight runs, and no duplicate rows appear.
3. Channel deleted target:
   - delete or soft-delete the original;
   - click reply preview;
   - confirm deleted fallback row can still be reached/highlighted if accessible.
4. Direct loaded/unloaded target:
   - repeat loaded and unloaded cases in a DM conversation.
5. Negative API checks:
   - try channel context request with a target from another channel; expect rejection;
   - try direct context request with a target from another conversation; expect rejection.
6. Regression:
   - send/edit/delete/copy a reply message;
   - check mention-in-reply preview rendering;
   - check file-only reply preview fallback.

Desktop runtime:
- if this moves toward desktop release, run a packaged/electron spot check for click target, context load, scroll, and highlight after web smoke passes.

## Implementation Result

Delivered:
- added `GET /api/messages/:messageId/context?serverId=...&channelId=...`;
- added `GET /api/direct-messages/:directMessageId/context?conversationId=...`;
- both backend paths validate current auth membership and same channel/conversation ownership before returning any target context;
- context reads return the existing chat page shape with a bounded window of up to five newer messages, the target message, and up to five older messages;
- soft-deleted target messages are included so existing deleted fallback rows can be navigated to when accessible;
- added `fetchChatReplyTargetContext()` in `packages/sdk/src/queries/chat.ts`;
- reply preview navigation first tries the Segment 218 loaded-row scroll/highlight path;
- if the target is not currently rendered, the UI fetches the bounded context, renders non-duplicate rows through a chat-local overlay, then scrolls/highlights the target after mount;
- normal infinite-query pagination and `load previous` cursor ownership are left intact;
- context-loaded overlay rows are patched from the same realtime update/delete payloads as normal chat pages, including rows whose reply preview points at the updated/deleted message;
- failed/inaccessible/wrong-chat context requests fail silently without scrolling to another message.

Kept out of scope:
- no reply block visual redesign;
- no reply attention/unread changes;
- no DB schema/migration;
- no realtime event changes;
- no URL/deep-link routes;
- no auth/storage/media changes;
- no unbounded "load previous" loop.

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

No migration command is expected. If Prisma schema is touched, stop and explain why.

## Handoff Format

Do not commit automatically.

Return:
- branch and base commit;
- `git status --short --branch` proof that the branch is not incorrectly tracking `origin/core/reborn`;
- changed files;
- backend endpoint/service shape;
- SDK helper shape;
- frontend context-load/navigation behavior;
- loaded target behavior;
- unloaded target behavior;
- deleted target behavior;
- explicit confirmation that reply visual redesign, reply attention, DB schema/migrations, realtime events, auth/storage/media were not changed;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`feat(customer): load reply target context for navigation`
