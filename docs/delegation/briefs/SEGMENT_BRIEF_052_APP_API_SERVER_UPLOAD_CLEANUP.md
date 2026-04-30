# Segment Brief 052: App API Server Upload Cleanup

## Segment ID

`app-api-server-upload-cleanup`

## Branch

`wave/stage5a-app-api-server-upload-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the remaining storage upload/delete same-origin fallback route:

- `src/app/api/server-upload/route.ts`

This slice should move storage upload/delete runtime fully onto backend-owned storage endpoints through `packages/sdk`.

Do not touch runtime file read/access URL behavior in this segment.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_044_WEB_RUNTIME_PROXY_ROUTE_INVENTORY.md`
- this brief

## Scope

### In Scope

- verify active callers and fallback references for:
  - `src/app/api/server-upload/route.ts`
  - `/api/server-upload`
  - `/api/storage/upload`
  - `/api/storage/file`
- remove storage SDK fallback paths to same-origin `/api/server-upload`
- make storage SDK upload/delete always use backend-owned endpoints:
  - `POST /api/storage/upload`
  - `DELETE /api/storage/file`
- delete `src/app/api/server-upload/route.ts` only after caller search proves it is no longer required
- update docs concisely with what was removed and what remains

### Out of Scope

- changing storage provider behavior
- changing bucket/provider configuration
- changing upload metadata model
- changing file URL/read behavior
- changing `backend-redirect`
- changing legacy public URL compatibility
- removing `src/app/api/storage/access/route.ts`
- changing `packages/app-core/src/files/upload-file.ts`
- broad deletion of `src/app/api/*`
- auth/profile changes

## Expected Work

### 1. Re-verify server-upload usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/server-upload`
- `server-upload`
- `/api/storage/upload`
- `/api/storage/file`
- direct `fetch` calls
- direct axios calls outside SDK

Active storage upload/delete runtime should go through:
- `packages/sdk/src/actions/storage.ts`
- backend-owned `/api/storage/upload`
- backend-owned `/api/storage/file`

### 2. Remove transitional fallback path helpers

In `packages/sdk/src/actions/storage.ts`, remove fallback branching that depends on `getBackendApiBaseUrl()` and always call:

- `/api/storage/upload`
- `/api/storage/file`

Keep existing payloads, response shape, error handling, and staged upload lifecycle unchanged.

### 3. Remove proven-unused app API route

If verification confirms active flows are covered, delete:

- `src/app/api/server-upload/route.ts`

Do not remove:

- `src/app/api/storage/access/route.ts`

That route is still active because stored file read/access URLs are still built as `/api/storage/access?...`.

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md` if their remaining-route wording becomes stale

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` app API storage upload/delete fallback is transitional compatibility and can be removed once SDK/backend ownership covers active upload/delete flows.

`src/app/api/storage/access/route.ts` remains active until file access URL building supports direct backend mode.

## Suggested Commit Split

Commit 1:
- remove storage SDK fallback branching
- keep upload/delete behavior pointed at backend-owned endpoints

Commit 2:
- delete `src/app/api/server-upload/route.ts`
- update docs

## Acceptance Criteria

- upload still typechecks through `POST /api/storage/upload`
- delete still typechecks through `DELETE /api/storage/file`
- no active dependency on `/api/server-upload` remains outside docs/history
- `src/app/api/storage/access/route.ts` remains untouched
- no unrelated app API routes are removed
- docs are updated concisely

## Verification

- typecheck
- API typecheck
- lint changed files where applicable
- targeted code search proving no active dependency on deleted server-upload route
- runtime sanity if available:
  - upload server image
  - upload message file
  - delete uploaded/replaced file
  - open/read an existing uploaded file through current storage access path

## Handoff Format

- removed fallback paths
- removed route
- code-search proof
- verification performed
- remaining `src/app/api/*` compatibility routes
- next recommended route-family cleanup
