# Segment Brief 213: Customer File Upload Max Size Copy

Branch: `feature/customer-file-upload-max-size-copy`
Segment: `customer-file-upload-max-size-copy`
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- current branch was `core/reborn`;
- worktree was clean;
- Segment 212 generic message file attachments is already recorded in current docs as implemented locally;
- this segment is a small customer-priority follow-up from Segment 212 manual/product review.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `docs/delegation/briefs/SEGMENT_BRIEF_212_CUSTOMER_MESSAGE_GENERIC_FILE_ATTACHMENTS.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this is shared UI copy;
- `rules/auth-storage.md` because the UI describes storage/upload policy and must not drift from backend policy;
- `rules/architecture-docs.md` because plan/status docs must be updated;
- `rules/review/mini-review.md` for merge-readiness review.

Intentionally excluded:
- changing upload limits or accepted file types;
- `300 MB` large-file mode;
- multiple attachments;
- drag-and-drop behavior changes;
- storage provider/env/secrets/bucket policy;
- DB schema/migrations;
- auth/session;
- unread/realtime;
- media/WebRTC;
- reply-to-message;
- mention chip navigation.

## Goal

Make the message file upload UI clearly show the agreed `50 MB` maximum file size with proper translations.

Users should see the limit before choosing/dropping a file, not only after an oversize error.

## Current Context

Segment 212 changed the runtime policy:
- `messageFile`: generic files, max `50 MB`;
- `serverImage`: image-only, max `4 MB`;
- one attachment per message;
- generic files are download/open-only.

Current follow-up requirement in `CUSTOMER_PRIORITY_DELIVERY_PLAN.md`:
- upload UI copy should visibly explain the `50 MB` maximum file size with translations, e.g. `Maximum file size: 50 MB` / `Максимальный размер файла: 50 МБ`.

## Inspect First

- `src/lib/shared/features/file-upload.tsx`;
- `messages/en/modals.ts`;
- `messages/ru/modals.ts`;
- `src/lib/shared/features/modals/message-file-modal.tsx`;
- `src/lib/shared/features/modals/common/server-modal.tsx`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## In Scope

- Add translated visible copy for the `messageFile` max size:
  - English: `Maximum file size: 50 MB`;
  - Russian: `Максимальный размер файла: 50 МБ`.
- Keep server-image copy accurate and avoid implying that server images can be `50 MB`.
- Prefer existing i18n message structure and current `FileUpload` UI; use existing shared/shadcn primitives only if they fit naturally.
- Keep the upload area compact and readable on desktop and smaller web viewports.
- Update docs/status with the result.

## Out Of Scope

- Changing backend upload policy.
- Changing frontend validation limits.
- Changing upload error wording except where needed to align with visible copy.
- Large file transfer / `300 MB`.
- New upload progress UI.
- Multiple attachments.
- Drag-and-drop behavior changes.
- Storage provider/env/secrets/bucket policy.
- DB schema/migrations.
- Message rendering changes.
- Reply-to-message.
- Mention navigation.

## Expected Implementation Shape

- Add explicit i18n keys under the existing modal/upload namespace instead of hardcoding the copy in JSX.
- Render the max-size helper only where it is correct:
  - `messageFile`: `50 MB`;
  - `serverImage`: keep existing image-only messaging and, if a size line is shown there, it must say `4 MB`, not `50 MB`.
- Avoid adding a new abstraction unless the current `FileUpload` duplication becomes meaningfully worse.
- Do not alter the `MESSAGE_FILE_MAX_SIZE_BYTES` or `SERVER_IMAGE_MAX_SIZE_BYTES` constants except for naming/organization if truly necessary.

## Acceptance Criteria

- Message attachment upload modal shows translated `50 MB` max-size copy before file selection.
- Server image upload does not show incorrect `50 MB` copy.
- Existing single-file wording remains correct.
- Oversize validation still rejects files over `50 MB` for message attachments.
- Server image upload still rejects non-image files and files over `4 MB`.
- No backend/storage policy change is made.

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
- open message attachment modal and confirm visible max-size copy says `50 MB`;
- switch locale if practical and confirm Russian copy says `Максимальный размер файла: 50 МБ`;
- upload a normal file under `50 MB`;
- try a file over `50 MB` and confirm rejection still appears;
- open server image upload and confirm it does not claim `50 MB` for server images.

Desktop:
- desktop config check is required;
- packaged desktop runtime remains review unless actually opened.

## Handoff Requirements

Return:
- branch name;
- files changed;
- exact visible copy added in EN/RU;
- whether `messageFile` and `serverImage` copy differ correctly;
- confirmation that backend/storage policy was not changed;
- verification results;
- manual smoke status;
- remaining risks/follow-ups;
- PowerShell-safe `git add` / `git commit` commands.

Do not commit automatically.

## Implementation Result

Status:
- `implemented locally / command verification passed; manual smoke pending`

Delivered:
- message attachment upload now shows translated max-size helper copy before file selection:
  - English: `Maximum file size: 50 MB`;
  - Russian: `Максимальный размер файла: 50 МБ`;
- the helper is rendered only for the `messageFile` upload endpoint;
- `serverImage` upload keeps the existing server-image copy and does not show the `50 MB` message attachment limit;
- upload limits, accepted file types, backend storage policy, storage provider/env/secrets, DB schema, auth/session, unread/realtime, media/WebRTC, replies, and mention navigation are unchanged.

Manual smoke:
- pending authenticated web smoke for message attachment modal EN/RU copy, server image modal negative check, normal upload under `50 MB`, and oversize rejection.

Verification:
- `git diff --check`: pass, with existing CRLF conversion warnings only;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.
