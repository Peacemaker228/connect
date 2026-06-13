# Segment Brief 212: Customer Message Generic File Attachments

Branch: `feature/customer-message-generic-file-attachments`
Segment: `customer-message-generic-file-attachments`
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn` after `customer-file-transfer-policy-design`

## Context

Segment 211 closed the MVP policy for message file transfer:
- `messageFile` max size is `50 MB` per file;
- one attachment per message remains unchanged;
- images keep the current inline preview behavior;
- PDFs keep the current file row/open behavior;
- all other files render as generic download/open rows;
- executable-like files and archives are allowed only as download-only attachments, with no inline preview, execution, auto-open, or safety claim;
- `300 MB` file transfer is not part of this runtime segment and remains a separate future large-file transfer design.

Current runtime before this segment:
- backend `messageFile` allows only `image/*` and `application/pdf`;
- backend `messageFile` max size is `4 MB`;
- frontend `messageFile` file input accepts only `image/*,.pdf,application/pdf`;
- `FileUpload` blocks non-image/PDF files on the client;
- stored upload metadata has `fileKey`, `fileUrl`, `fileType`, and access kind, but not a stable display filename;
- message rendering supports image preview and PDF rows only.

## Implementation Result

Delivered:
- backend `messageFile` policy now allows generic file content types and enforces `50 MB`;
- backend `serverImage` remains image-only and `4 MB`;
- empty/unknown uploaded MIME types normalize to `application/octet-stream`;
- new stored upload values preserve optional display filename as `name` in `storage://v1` metadata while old values remain compatible;
- finalized message file values preserve that display filename without a DB migration;
- frontend `messageFile` picker no longer restricts `accept` to image/PDF, while `serverImage` keeps `accept="image/*"`;
- frontend upload UX shows visible validation/upload errors for type/size/upload failures;
- image attachments still render inline;
- PDF attachments still render as file rows;
- non-image/non-PDF attachments render as generic file rows;
- non-image/non-PDF `messageFile` objects are uploaded with `Content-Disposition: attachment`;
- copy action keeps using the existing backend access URL path.

Not changed:
- one attachment per message;
- screenshot paste image flow;
- storage provider/env/secrets/bucket policy;
- DB schema/migrations;
- auth/session;
- unread/realtime;
- media/WebRTC;
- replies;
- link previews;
- `300 MB` large-file transfer.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/auth-storage.md`
- `rules/architecture-docs.md`
- `rules/review/mini-review.md`

Docs:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_202_CUSTOMER_CHAT_COMPOSER_SCREENSHOT_PASTE_FOCUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_206_CUSTOMER_MESSAGE_COPY_ACTION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_211_CUSTOMER_FILE_TRANSFER_POLICY_DESIGN.md`

## Inspect First

Backend/storage:
- `apps/api/src/modules/storage/storage.service.ts`
- `apps/api/src/modules/storage/storage.controller.ts`
- `apps/api/src/modules/storage/storage.types.ts`
- `apps/api/src/modules/storage/s3-compatible-storage.provider.ts`

SDK/app-core:
- `packages/sdk/src/actions/storage.ts`
- `packages/app-core/src/files/upload-file.ts`
- `packages/app-core/src/schemas/message-file-schema.ts`

Frontend:
- `src/lib/shared/features/file-upload.tsx`
- `src/lib/shared/features/modals/message-file-modal.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/message-copy.ts`
- `messages/en/channel-page.ts`
- `messages/ru/channel-page.ts`

## Goal

Implement the agreed MVP generic message attachment support without changing storage provider config, DB schema, auth, unread/realtime, media/WebRTC, replies, or link previews.

Users must be able to attach common work files through the existing one-file `messageFile` flow. Images and PDFs keep current behavior; everything else is download-only.

## In Scope

Backend:
- raise `messageFile` max size from `4 MB` to `50 MB`;
- broaden backend `messageFile` validation to accept generic file attachments;
- keep `serverImage` image-only and `4 MB`;
- keep backend validation authoritative;
- keep existing staged/finalized storage lifecycle and `backend-redirect` access policy.

Frontend:
- allow selecting generic files for `messageFile`;
- keep `serverImage` file picker image-only;
- keep one attachment per message;
- keep image preview and PDF row behavior;
- render non-image/non-PDF message files as generic download/open rows;
- render executable-like files, scripts, installers, archives, and unknown binaries only as generic download/open rows;
- show visible upload validation/error feedback for rejected or over-size files where practical;
- keep screenshot paste and existing attachment modal flow working.

Metadata:
- preserve existing stored upload compatibility;
- add file display name to new `storage://v1` stored values if needed, without a DB migration;
- handle old stored values without file name by falling back to URL/key-derived display text.

Copy:
- keep message copy output useful for attachments by copying the backend access URL as today;
- never copy `[object Object]`.

Docs:
- update this brief, `CUSTOMER_PRIORITY_DELIVERY_PLAN.md`, and `STAGE_STATUS.md`.

## Out Of Scope

- `300 MB` large-file transfer.
- Multiple attachments per message.
- Drag-and-drop upload.
- Direct-to-object-storage upload.
- Chunked/resumable upload.
- Upload progress UI beyond current loading state.
- Antivirus/malware scanning or safety claims.
- Private/signed object access migration.
- Storage provider/env/secrets/bucket policy changes.
- DB schema/migrations.
- Auth/session changes.
- Unread/realtime changes.
- WebRTC/media/LiveKit/SFU changes.
- Reply-to-message.
- Link previews/unfurl.
- Staging DB reset.
- Production Postgres migration.

## Expected Implementation Shape

1. Backend policy:
   - change only the `messageFile` upload policy to `50 MB`;
   - allow generic file content types for `messageFile`;
   - reject missing/empty file metadata as today;
   - keep `serverImage` unchanged.

2. Stored metadata:
   - extend `serializeUploadValue()` / `getUploadValueParts()` to support an optional display filename from upload response metadata;
   - preserve parsing of existing `storage://v1` values without filename;
   - do not change DB schema.

3. Frontend picker:
   - remove the image/PDF-only restriction for `messageFile`;
   - prefer omitting `accept` for `messageFile` rather than maintaining a misleading extension allowlist;
   - keep `accept="image/*"` for `serverImage`;
   - keep client-side validation as UX only, not as the security boundary.

4. Rendering:
   - keep images inline;
   - keep PDFs as file rows;
   - render all other files as a generic file row with icon, readable filename/fallback, and access link;
   - do not inline-preview executable-like files, archives, scripts, installers, or unknown binaries.

5. UX errors:
   - surface upload errors from `StorageActionError` in the file modal/upload UI;
   - include a useful oversize message for the `50 MB` cap;
   - avoid claiming that executable or archive files are safe.

6. Compatibility:
   - existing image/PDF attachments continue rendering;
   - old stored values without filename continue opening/copying;
   - existing copy action remains useful.

## Acceptance Criteria

Functional:
- image attachment upload still previews inline;
- PDF upload still renders as an open/download row;
- generic document upload renders as a generic download/open row;
- archive upload renders as a generic download/open row;
- executable-like file upload, if accepted by backend policy, renders only as a generic download/open row;
- one attachment per message remains unchanged;
- screenshot paste still works for images;
- copy action still copies useful attachment access URL.

Limits:
- `messageFile` over `50 MB` is rejected with visible UX feedback;
- `serverImage` remains image-only and `4 MB`;
- `300 MB` is not implemented.

Safety:
- no inline preview for generic binaries, archives, scripts, installers, or executables;
- no malware scanning or safety claim is introduced;
- no backend/API endpoint outside existing storage/message paths is added unless clearly justified;
- no storage provider/env/secrets/bucket policy change.

Regression:
- message text, mentions, link rendering, edit mode, send button, unread/realtime, auth/session, and media behavior remain unchanged.

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

Authenticated web session:
- upload image under `50 MB`: preview appears and receiver can open it;
- upload PDF under `50 MB`: file row appears and opens;
- upload generic document under `50 MB`: generic row appears and opens/downloads;
- upload archive under `50 MB`: generic row appears and opens/downloads only;
- upload executable-like file under `50 MB`: generic row appears and opens/downloads only, no preview or safety copy;
- upload `messageFile` over `50 MB`: rejected with visible error;
- server avatar upload still rejects non-image files;
- screenshot paste still opens the existing attachment confirmation and sends image;
- copy action copies useful text/access URL;
- reload restores all attachment rows correctly.

Staging/operator:
- if staging returns proxy/body-size `413` or timeout before backend validation, record the exact limit symptom and treat infrastructure/body-limit adjustment as a separate operator follow-up. Do not change storage provider secrets or bucket policy in this segment.

Desktop:
- run desktop config check;
- packaged desktop runtime remains review/pending unless actually opened and checked.

## Handoff Requirements

Return:
- branch name;
- files changed;
- exact backend file policy before/after;
- whether `messageFile` max is `50 MB`;
- whether `serverImage` stayed unchanged;
- how generic files render;
- how executable-like files render;
- whether stored metadata changed and compatibility behavior;
- whether backend/API/DB/storage provider/env/auth/unread/media/replies changed;
- verification results;
- manual smoke status;
- remaining risks/follow-ups;
- PowerShell-safe `git add` / `git commit` commands.

Do not commit automatically.
