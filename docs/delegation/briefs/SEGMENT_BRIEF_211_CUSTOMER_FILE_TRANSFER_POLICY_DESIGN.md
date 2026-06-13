# Segment Brief 211: Customer File Transfer Policy Design

Branch: `feature/customer-file-transfer-policy-design`
Segment: `customer-file-transfer-policy-design`
Status: `policy closed locally / runtime brief prepared; command verification passed`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- local branch was updated to `core/reborn`;
- `origin/core/reborn` already includes Segment 210 through PR #155;
- worktree was clean before this brief was created.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `SEGMENT_BRIEF_202_CUSTOMER_CHAT_COMPOSER_SCREENSHOT_PASTE_FOCUS.md`;
- `SEGMENT_BRIEF_206_CUSTOMER_MESSAGE_COPY_ACTION.md`;
- `SEGMENT_BRIEF_210_CUSTOMER_LINK_RENDERING_BASIC.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because the later implementation will touch upload UI/rendering;
- `rules/backend-api.md` because upload policy is enforced by `apps/api`;
- `rules/sdk-client-access.md` because upload calls go through `packages/sdk`;
- `rules/auth-storage.md` because this is storage-boundary work;
- `rules/architecture-docs.md` because this segment must update plan/status docs;
- `rules/review/mini-review.md` for merge-readiness review after implementation.

Intentionally excluded:
- reply-to-message;
- WebRTC/media work;
- auth/session changes;
- unread/realtime changes;
- production Postgres migration;
- staging DB reset;
- LiveKit removal.

## Goal

Record the agreed MVP file-transfer policy for message attachments before changing runtime upload behavior, and prepare the next bounded runtime implementation brief.

Users want to send more than images/PDF, including arbitrary work files and possibly executables. This must be handled deliberately:
- allowed types;
- blocked or download-only types;
- max file size;
- frontend `accept` behavior;
- backend MIME/size enforcement;
- preview vs download rendering;
- copy behavior;
- storage cost/security expectations;
- staging/prod rollout and smoke.

This segment is a policy/design segment. It should produce a concrete implementation recommendation and, if needed, the next runtime implementation brief. Do not broaden upload behavior until the policy is explicit.

## Current Facts From Code

Current backend policy:
- `apps/api/src/modules/storage/storage.service.ts`
  - `serverImage`: `image/*`, max `4 MB`;
  - `messageFile`: `image/*` and `application/pdf`, max `4 MB`;
  - storage access is `backend-redirect`;
  - files are currently `public` in provider visibility terms;
  - staged/finalized upload lifecycle exists.

Current frontend policy:
- `src/lib/shared/features/file-upload.tsx`
  - `serverImage`: image only;
  - `messageFile`: image/PDF only;
  - `accept="image/*,.pdf,application/pdf"`;
  - images render inline;
  - PDF renders as a file row/link.

Current stored value helpers:
- `packages/app-core/src/files/upload-file.ts`
  - stored upload metadata carries `fileKey`, `fileUrl`, `fileType`, and `backend-redirect`;
  - legacy detection currently knows image/PDF only.

Current message rendering:
- `src/lib/chat/features/chat-item.tsx`
  - image attachments render preview;
  - PDF attachments render a file row;
  - unknown file types are not currently a supported message render path.

## Policy Closeout Result

Final MVP decision:
- `messageFile` moves from the current `4 MB` image/PDF-only policy to a `50 MB` generic attachment policy in the next runtime segment;
- one attachment per message remains unchanged;
- images keep inline preview where already supported;
- PDFs keep the existing file row/open behavior;
- generic files render as download/open rows only;
- executable-like files, scripts, installers, archives, and unknown binaries are download-only and must not be inline-previewed, executed, auto-opened, or described as safe;
- backend validation is authoritative, frontend validation is UX only;
- `serverImage` remains image-only and `4 MB`;
- no antivirus/malware scanning claim is made;
- no storage provider/env/secrets/bucket policy, DB schema, auth, unread/realtime, media/WebRTC, link preview, or reply work is included in this policy segment.

Runtime brief prepared:
- `docs/delegation/briefs/SEGMENT_BRIEF_212_CUSTOMER_MESSAGE_GENERIC_FILE_ATTACHMENTS.md`

Deferred:
- `300 MB` transfer remains a separate large-file transfer design covering cost, body/proxy limits, direct/multipart/resumable upload, progress UI, quotas, retention, abuse/malware expectations, desktop behavior, and staging/prod smoke.

## Inspect First

Runtime files:
- `apps/api/src/modules/storage/storage.service.ts`;
- `apps/api/src/modules/storage/storage.controller.ts`;
- `apps/api/src/modules/storage/storage.types.ts`;
- `apps/api/src/modules/storage/s3-compatible-storage.provider.ts`;
- `packages/sdk/src/actions/storage.ts`;
- `packages/app-core/src/files/upload-file.ts`;
- `packages/app-core/src/schemas/message-file-schema.ts`;
- `src/lib/shared/features/file-upload.tsx`;
- `src/lib/shared/features/modals/message-file-modal.tsx`;
- `src/lib/chat/features/chat-item.tsx`;
- `src/lib/chat/features/message-copy.ts`.

Docs:
- `docs/roadmap/BOUNDARIES.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## In Scope

- Inventory the current message attachment upload path end to end.
- Record the agreed MVP allowed upload categories for `messageFile`.
- Record that `.exe` and executable-like files are allowed only as download-only generic attachments.
- Record `50 MB` as the initial max file size for `messageFile`.
- Record preview/render behavior by category:
  - image preview;
  - PDF row/link;
  - generic file row/download link;
  - never inline-preview executable or unknown binary files.
- Decide the concrete frontend `accept` implementation for the next runtime segment:
  - broad `*/*`;
  - explicit extensions;
  - or a staged hybrid.
- Decide backend MIME/extension validation implementation details for the next runtime segment.
- Decide error copy and UX details for rejected/over-size files.
- Decide smoke coverage and rollout order for staging.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.
- Because the policy is now clear, create the next runtime implementation brief: `customer-message-generic-file-attachments`.

## Agreed MVP Policy

Operator/product decision after discussion:
- initial MVP cap is `50 MB` per `messageFile`;
- one attachment per message remains unchanged;
- broaden message files beyond images/PDF to generic work-file attachments;
- images keep inline preview where already supported;
- PDF keeps the existing file row/open behavior;
- all other files render as generic download/open rows, not previews;
- executable-like files are allowed only as download-only attachments:
  - examples: `.exe`, `.msi`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.apk`;
  - archives are also download-only;
  - the app must not inline-preview, execute, auto-open, or claim safety for these files;
