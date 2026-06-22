# Segment 231C. Desktop File Download UX Polish

## Classification

- segment: `desktop-file-download-ux-polish`
- type: `desktop release / file download UX`
- status: `review / implementation added; packaged smoke pending`
- target branch: `feature/desktop-file-download-ux-polish`
- base branch: latest `origin/core/reborn`
- commit policy: do not commit automatically

## Repository Reality At Brief Time

- `git status --short --branch`: `## core/reborn...origin/core/reborn`
- recent source version alignment: staging web/desktop source is synchronized to `0.0.7`
- staging desktop auto-update proof, hardening, and visible update-ready UX have passed packaged smoke
- CI/CD release pipeline and production desktop rollout are intentionally deferred

## Goal

Make generic non-image/non-PDF message attachment downloads feel native and clear in the packaged desktop app.

Current known issue from Segment 229:

- clicking a generic file in Electron can open an extra window and then a native save/download flow;
- download completion is unclear;
- the extra window may stay open;
- this feels unlike Telegram/Discord-style desktop file handling.

The target behavior for this slice:

- desktop generic file click uses a controlled app download path;
- no extra blank/browser window is opened;
- no automatic execution/opening of downloaded generic files;
- user sees clear downloading/success/error feedback;
- web behavior and current image/PDF preview/open behavior stay stable.

## Required Reading

Read these before coding:

- `rules/rules.md`
- `rules/task.md`
- `rules/auth-storage.md`
- `rules/for-brief.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_229_DESKTOP_RUNTIME_SMOKE_PASS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_231B_DESKTOP_UPDATE_READY_UX_POLISH.md`
- `electron/README.md`

Note:

- Some early `DESKTOP_RELEASE_ROADMAP.md` inventory/risk text still contains stale pre-updater wording. Treat the latest Segment 229-231B entries and `STAGE_STATUS.md` current blockers as the current state.

## Files To Inspect First

