# Segment Brief 207: Customer Message Edit Mode Correctness

Branch: `feature/customer-message-edit-mode-correctness`
Segment: `customer-message-edit-mode-correctness`
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- current shell branch was `feature/customer-message-copy-action`;
- worktree was clean after Segment 206 was committed by the operator;
- this brief is docs-only and the implementation branch must start from latest `origin/core/reborn`, not from the message-copy branch unless it has already been merged into `core/reborn`.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`;
- `SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`;
- `SEGMENT_BRIEF_206_CUSTOMER_MESSAGE_COPY_ACTION.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this is frontend/shared UI work;
- `rules/architecture-docs.md` because docs/status must be updated;
- `rules/review/mini-review.md` if reviewing another agent's result before merge.

Intentionally excluded:
- chat send button;
- reply-to-message;
- link rendering/previews;
- broad file-transfer expansion;
- backend/API/SDK changes unless a very small client-side helper needs shared types;
- DB/schema/migrations;
- unread/realtime semantics;
- auth/session;
- storage provider config;
- media/WebRTC.

## Goal

Fix message edit mode correctness for channel and direct text messages.

The edit flow should feel like a normal chat product:
- clicking edit immediately focuses the edit input;
- users see readable mention text, not internal stable tokens;
- only one message can be edited at a time in the current chat view.

## Current Problems

1. Edit input does not automatically receive focus after clicking edit.
2. Metadata-backed mentions can appear as internal tokens such as `<@memberId>` / `<@all>` during edit.
3. Several messages can be opened in edit mode simultaneously.

## Product Direction

Discord/Telegram-like behavior:
- internal mention ids are system implementation details, not user-facing edit text;
- edit mode should show readable `@name` / `@all`;
- opening edit on another message should close/cancel the previous edit mode;
- existing permissions remain unchanged.

## Inspect First

Runtime files:
- `src/lib/chat/features/chat-item.tsx`;
- `src/lib/chat/features/message-content.tsx`;
- `src/lib/chat/features/message-copy.ts` if Segment 206 is already merged into `core/reborn`;
- `src/lib/chat/features/chat-messages.tsx`;
- `src/lib/chat/features/chat-input.tsx` only for mention helper patterns, not for composer changes.

Mention helpers and contracts:
- `packages/app-core/src/contracts/domain.ts`;
- `src/lib/chat/features/mention-picker-utils.ts`;
- `apps/api/src/modules/messages/messages.service.ts`;
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`.

UI:
- existing `Input`, `Button`, `ActionTooltip`, and message hover actions.

## In Scope

- Focus edit input immediately after entering edit mode.
- Place caret at the end of the edit input content.
- Display readable mention text in edit input:
  - `<@memberId>` should become `@DisplayName` when `mentions` metadata is available;
  - `<@all>` should become `@all`;
  - already-readable raw `@name` / `@all` should remain readable.
- Preserve existing save path:
  - if edit text is readable raw mentions, backend Segment 204 parser may resolve them;
  - do not introduce a rich text editor in this segment.
- Ensure only one message is in edit mode at a time in the visible chat:
  - either lift edit state to `ChatMessages` / a small local context;
  - or use a scoped local browser event keyed by chat id;
  - solution must be bounded and not global across unrelated chats.
- Escape still cancels edit.
- Existing edit/delete/copy permissions remain unchanged.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.

## Out Of Scope

- Send button.
- Reply-to-message.
- Link rendering/previews.
- Broad file upload type/size policy.
- Mention autocomplete changes.
- Edit-mode mention picker/autocomplete.
- Rich text editor.
- Backend/API contract changes.
- DB schema/migrations.
- Unread/realtime changes.
- Storage/auth/media changes.

## Implementation Guidance

Readable edit text:
- create a focused helper near chat feature code if needed;
- prefer reusing the same mention-label logic already used by `MessageContent` / message copy helper;
- avoid duplicating large mention parsing logic if a small shared helper can be extracted inside `src/lib/chat/features`.

Important tradeoff:
- converting `<@memberId>` to `@DisplayName` in the edit input may lose duplicate-display-name stability if the user saves without changing the mention;
- this is acceptable for the current UI correctness slice because users should not edit internal tokens;
- document this known limitation unless a small stable replacement strategy can be reused safely from Segment 205 without pulling in composer complexity.

Single edit mode:
- do not rely on per-row isolated `useState` only;
- the owning chat view should know which message id is currently editing, or rows should coordinate through a chat-scoped event;
- opening edit on message B should cancel edit mode on message A without submitting A.

Focus:
- use a ref to the edit input;
- focus after render with `requestAnimationFrame` or a small effect tied to `isEditing`;
- set selection range to end of the current value.

## Acceptance Criteria

Functional:
- clicking edit focuses the input;
- caret lands at the end;
- pressing Escape cancels edit and restores original content;
- opening edit on a second message closes the first edit input;
- save still updates the message;
- edit permissions remain owner-only and text-only.

Mentions:
- editing a message containing `<@memberId>` displays `@name`;
- editing a message containing `<@all>` displays `@all`;
- saving unchanged readable mention text does not crash and follows existing backend mention parsing;
- messages without mentions behave exactly as before.

Regression:
- copy action from Segment 206 still works if it is present in the base branch;
- delete action still works;
- deleted messages cannot be edited.

## Implementation Result

Delivered:
- edit mode is controlled by the owning `ChatMessages` view through a single `editingMessageId`, so opening edit on message B closes message A without submitting it;
- `ChatItem` focuses the edit input after render and places the caret at the end of the current editable text;
- Escape cancels edit and resets the form to the current readable message content;
- edit mode uses shared mention text helpers so stable tokens such as `<@memberId>` and `<@all>` display as readable `@name` / `@all`;
- message rendering still trusts backend mention metadata and keeps the existing raw fallback behavior only when mention metadata is absent;
- existing owner-only text edit permission, update mutation path, delete action, unread/realtime behavior, backend/API contracts, DB schema, storage, auth, and media behavior are unchanged.

Known limitation:
- if a user saves unchanged readable `@DisplayName` text that originally came from `<@memberId>`, duplicate display-name stability is delegated to the existing backend raw mention parser; this keeps internal ids out of the edit input for the current UI correctness slice.

Manual smoke:
- pending authenticated web checks for ordinary text edit, multiline edit, `@user`, `@all`, Escape cancel, unchanged mention save, single-edit switching, owner/non-owner permissions, delete action, and desktop runtime review.

Follow-up:
- edit-mode mention picker/autocomplete is intentionally separate from Segment 207; the next planned product order is `customer-message-edit-mention-picker`, then `customer-chat-send-button`.

## Verification Commands

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

No migration command should be required.

## Manual Smoke

Use authenticated web sessions.

Check:
- edit ordinary text message;
- edit multiline text message;
- edit message with `@user`;
- edit message with `@all`;
- Escape cancel;
- save unchanged mention text;
- open edit on message A, then edit on message B: only B remains editing;
- owner can edit, non-owner cannot;
- copy/delete actions still behave as expected;
- desktop runtime review if available.

## Handoff Format

Return:
- branch name;
- changed files;
- exact edit-mode behavior;
- how readable mention text is produced;
- how single-edit-mode coordination is implemented;
- what remained out of scope;
- verification results;
- manual smoke status;
- known limitations;
- PowerShell-safe `git add` and `git commit` commands;
- do not commit automatically.