- backend validation/enforcement is authoritative;
- frontend validation is UX only;
- no antivirus/malware scanning claim is allowed in this slice;
- no provider/env/bucket policy change is part of the MVP policy segment.

Large-file decision:
- customer requests up to `300 MB` are not part of the immediate MVP;
- `300 MB` belongs to a separate large-file transfer mode/design segment;
- that later segment must decide storage cost/billing, Yandex Cloud paid-plan acceptance, upload timeout and body-limit risks, direct-to-object-storage or multipart/resumable upload, progress UI, quota/retention policy, abuse/malware expectations, desktop behavior, and staging/prod smoke.

## Out Of Scope

- Runtime expansion of allowed file types unless the policy task explicitly converts into a very small implementation and all checks remain safe.
- Antivirus/malware scanning implementation.
- Private/signed object access migration.
- Chunked/resumable uploads.
- Multiple attachments per message.
- Drag-and-drop attachments.
- Reply-to-message.
- Link previews.
- Backend auth/session changes.
- WebRTC/media changes.
- DB schema changes unless a concrete need is discovered and separately justified.

## Expected Policy Direction

The MVP direction is conservative but useful:
- keep images and PDFs as they are;
- add generic file attachment support as download-only;
- allow executable-like files only as download-only generic attachments;
- do not inline-preview executables, archives, scripts, installers, or unknown binaries;
- do not attempt malware scanning in this slice, but document the risk plainly;
- use `50 MB` as the initial per-file `messageFile` cap;
- keep backend enforcement authoritative, with frontend checks as UX only;
- keep storage behind the existing backend-owned storage boundary.

Rationale:
- current limit is `4 MB`, which is too small for normal work files;
- `50 MB` is enough for documents, archives, screenshots, small builds, and common collaboration files;
- `300 MB` increases storage cost, upload timeout risk, request/body-limit risk, and abuse surface enough to require a separate design;
- keeping generic files download-only avoids false preview/safety expectations.

## Acceptance Criteria

Policy/design:
- current upload path is documented accurately;
- allowed file policy is explicit and matches the agreed MVP policy above;
- max size is explicitly `50 MB` for MVP;
- `.exe` and other executable-like behavior is explicitly download-only;
- preview vs download behavior is explicit;
- frontend/backend validation responsibilities are explicit;
- staging smoke plan is explicit;
- risks and non-goals are explicit.

Docs:
- customer delivery plan records the decision;
- stage status records the next runtime segment;
- if a runtime segment is next, a bounded brief exists for it.

No unsafe work:
- no staging/prod DB reset;
- no production upload rollout;
- no storage secret/env changes;
- no bucket policy changes;
- no malware-scanning claims.

## Verification Commands

For docs-only policy work, run:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd x next lint
```

If runtime code is changed despite the expected docs-first scope, also run:

```powershell
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd run build:web
bun.cmd run check:desktop:config
```

No migration command should be required.

## Manual / Operator Notes

No manual smoke is expected for the policy-only segment.

If the segment includes any runtime implementation, manual smoke must include:
- image upload still previews;
- PDF upload still opens;
- generic file upload renders as a download row;
- blocked type/oversize error is visible;
- copy action uses a useful access URL;
- staging upload path still works without exposing secrets.

## Handoff Format

Return:
- branch name;
- files changed;
- current upload policy inventory;
- final recommended MVP policy;
- explicit `.exe` decision;
- explicit max-size decision;
- next implementation brief/path if created;
- verification command results;
- risks and deferred items.

Do not commit automatically. Return PowerShell-safe `git add` / `git commit` commands.
