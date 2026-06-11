# Segment Brief 202: Customer Chat Composer Screenshot Paste And Focus

## Metadata

- Branch: `feature/customer-chat-composer-screenshot-paste-focus`
- Base: latest `core/reborn`
- Segment: `customer-chat-composer-screenshot-paste-and-focus-stability`
- Type: customer-priority chat UX/runtime slice
- Status: `pass / implemented locally; manual web smoke pending`
- Commit policy: do not commit automatically; provide PowerShell-safe `git add` and `git commit` commands in the handoff

## Context

The chat composer already supported multiline text, `Enter` send, `Shift+Enter` newline, guarded post-text-send autofocus, and normal plus-button attachment upload through the backend-owned storage path.

Missing behavior:

- clipboard screenshots/images pasted into the composer were not treated as message attachments;
- pasted files needed to use the same staged backend storage and message creation path as normal file upload;
- focus should be stable on channel/DM entry and after text or attachment send without fighting modals, file picker, emoji picker, menus, or media controls.

## Scope

In scope:

- detect image files from the composer clipboard paste event;
- create a browser `File` named like `screenshot-YYYYMMDD-HHMMSS.png`;
- open the existing `messageFile` attachment confirmation modal with that file preselected;
- upload pasted files through `uploadStorageFile('messageFile', file)`;
- keep staged upload cleanup on cancel/remove and staged commit on message send;
- focus the composer on safe route entry and after successful text or attachment send;
- keep normal text paste and plus-button file upload behavior;
- update Wave 35 docs/status.

Out of scope:

- mentions/replies;
- link previews;
- message copy;
- notification sound;
- auth/session changes;
- DB schema/migrations;
- storage provider/env changes;
- WebRTC/media/LiveKit/SFU;
- staging DB reset or staging media experiments;
- production Postgres work;
- new dependencies.

## Implementation

Paste flow:

- `ChatInput` now handles `onPaste` on the textarea;
- when clipboard data contains an image file item, the default paste is prevented;
- the pasted blob is wrapped in a new `File` with a stable screenshot-style timestamped name and the original image MIME type;
- the existing `messageFile` modal is opened with `initialFile`;
- `FileUpload` accepts `initialFile` and uploads it through the same SDK storage action used by the regular file input;
- user confirmation is still required through the attachment modal `Send` button;
- the attachment modal disables `Send` while the preselected pasted file is still uploading;
- cancel/remove cleans staged uploads through `useStagedUpload`;
- if the modal closes while an upload is still in flight, a late uploaded value is registered and immediately cleaned instead of becoming an orphaned staged attachment where the client can still clean it.

Focus behavior:

- composer safe-focus runs on channel/DM entry only when the page is visible, no modal is open, and focus is on `body` or the composer itself;
- successful text sends keep the existing bounded refocus attempts after `router.refresh()`;
- successful attachment sends dispatch a bounded local composer-focus event after closing the modal, so the active chat composer refocuses through the same safe-focus guard;
- focus is not forced while a modal is open or another focusable control owns focus.

## Behavior Before / After

Before:

- pasted screenshots/images into the composer did not enter the attachment flow;
- only plus-button file selection could stage and confirm a message attachment;
- route-entry focus was not consistently applied;
- attachment sends closed the modal without an explicit composer refocus path.

After:

- channel and DM composer paste accepts clipboard images and opens the existing attachment confirmation modal;
- pasted image messages use the backend-owned staged storage upload and message create path;
- plain text paste remains the browser default;
- plus-button file upload remains unchanged;
- composer focus is restored on safe chat entry, text send, and attachment send without focusing over modals/controls.

Known limitation:

- clipboard payloads containing both text and an image are treated as image paste; the image confirmation flow opens and the text is not inserted into the composer.

## Verification

Passed locally:

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

Manual smoke:

- pending authenticated web smoke for channel screenshot paste, DM screenshot paste, cancel cleanup, plain text paste, plus-button upload, Enter/Shift+Enter, and focus stability;
- packaged desktop runtime smoke was not run; desktop is `review`, not pass. `check:desktop:config` passed.

## Handoff Requirements

Return:

- branch name;
- changed files;
- exact paste flow implemented;
- whether existing `messageFile` upload/storage path was reused;
- focus behavior before/after;
- what was intentionally not touched;
- verification results;
- manual smoke result or explicit pending status;
- risks/follow-ups;
- PowerShell-safe git commands.
