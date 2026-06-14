# Segment Brief 216: Customer Reply Preview Mention Rendering Polish

- Branch: `feature/customer-reply-preview-mention-rendering-polish`
- Segment: `customer-reply-preview-mention-rendering-polish`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Base: latest `origin/core/reborn`
- Priority: P1 follow-up to Segment 215 reply foundation

## Goal

Make mentions inside compact reply previews render consistently with normal message text.

When a replied-to message contains `@user` or `@all`, the reply preview should show readable highlighted mention text instead of raw stable tokens such as `<@memberId>` or plain unstyled text.

This is a focused rendering polish segment. Do not add reply attention, reply notification sound, scroll-to-original, or a visual redesign of the whole reply block.

## Product Decision

Use the existing message mention visual language in a compact reply-preview-safe form:

- `@user` and `@all` inside reply previews should be readable and visually highlighted;
- reply preview mentions should be non-interactive in this slice unless the existing helper makes safe navigation trivial;
- full mention navigation remains owned by normal message content from Segment 214;
- deleted reply targets still show the existing safe deleted fallback;
- file-only reply targets still show the existing attachment fallback;
- no new unread/attention semantics are introduced.

## Implementation Result

Delivered locally:
- extracted the existing mention text splitting logic into a small shared `getMentionTextParts()` helper;
- kept normal `MessageContent` rendering and mention navigation behavior unchanged while reusing that helper;
- reply previews now render text with compact non-interactive highlighted mention spans for metadata-backed `@user` / `@all`;
- stable `<@memberId>` / `<@all>` tokens in reply previews render as readable `@name` / `@all` when reply mention metadata is present;
- deleted-original and file-only reply fallbacks remain unchanged.

Kept out of scope:
- reply attention/badges/sound, `replyCount`, scroll-to-original, backend/API/DB/realtime changes, reply preview navigation, and broader reply block redesign.

## Current Context

- Segment 215 added `replyTo` preview metadata to chat message DTOs.
- `src/lib/chat/features/message-reply-preview.tsx` currently builds preview text through readable-copy helpers and renders it as compact text.
- Normal message mention rendering lives around:
  - `src/lib/chat/features/message-content.tsx`
  - `src/lib/chat/features/message-mention-text.ts`
- Mention navigation from Segment 214 should not be accidentally copied into compact reply preview if it creates cramped UI or unexpected navigation.
- Reply foundation already refreshes loaded reply previews on original edit/delete through existing update realtime.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`

Docs:
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_214_CUSTOMER_MENTION_CHIP_NAVIGATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_215_CUSTOMER_REPLY_TO_MESSAGE_FOUNDATION.md`

## Inspect First

- `src/lib/chat/features/message-reply-preview.tsx`
- `src/lib/chat/features/message-content.tsx`
- `src/lib/chat/features/message-mention-text.ts`
- `src/lib/chat/features/chat-item.tsx`
- `packages/app-core/src/contracts/domain.ts`

## In Scope

1. Render `replyTo.mentions` inside reply preview with compact highlighted mention styling.
2. Preserve readable text for normal words around mentions.
3. Preserve `@all` rendering.
4. Preserve stable-token readability for metadata-backed mentions.
5. Preserve safe behavior when `mentions` is missing, empty, or stale.
6. Keep reply preview compact and visually calm.
7. Update docs/status for Segment 216.

## Out Of Scope

- Reply attention/badges/sound.
- `replyCount` summary behavior.
- Scroll-to-original.
- Click navigation from reply preview, unless already trivial and non-disruptive.
- Reply block visual redesign.
- Threads or Telegram-like quote selection.
- Backend/API/SDK/DB changes.
- Realtime event changes.
- Auth/session, storage, media/WebRTC changes.
- Staging/prod migration execution.

## Constraints

- Do not add a Prisma migration.
- Do not change the `ChatMessageDto` / `MessageReplyPreviewDto` contract unless inspection proves it is unavoidable.
- Prefer extracting/reusing a small mention text renderer instead of duplicating token parsing.
- Avoid `dangerouslySetInnerHTML`.
- Keep deleted preview fallback unchanged.
- Keep file-only preview fallback unchanged.
- Shared UI changes must keep desktop config green.
- If a custom/native element is used instead of existing shared/shadcn/Radix primitives, document why.
- Do not commit automatically.

## Expected Implementation Shape

Likely implementation:

- introduce or reuse a small non-interactive mention-rendering helper that can render inline text fragments from `content + mentions`;
- use it inside `MessageReplyPreviewBlock` or its preview text child;
- keep compact typography appropriate for reply previews;
- avoid putting buttons/links inside the reply preview for this slice unless that behavior is explicitly and safely designed.

## Acceptance Criteria

- Replying to a message containing metadata-backed `@user` shows the mention as highlighted readable `@name` inside the reply preview.
- Replying to a message containing `@all` shows highlighted `@all` inside the reply preview.
- Replying to plain text still renders plain compact preview text.
- Replying to file-only message still renders the attachment fallback.
- Deleted original still renders deleted fallback.
- Editing the original message to add/remove mentions updates the loaded reply preview through the existing update realtime path.
- Normal message content mention rendering and navigation are unchanged.
- No reply attention/sound/badge behavior is added.

## Manual Smoke

Run authenticated channel smoke:

1. User A sends `hello @user`.
2. User B replies to it.
3. Confirm reply preview shows highlighted readable `@user`.
4. User A sends `hello @all`.
5. User B replies to it.
6. Confirm reply preview shows highlighted `@all`.
7. Edit the original message from `@user` to `@all`; confirm loaded reply preview updates without reload.
8. Delete the original; confirm reply preview switches to deleted fallback.
9. Confirm normal message mention chip navigation still works outside reply previews.
10. Confirm file-only reply preview still says attachment.

Also smoke direct messages for plain reply preview regression, even though mentions are channel-owned right now.

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

## Handoff Format

Do not commit automatically.

Return:
- branch and base commit;
- changed files;
- implementation summary;
- explicit confirmation that backend/API/DB/realtime were not changed;
- verification results;
- manual smoke status;
- remaining visual polish notes, if any;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`fix(customer): render mentions inside reply previews`