- `electron/main.js`
- `electron/preload.js`
- `global.d.ts`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/message-copy.ts`
- `packages/app-core/src/files/upload-file.ts`
- `apps/api/src/modules/storage/storage.controller.ts`
- `apps/api/src/modules/storage/storage.service.ts`
- `apps/api/src/modules/storage/s3-compatible-storage.provider.ts`
- `messages/en/channel-page.ts`
- `messages/ru/channel-page.ts`
- `src/lib/shared/utils/hooks/use-toast.ts`
- `src/lib/shared/ui/toast.tsx`

## In Scope

- Desktop-only generic file download UX for message attachments.
- A narrow Electron preload/main bridge if needed for controlled downloads.
- Renderer UI polish for generic attachment rows:
  - clear download action;
  - downloading state;
  - success/error feedback;
  - optional "show in folder" action after successful download if implemented safely.
- Safe filename handling, including Cyrillic names when available from stored upload metadata.
- Same-origin authenticated storage access through existing `/api/storage/access`.
- Keeping images and PDFs on their current behavior unless a small compatibility adjustment is required.
- Docs/status updates for this segment.

## Out Of Scope

- CI/CD release pipeline.
- Production desktop update provider or production rollout.
- Code signing / SmartScreen.
- Storage provider/env/bucket policy changes.
- DB schema/migrations.
- Upload limits, multiple attachments, `300 MB` large-file design, resumable uploads, antivirus/malware scanning.
- Link previews/unfurl.
- WebRTC/media work.
- A full download manager.
- Automatically opening executable-like files, scripts, installers, archives, or unknown binaries.

## Constraints

- Preserve staging data and current staging runtime.
- Do not reset DB or touch migrations.
- Do not broaden preload bridge permissions beyond this specific download need.
- Do not allow arbitrary renderer-controlled external URL downloads through Electron.
- Do not execute downloaded generic files automatically.
- Keep web behavior stable. Browser users should still be able to open/download attachments through the current web path.
- Prefer existing shared/shadcn/Radix UI primitives where they fit. If a native/custom control is chosen, document why.
- Keep the solution small enough to smoke-test manually in packaged desktop.

## Expected Implementation Shape

Recommended direction:

1. Inventory current flow.
   - Confirm generic attachment row uses `buildStorageAccessPath(...)`.
   - Confirm desktop currently treats the link through generic `target="_blank"` / `setWindowOpenHandler`.
   - Confirm backend `/api/storage/access` returns an authenticated redirect and S3 content disposition marks generic files as `attachment`.

2. Add a narrow desktop download bridge.
   - Add preload API such as `downloadFile(...)` and optionally `showDownloadedFile(...)` / `showItemInFolder(...)`.
   - Main process must validate:
     - sender origin is trusted;
     - URL is HTTP(S);
     - URL is same-origin app URL, preferably the `/api/storage/access` path;
     - suggested filename is sanitized and cannot escape the Downloads directory.
   - Download to the OS Downloads directory with a safe unique filename.
   - Return structured status/result to renderer. If progress events are practical, expose bounded progress; if not, at least provide pending/success/error.

3. Update generic attachment row.
   - In desktop runtime, generic file row should use the desktop bridge instead of opening a browser child window.
   - In web runtime, preserve the current link behavior.
   - Keep image inline preview unchanged.
   - Keep PDF behavior unchanged unless the implementation finds the same Electron bug there and can fix it without broadening scope.

4. Add user feedback.
   - Show downloading / downloaded / failed state in the row or with existing toast.
   - On success, do not auto-open/execute the file.
   - If a post-download action is added, prefer "Show in folder" over "Open file" for executable-like/generic files.

5. Update docs.
   - Record implementation and smoke requirements in this brief, `DESKTOP_RELEASE_ROADMAP.md`, `DESKTOP_RELEASE_RUNBOOK.md`, and `STAGE_STATUS.md`.

## Acceptance Criteria

- In packaged desktop, clicking a generic non-image/non-PDF attachment downloads the file without opening an extra Electron browser window.
- Download progress/pending and success/error are visible enough that the user understands what happened.
- Downloaded filename is useful and preserves Cyrillic display names when metadata provides them.
- `.exe`, scripts, archives, unknown binaries, and generic documents are not auto-opened/executed.
- Web browser behavior for the same attachment remains functional.
- Image inline preview is unchanged.
- PDF row/open behavior is unchanged unless explicitly documented.
- Copy action still copies a useful file URL and never `[object Object]`.
- Storage access remains behind the existing backend storage boundary.
- No DB/schema/migration/env changes.

## Implementation Result

- Added a narrow Electron download bridge:
  - `window.electron.downloadFile({ url, fileName })`;
  - `window.electron.showDownloadedFile(filePath)`.
- Main process validates the sender origin and accepts only same-origin `/api/storage/access` URLs for `endpoint=messageFile`.
- The authenticated storage access request uses the existing app session cookie only on the same-origin request; redirected public object download is fetched without forwarding that cookie.
- Files are saved to the OS Downloads directory using a sanitized unique filename; Cyrillic display names are preserved when present in upload metadata.
- Generic desktop attachment rows now use the bridge with `downloading` / `downloaded` / `failed` row feedback and toast feedback.
- Success feedback offers `Show in folder`, not `Open file`; generic/executable-like files are not auto-opened or executed.
- Ordinary browser web keeps the existing anchor behavior.
- Image inline preview, PDF row/open behavior, copy action, storage provider/env/bucket policy, DB/schema/migrations, and WebRTC/media were not changed.
- Packaged desktop runtime smoke was not run during implementation and remains required before marking this segment `pass`.

## Verification Commands

Run locally from PowerShell:

```powershell
git status --short --branch
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
bun.cmd run check:desktop:staging-config
node --check .\electron\main.js
node --check .\electron\preload.js
git diff --check
```

If Electron main/preload changes are made, also run:

```powershell
bun.cmd run build:desktop:staging
```

Generated outputs under `dist-desktop/*` and `electron/build-info.json` must remain ignored and uncommitted.

## Manual Smoke

Minimum desktop smoke:

- run packaged staging desktop or a dev desktop flow that exercises the Electron bridge;
- log in;
- open a channel/DM with uploaded attachments;
- click a generic document attachment;
- confirm no extra blank/windowed browser opens;
- confirm clear downloading/success/error feedback;
- confirm the file exists in Downloads and has a useful filename;
- click an archive or executable-like attachment and confirm it is downloaded-only, not auto-opened;
- click image attachment and confirm inline/open behavior did not regress;
- click PDF attachment and confirm current PDF behavior did not regress;
- copy message with attachment and confirm copied text is still useful;
- repeat after app restart.

If packaged desktop smoke is not run, classify the result as `review / desktop runtime smoke pending`, not `pass`.

## Handoff Format

Return:

- branch name and upstream status from `git status --short --branch`;
- changed files;
- implementation summary;
- exact desktop download behavior implemented;
- whether web behavior changed;
- verification command results;
- packaged desktop smoke result or explicit reason it is pending;
- residual risks;
- PowerShell-safe `git add` / `git commit` commands.
