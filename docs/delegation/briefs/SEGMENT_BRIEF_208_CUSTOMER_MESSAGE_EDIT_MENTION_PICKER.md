# Segment Brief 208: Customer Message Edit Mention Picker

Branch: `feature/customer-message-edit-mention-picker`
Segment: `customer-message-edit-mention-picker`
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- current shell branch was `feature/customer-message-edit-mode-correctness`;
- Segment 207 is the required predecessor and must be merged before this implementation starts;
- implementation must start from latest `origin/core/reborn`, not from a stale local branch.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`;
- `SEGMENT_BRIEF_207_CUSTOMER_MESSAGE_EDIT_MODE_CORRECTNESS.md`.

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
- backend/API/SDK contract changes;
- DB/schema/migrations;
- unread/realtime changes;
- auth/session;
- storage provider config;
- media/WebRTC.

## Goal

Add mention picker/autocomplete to message edit mode for channel text messages.

The main product problem is duplicate display names: editing readable `@name` text through the raw backend parser is ambiguous. Picker-selected mentions in edit mode must preserve the selected member identity by serializing to stable `<@memberId>` / `<@all>` tokens on save, while still showing readable `@name` / `@all` in the edit input.

## Current Context

Segment 205 added composer mention picker:
- suggestions from current server members plus `@all`;
- readable textarea text;
- stable token serialization for selected ranges;
- duplicate display names are resolved only when the picker-selected visible range remains intact.

Segment 207 fixed edit mode:
- readable mentions in edit input;
- autofocus/caret;
- one edited message at a time;
- known limitation: unchanged readable mentions rely on backend raw parser and may be ambiguous for duplicate display names.

This segment closes the edit-mode picker gap.

## Inspect First

Runtime files:
- `src/lib/chat/features/chat-item.tsx`;
- `src/lib/chat/features/chat-messages.tsx`;
- `src/lib/chat/features/mention-picker-utils.ts`;
- `src/lib/chat/features/message-mention-text.ts`;
- `src/lib/chat/features/chat-input.tsx`;
- `src/lib/chat/features/message-content.tsx`.

Contracts/types:
- `packages/app-core/src/contracts/domain.ts`;
- message DTO mention shape.

Docs:
- `SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`;
- `SEGMENT_BRIEF_207_CUSTOMER_MESSAGE_EDIT_MODE_CORRECTNESS.md`;
- `docs/roadmap/BOUNDARIES.md` UI primitive preference.

## In Scope

- Add `@` picker to the edit input for channel text messages.
- Reuse Segment 205 helper behavior where practical:
  - `createMentionSuggestions`;
  - `filterMentionSuggestions`;
  - `getMentionTrigger`;
  - `applyMentionSuggestionToText`;
  - `updateMentionRangesForTextChange`;
  - `serializeSelectedMentionsForSubmit`.
- Preserve readable edit text while tracking picker-selected ranges.
- On save, serialize intact selected ranges to stable tokens before `useUpdateMessage`.
- Ensure duplicate display names resolve to the selected member for picker-selected edit mentions.
- Keep `@all` selectable, visually separated, and serialized to `<@all>`.
- Keep existing Segment 207 behavior:
  - edit autofocus/caret;
  - one edited message at a time;
  - Escape cancel;
  - owner-only text edit.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.

## Out Of Scope

- Composer send button.
- Reply-to-message.
- Link rendering/previews.
- Broad file upload type/size policy.
- Rich text editor.
- Direct-message edit mention picker unless the current code can support it without extra backend/domain assumptions. The first required slice is channel messages.
- Backend/API changes.
- DB schema/migrations.
- Unread/realtime behavior changes.
- Storage/auth/media changes.

## Implementation Guidance

Preferred shape:
- extract a small reusable mention picker controller/component only if it reduces duplication between composer and edit input;
- otherwise keep changes scoped to `ChatItem` and helpers;
- do not introduce a rich text editor.

Important:
- For existing edited content containing stable tokens converted to readable text by Segment 207, the implementation should avoid making things worse:
  - best case: initialize tracked ranges from existing `mentions` metadata when the visible readable text still matches the mention label;
  - acceptable first slice: picker-selected newly inserted mentions are stable, while pre-existing readable mentions remain raw-parser based and the limitation is documented;
  - unacceptable: claim duplicate-name safety for all edit mentions while only submitting raw `@DisplayName`.
- If initializing ranges from existing mentions is implemented, be careful with repeated identical display names and repeated mention text in the same message.

Picker UI:
- keep the Segment 205 Discord-like bounded popup behavior where practical;
- do not reintroduce the scrollbar-close bug;
- restore focus/caret to the edit input after pointer interaction where applicable;
- avoid layout overflow on small viewports.

Save path:
- `handleSubmit` must serialize tracked selected mention ranges before calling `updateMessage`;
- if user edits a selected mention visible range, drop that stable replacement and let backend raw parser handle remaining text;
- trim/validation behavior should remain consistent with the existing edit form schema.

## Acceptance Criteria

Functional:
- edit a channel message and type `@`: picker opens;
- filter members by text;
- select a member with keyboard and mouse;
- select `@all`;
- save updates the message through the existing mutation;
- Escape cancel still works;
- opening edit on another message still closes the first edit mode.

Duplicate display names:
- if two members have the same display name, selecting one from the edit picker saves the selected member as a stable `<@memberId>` token before backend parsing;
- after save/reload, the rendered mention points to the selected member metadata.

Regression:
- ordinary text edit works;
- multiline edit works if currently supported by the edit input;
- owner-only edit permission remains unchanged;
- delete/copy actions remain unchanged;
- composer mention picker from Segment 205 still works.

## Implementation Result

Delivered:
- added channel-message edit-mode mention picker using the existing Segment 205 mention helper flow;
- extracted the bounded Discord-like mention suggestion list into `MentionPickerCommand`, reused by the composer and edit mode;
- `ChatMessages` loads the server member snapshot once and passes guarded mention suggestions to message rows only after `mentionServer.id` matches the current server id;
- edit-mode picker placement is collision-aware: it opens above the edit input when there is room, otherwise below, and constrains list height to the available viewport space;
- edit mode keeps readable `@name` / `@all` text, tracks picker-selected visible ranges, and serializes intact ranges to stable `<@memberId>` / `<@all>` before the existing update mutation;
- if the user edits a picker-selected mention range, that stable replacement is dropped and the remaining readable text follows the existing backend raw mention parser;
- Segment 207 autofocus/caret, Escape cancel, single-edit-mode, owner-only text edit, delete/copy actions, and existing update mutation path remain unchanged;
- backend/API/SDK contracts, DB schema, unread/realtime behavior, auth/session, storage, media, replies, links, broad files, and chat send button remain unchanged.

Product decision:
- editing a message updates mention metadata/rendering through the existing message update path;
- editing a message should not create a new normal unread/sound notification by default;
- notification/attention behavior for newly added mentions during edit is a separate future product decision unless explicitly implemented and tested.

Existing mention limitation:
- pre-existing readable mentions in an edited message are not reconstructed as tracked stable ranges in this slice; newly inserted picker-selected mentions are stable, while unchanged pre-existing readable mentions remain backend-parser based.

Manual smoke:
- pending authenticated channel smoke for ordinary edit, picker `@user`, picker `@all`, duplicate display-name selected member A/B, Escape cancel, switching edited message, composer picker regression, and desktop runtime review.

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

Use authenticated web sessions and a channel with at least two members sharing the same display name if possible.

Check:
- edit ordinary text;
- edit and insert `@user` through picker;
- edit and insert `@all` through picker;
- duplicate display name: select user A, save, verify mention metadata/rendering targets A;
- duplicate display name: select user B, save, verify mention metadata/rendering targets B;
- typed raw `@name` without picker remains documented as backend-parser based;
- Escape cancel;
- switching edited message closes previous edit mode;
- composer picker still works;
- desktop runtime review if available.

## Handoff Format

Return:
- branch name;
- changed files;
- exact edit picker behavior;
- whether existing mentions are initialized as tracked stable ranges or only newly inserted picker mentions are stable;
- duplicate-display-name result;
- what remained out of scope;
- verification results;
- manual smoke status;
- known limitations;
- PowerShell-safe `git add` and `git commit` commands;
- do not commit automatically.
