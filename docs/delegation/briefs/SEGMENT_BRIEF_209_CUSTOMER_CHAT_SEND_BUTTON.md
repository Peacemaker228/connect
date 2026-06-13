# Segment Brief 209: Customer Chat Send Button

Branch: `feature/customer-chat-send-button`
Segment: `customer-chat-send-button`
Status: `ready for implementation`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- current local branch was updated to `core/reborn`;
- `origin/core/reborn` already includes Segment 208 through PR #153;
- worktree was clean before this brief was created.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `SEGMENT_BRIEF_202_CUSTOMER_CHAT_COMPOSER_SCREENSHOT_PASTE_FOCUS.md`;
- `SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`;
- `SEGMENT_BRIEF_208_CUSTOMER_MESSAGE_EDIT_MENTION_PICKER.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this is frontend/shared UI work;
- `rules/architecture-docs.md` because docs/status must be updated;
- `rules/review/mini-review.md` for merge-readiness review after implementation.

Intentionally excluded:
- link rendering/previews;
- reply-to-message;
- broad file-transfer expansion;
- backend/API/SDK contract changes;
- DB/schema/migrations;
- unread/realtime behavior;
- auth/session;
- storage provider config;
- media/WebRTC.

## Goal

Add an explicit send button to the chat composer for channel and direct messages.

The button should make sending discoverable without changing the existing keyboard behavior:
- `Enter` sends;
- `Shift+Enter` inserts a newline;
- screenshot paste, attachment modal, emoji picker, and mention picker continue to work.

## Current Context

`src/lib/chat/features/chat-input.tsx` currently owns:
- textarea content and validation through `react-hook-form`;
- `Enter` / `Shift+Enter` behavior;
- post-send focus restoration;
- optimistic cache insertion and scroll-to-bottom;
- screenshot paste into the existing file modal;
- plus-button attachment entry;
- emoji picker;
- channel-only mention picker with stable mention serialization.

The right side of the composer currently contains the emoji picker. A send button must not overlap existing controls or textarea text.

## Inspect First

Runtime files:
- `src/lib/chat/features/chat-input.tsx`;
- `src/lib/shared/features/emoji-picker-custom.tsx`;
- `src/lib/shared/features/modals/message-file-modal.tsx`;
- `src/lib/chat/features/mention-picker-command.tsx`;
- `src/lib/shared/utils/chat-events.ts`.

UI/i18n files:
- `messages/en/channel-page.ts`;
- `messages/ru/channel-page.ts`.

Docs:
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## In Scope

- Add a visible send icon/button to the main chat composer.
- The button must submit the same form path as the existing `Enter` behavior.
- Disable the button while the message create mutation is submitting.
- Disable the button when the serialized/trimmed text content is empty.
- Keep `Enter` send and `Shift+Enter` newline behavior unchanged.
- Keep mention picker keyboard behavior unchanged:
  - `Enter` / `Tab` selects an active mention option while the picker is open;
  - the send button click may submit the current text, but must not corrupt selected mention serialization.
- Keep screenshot paste flow unchanged.
- Keep attachment modal flow unchanged.
- Keep emoji picker usable and visually distinct from the send button.
- Preserve post-send focus restoration and scroll-to-bottom behavior.
- Add accessible labels/tooltips/i18n text for the send button.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.

## Out Of Scope

- Link rendering/previews.
- Reply-to-message.
- Broad file upload type/size policy.
- Any backend/API/SDK changes.
- DB schema/migrations.
- Unread/realtime changes.
- Notification/sound behavior.
- Storage/auth/media/WebRTC changes.
- Rich text editor.

## Implementation Guidance

Preferred UI shape:
- use a familiar send icon, for example `SendHorizontal` from `lucide-react`;
- place it on the right side of the composer near the emoji picker;
- adjust textarea right padding so text does not sit under the emoji/send controls;
- keep the plus attachment button on the left unchanged;
- avoid card-like wrappers or unrelated composer redesign.

Button behavior:
- `type="submit"` is acceptable if it goes through the existing form submit path;
- before submit, set the same focus-intent behavior used by `Enter`, so focus returns to the textarea after send;
- button disabled state should reflect both loading and empty serialized text;
- disabled visual state should be clear but not noisy.

Empty-content rule:
- base the disabled check on the same effective content that submit sends:
  - raw textarea value;
  - stable mention serialization for intact selected ranges;
  - `trim()`.
- Do not send whitespace-only messages.

Compatibility:
- do not change `messageFile` modal behavior;
- do not change `EmojiPickerCustom` internals unless absolutely necessary;
- do not change mention helper contracts;
- do not move message creation out of the existing `useCreateMessage` path.

Desktop-first note:
- this is shared composer UI, so `bun.cmd run check:desktop:config` is required;
- desktop runtime smoke remains review/pending unless actually run.

## Acceptance Criteria

Functional:
- send button appears in channel composer;
- send button appears in direct-message composer;
- button sends ordinary text;
- button sends multiline text;
- button sends content containing picker-selected `@user` / `@all` mentions with stable serialization;
- button is disabled for empty or whitespace-only content;
- button is disabled while submitting;
- clicking send restores focus to the textarea after send;
- `Enter` send still works;
- `Shift+Enter` newline still works.

Regression:
- plus attachment button still opens the existing file modal;
- screenshot paste still opens the existing file modal with the pasted image;
- emoji picker still inserts emoji and does not overlap the send button;
- mention picker still opens, selects with keyboard/mouse, and keeps focus/caret behavior;
- no backend/API/DB/unread/storage/media behavior changes.

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

Check channel and direct-message composers:
- ordinary text via button;
- ordinary text via `Enter`;
- `Shift+Enter` newline then button send;
- whitespace-only content cannot be sent;
- fast repeated button clicks do not duplicate messages;
- focus returns to textarea after send;
- emoji insert then send;
- mention picker select then send;
- screenshot paste still opens modal and sends through existing flow;
- plus-button upload still opens modal;
- narrow-ish desktop width does not overlap emoji/send/textarea text.

Desktop runtime:
- review/pending unless packaged desktop runtime is actually opened and checked.

## Handoff Format

Return:
- branch name;
- files changed;
- summary of behavior;
- confirmation that no backend/API/DB/storage/auth/media changes were made;
- verification command results;
- manual smoke status;
- remaining risks/follow-ups.

Do not commit automatically. Return PowerShell-safe `git add` / `git commit` commands.
