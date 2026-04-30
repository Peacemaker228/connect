# Segment Brief 053: Storage Access Direct Backend Cleanup

## Segment ID

`storage-access-direct-backend-cleanup`

## Branch

`wave/stage5a-storage-access-direct-backend-cleanup`

## Goal

Complete the remaining `Stage 5A / Wave 26` app-router cleanup by moving runtime file read/access URLs off the same-origin Next route and onto direct backend storage access URLs.

Remove:

- `src/app/api/storage/access/route.ts`

Only after stored file access URLs are built as direct backend URLs.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_044_WEB_RUNTIME_PROXY_ROUTE_INVENTORY.md`
- this brief

## Runtime Decision

Use direct backend URL for storage access.

Expected local env shape:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Important: if the configured base URL already ends with `/api`, do not produce `/api/api/storage/access`.

The final access URL should look like:

```text
http://localhost:4000/api/storage/access?endpoint=serverImage&fileKey=...
```

## Scope

### In Scope

- update storage access URL building so active UI/file flows no longer produce same-origin `/api/storage/access?...`
- preserve backend-owned storage policy through backend `/api/storage/access`
- preserve current `backend-redirect` behavior
- preserve legacy public URL compatibility
- delete `src/app/api/storage/access/route.ts` after caller search proves it is no longer required
- update `next.config.mjs` if `next/image` needs the direct backend API origin in `images.remotePatterns`
- update docs concisely after removal

### Out of Scope

- signed-url implementation
- proxy-stream implementation
- private file redesign
- storage provider change
- bucket/env redesign
- upload/delete changes
- legacy URL mass migration
- changing message/server storage schema
- broad frontend rewrite

## Expected Work

### 1. Re-verify current access callers

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `buildStorageAccessPath`
- `/api/storage/access`
- `storage/access`
- `getUploadValueParts`

Known active callers:
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/shared/features/file-upload.tsx`
- `src/lib/navigation/features/navigation-item.tsx`
- `packages/app-core/src/files/upload-file.ts`

### 2. Add safe direct backend URL construction

Update the storage access path builder so it can build direct backend URLs.

Recommended shape:
- keep parsing/serialization in `packages/app-core/src/files/upload-file.ts`
- introduce or reuse a small shared backend URL resolver instead of hardcoding host strings in UI components
- normalize base URLs so both of these work:
  - `NEXT_PUBLIC_API_URL=http://localhost:4000`
  - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

Avoid creating a second inconsistent backend URL resolver if existing SDK logic can be reused or moved into a shared app-core helper cleanly.

### 3. Preserve backend storage boundary

Do not switch directly to provider public URLs as the primary builder.

The client should still hit:

```text
/api/storage/access
```

on the backend API origin, not the Next web origin.

This keeps:
- folder validation
- fileKey normalization
- legacy read compatibility
- backend-redirect policy

### 4. Check `next/image` behavior

Because current image usage includes `next/image`, direct backend absolute URLs may require `next.config.mjs` to allow the backend API origin.

Inspect and update if needed:

- `next.config.mjs`

Keep existing `STORAGE_PUBLIC_BASE_URL` remote pattern support.

If adding an API origin pattern, derive it from env safely and include port when present.

### 5. Remove the Next route

After direct backend URL building is verified, delete:

- `src/app/api/storage/access/route.ts`

Do not leave same-origin `/api/storage/access` callers in active code.

### 6. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md` if remaining-route wording becomes stale

The docs should say that no `src/app/api/*` compatibility route remains after this slice, unless code search proves otherwise.

## Acceptance Criteria

- active storage access URLs resolve to direct backend API origin
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api` does not produce duplicate `/api/api`
- no active `/api/storage/access` same-origin dependency remains
- `src/app/api/storage/access/route.ts` is deleted
- `src/app/api` has no remaining route files, unless code search reveals an intentional exception
- existing upload/delete behavior is unchanged
- backend `GET /api/storage/access` remains the storage access policy owner
- docs are updated concisely

## Verification

- targeted code search for:
  - `/api/storage/access`
  - `src/app/api/storage/access`
  - `buildStorageAccessPath`
- typecheck
- API typecheck
- lint changed files where applicable
- runtime sanity if available:
  - existing server image displays
  - uploaded server image preview displays
  - uploaded message image displays
  - uploaded message PDF link opens
  - browser Network shows `localhost:4000/api/storage/access?...`, not Next same-origin `/api/storage/access?...`

## Handoff Format

- URL builder changes
- `next/image` / `next.config.mjs` handling
- removed route
- code-search proof
- verification performed
- remaining `src/app/api/*` files, if any
- whether this closes the route-cleanup part of `Stage 5A`
