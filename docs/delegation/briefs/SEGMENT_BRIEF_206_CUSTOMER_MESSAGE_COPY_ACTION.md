# Segment Brief 206: Customer Message Copy Action

Branch: `feature/customer-message-copy-action`  
Segment: `customer-message-copy-action`  
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- worktree was clean on `feature/customer-mentions-autocomplete-picker`;
- current active track is `Wave 35 / CUSTOMER_PRIORITY_DELIVERY_PLAN`;
- `staging.ax-connect.ru` is an active working stand with real user data, not a disposable test target.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`;
- `docs/roadmap/BOUNDARIES.md`;
- latest relevant mention briefs through `SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this is frontend/shared UI work;
- `rules/sdk-client-access.md` only if the implementation touches SDK/cache, which should not be needed for the first slice;
- `rules/architecture-docs.md` because docs/status must be updated.

Intentionally excluded:
- Stage 6 production Postgres migration;
- Stage 9 WebRTC/TURN/SFU hardening;
- link rendering/previews;
- reply-to-message;
- notification/realtime changes;
- storage provider configuration.

## Goal

Add a message-level copy action for channel and direct chat messages.

The copy action must let users quickly copy useful message content without broken values such as `[object Object]`.

## Product Requirements

Required:
- every non-deleted message exposes a compact copy action in the existing message hover action area;
- text messages copy the full text exactly enough for user use, including multiline line breaks;
- mention text should copy as user-readable text such as `@name` / `@all`, not stable internal tokens like `<@memberId>`;
- image/file messages copy a useful representation, preferably the accessible file URL plus any useful visible text;
- copying must never paste `[object Object]`;
- copy success should have lightweight feedback, for example tooltip/temporary icon state;
- web and desktop clipboard paths must both be considered.

Preferred:
- reuse the existing copy behavior pattern from `src/lib/shared/features/modals/invite-modal.tsx`;
- use `window.electron.writeClipboardText` in desktop when available;
- use `navigator.clipboard.writeText` in web;
- fall back gracefully and log a scoped error if clipboard write fails.

## Inspect First

Runtime files:
- `src/lib/chat/features/chat-item.tsx`;
- `src/lib/chat/features/message-content.tsx`;
- `src/lib/shared/features/modals/invite-modal.tsx`;
- `src/lib/shared/utils/upload-file.ts`;
- `src/lib/chat/features/chat-messages.tsx`.

Types/contracts:
- `packages/app-core/src/contracts/domain.ts`;
- message DTO shape used by `ChatItem`.

Translations/UI:
- existing `ChannelPage.ChatItem` translation keys;
- existing `ActionTooltip` and lucide icons.

## In Scope

- Add copy action UI in `ChatItem`.
- Add a small local helper if needed to build copyable text.
- Convert metadata-backed mention tokens to display labels for copied text.
- For attachments, copy a predictable text value:
  - absolute URL for `/api/storage/access?...` when possible;
  - include message text only if it is meaningful and not a serialized storage value;
  - do not expose raw objects.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.

## Out Of Scope

- Binary image clipboard writes.
- Link rendering/clickable URLs.
- Link previews/unfurling.
- Reply-to-message.
- Edit-message autofocus.
- Broad file-transfer policy changes, allowed type expansion, and upload size limit changes.
- Backend/API changes.
- SDK/query changes.
- DB schema/migrations.
- Storage provider/env changes.
- Auth/session changes.
- Unread/realtime changes.
- Media/WebRTC changes.

## Implementation Guidance

Keep this as a frontend-first MVP slice.

Suggested copy text builder:
- if `deleted`, no copy action;
- if text-only message:
  - start from `content`;
  - replace known metadata stable mention tokens using `mentions`:
    - `<@memberId>` -> `@profile.name`;
    - `<@all>` -> `@all`;
  - preserve multiline whitespace;
- if attachment message:
  - derive `fileAccessPath` from `buildStorageAccessPath(fileUrl, 'messageFile')`;
  - convert relative access path to absolute URL with `window.location.origin`;
  - copy that URL;
  - if there is meaningful non-storage text in `content`, include it before the URL.

Do not attempt binary image copy in this slice unless it is proven reliable in both web and desktop. If not proven, URL fallback is the correct behavior.

UI:
- copy icon should be near existing edit/delete hover controls;
- action must be available to non-owners too;
- delete permissions must not gate copy;
- edit should remain owner-only and text-only as now;
- avoid layout shift in message rows.

## Acceptance Criteria

Web:
- text message copy pastes the same user-visible text;
- multiline message copy preserves line breaks;
- mention message copy pastes readable `@name` / `@all`;
- image attachment copy pastes a useful URL, not `[object Object]`;
- PDF/file attachment copy pastes a useful URL or filename + URL, not `[object Object]`;
- deleted messages do not expose copy action;
- copy action does not interfere with edit/delete controls.

Desktop:
- `bun.cmd run check:desktop:config` passes;
- desktop clipboard path is considered through the existing `window.electron.writeClipboardText` pattern;
- if packaged desktop runtime is not tested, report it as `review / pending`, not pass.

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

No migration command should be required for this segment.

## Manual Smoke

Use authenticated web sessions.

Check:
- copy simple text message;
- copy multiline message;
- copy message containing `@user` and `@all`;
- copy image attachment message;
- copy PDF/file attachment message if available;
- ensure pasted output never contains `[object Object]`;
- ensure non-owner can copy;
- ensure owner can still edit/delete;
- ensure deleted message has no copy action;
- quick desktop runtime review if available.

## Implementation Result

Delivered:
- Non-deleted channel and direct messages expose a compact copy action in the existing message hover action area.
- Copy is available to non-owners; edit/delete permission checks remain unchanged.
- Text messages copy readable text while preserving multiline line breaks.
- Metadata-backed stable mention tokens copy as readable `@name` / `@all` text.
- Image/PDF attachment messages copy a backend access URL; if useful non-storage text is present, it is copied before the URL.
- Storage marker values and `[object Object]` are filtered out of copied text.
- Clipboard write uses `window.electron.writeClipboardText` in desktop when available, `navigator.clipboard.writeText` in web, and a legacy textarea fallback when needed.
- Backend/API/SDK contracts, DB schema/migrations, storage provider config, auth/session, unread/realtime, media/WebRTC, link rendering/previews, replies, and binary image clipboard writes remain unchanged.

Manual smoke:
- pending authenticated web smoke and desktop runtime review.

## Handoff Format

Return:
- branch name;
- changed files;
- exact copy behavior for text, multiline, mentions, image, and file/PDF;
- web/desktop clipboard paths used;
- what remained out of scope;
- verification results;
- manual smoke status;
- PowerShell-safe `git add` and `git commit` commands;
- do not commit automatically.
