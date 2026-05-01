# Segment Brief 054: Stage 5A Runtime Sweep and Closeout

## Segment ID

`stage5a-runtime-sweep-and-closeout`

## Branch

`reborn/fix`

## Goal

Run the closing verification sweep for `Stage 5A / Wave 26: WEB_RUNTIME_API_EXTRACTION`.

Confirm that the active web runtime no longer depends on `Next` API/proxy ownership for product API access, storage access, or legacy socket HTTP routes. If the sweep is clean, update source-of-truth docs to mark the `Stage 5A` runtime/API extraction work as stable enough to proceed to the mandatory `Wave 27 / VENDOR_REPO_CLEANUP`.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_044_WEB_RUNTIME_PROXY_ROUTE_INVENTORY.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_053_STORAGE_ACCESS_DIRECT_BACKEND_CLEANUP.md`
- this brief

## Current Context

- Current stage/wave: `Stage 5A / Wave 26: WEB_RUNTIME_API_EXTRACTION`.
- `direct backend mode` is the active runtime target.
- `Next` should remain the web shell/router layer, not the product API/proxy owner.
- `src/app/api/*` route files are not expected to exist after Segment 053.
- `src/pages/api/socket/*` HTTP compatibility routes are not expected to exist after Segment 047.
- Socket transport must use the backend realtime gateway at `${publicApiOrigin}/realtime`.
- `NEXT_PUBLIC_API_URL` is a REST API base URL and may include `/api`, for example:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Do not use that full REST URL directly as the socket origin. Socket origin must be normalized through the existing public API origin helper.

## Scope

### In Scope

- Search for remaining raw API calls, URL builders, same-origin fallback assumptions, and stale route references in active code.
- Verify that active web runtime access goes through `packages/sdk`, shared helpers, or backend-aware URL builders where appropriate.
- Verify the targeted runtime areas:
  - auth login/register/logout/session refresh/protected-entry assumptions
  - storage upload/delete/access URLs
  - chat read/write URL paths and realtime/socket separation
  - media token/leave behavior
  - server switch routing/prefetch behavior
- Fix narrow residual issues only if they are clearly in `Stage 5A` scope.
- Update source-of-truth docs if the sweep confirms Stage 5A route/API cleanup is stable.
- Prepare the handoff stating that `Wave 27 / VENDOR_REPO_CLEANUP` is the next mandatory wave.

### Out of Scope

- Starting `Wave 27` cleanup in this segment.
- `Postgres` migration.
- media rewrite or replacing `LiveKit`.
- auth redesign or auth hardening implementation.
- broad frontend rewrite to `React + Vite`.
- reintroducing `Next` API/proxy routes.
- removing historical roadmap references that describe migration history.
- broad cleanup unrelated to active runtime direct-backend assumptions.

## Files and Areas to Inspect First

- `packages/sdk/src`
- `packages/app-core/src/api`
- `packages/app-core/src/files`
- `src/lib/shared/utils`
- `src/lib/shared/data-access`
- `src/lib/shared/providers/socket-provider.tsx`
- `src/app/(main)/layout.tsx`
- `src/middleware.ts`
- `src/lib/shared/utils/auth-middleware.ts`
- `src/lib/shared/utils/upload-file.ts`
- `src/lib/chat`
- `src/lib/media`
- `src/lib/navigation`
- `src/lib/server-list-sidebar`
- `apps/api/src/modules/auth`
- `apps/api/src/modules/storage`
- `apps/api/src/modules/messages`
- `apps/api/src/modules/direct-messages`
- `apps/api/src/modules/media`
- `apps/api/src/modules/realtime`

## Expected Code Search

Run targeted searches across `src`, `packages`, `apps`, config files, and docs as appropriate.

Minimum search patterns:

```text
/api/socket
src/pages/api/socket
src/app/api
/api/storage/access
/api/server-upload
/api/livekit
/api/user
/api/auth/login
/api/auth/register
/api/auth/session/logout
axios.
fetch(
privateApiInstance
publicApiInstance
NEXT_PUBLIC_API_URL
API_INTERNAL_URL
API_EXTERNAL_URL
getPublicApiOrigin
getPublicBackendApiBaseUrl
resolveBackendApiUrl
/realtime
```

When a match is in docs, classify whether it is current operational guidance or valid migration history.

## Expected Work

### 1. Verify route absence

Confirm:

- no `src/app/api/*` route files exist
- no `src/pages/api/socket/*` route files exist

If either exists, inspect before acting. Do not delete broad surfaces without proving caller state.

### 2. Audit active runtime API access

Check that product API calls in active UI/runtime code do not rely on same-origin `Next` API fallback.

Expected direction:

- shared SDK/query/mutation/action helpers use backend-aware clients
- app-specific UI calls shared helpers rather than raw same-origin endpoints
- any raw `fetch`/`axios` call is either not product API ownership or is justified by local runtime needs

### 3. Audit URL builders

Check URL builders for:

- duplicate `/api/api`
- socket incorrectly using REST base URL with `/api`
- storage access falling back to same-origin `/api/storage/access`
- direct public storage URL being used where backend access policy should own access

### 4. Audit fallback assumptions

Look for code that still assumes removed routes exist:

- `/api/socket/*`
- `/api/server-upload`
- `/api/livekit`
- `/api/user`
- app-router auth/profile routes
- app-router storage access route

If found in active code, either fix narrowly or report as blocker with file/path evidence.

### 5. Targeted verification

Run available static checks first:

- package typecheck/build checks that are already used in the repo
- targeted lint if available and relevant
- API typecheck/build if touched or if commands are cheap enough

Also perform logical/runtime verification notes for:

- auth: login/register/logout/session refresh/protected-route entry path
- storage: upload/delete/access URL construction
- chat: read/write domain API paths, pagination, realtime event separation
- media: token action path and leave redirect behavior
- server switch: direct initial channel navigation and prefetch behavior

The user has already manually clicked the frontend and reported that it works through the API. Treat that as supporting evidence, not a replacement for code search.

### 6. Update docs if clean

If no blockers remain, update concisely:

- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Optional only if wording is stale:

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`

Docs should state that the Stage 5A direct-backend runtime sweep has been completed and that the next planned wave is mandatory `Wave 27 / VENDOR_REPO_CLEANUP`.

Do not mark `Stage 6` as started.

## Acceptance Criteria

- Code search proves no active dependency remains on removed `Next` product API/proxy routes.
- `src/app/api/*` and `src/pages/api/socket/*` route files remain absent.
- Product API access in active web runtime is backend-aware and owned by `packages/sdk` or existing shared helpers.
- Socket URL construction uses backend origin, not REST base URL with `/api`.
- Storage access URLs go to backend `/api/storage/access`, not Next same-origin proxy.
- Any remaining raw API calls are classified and justified.
- Targeted verification commands are run or explicitly reported as unavailable.
- Source-of-truth docs are updated only if code and verification support the closeout.
- Handoff clearly says whether `Wave 27 / VENDOR_REPO_CLEANUP` can start next.

## Verification Commands

Start with:

```powershell
git status --short --branch
git log --oneline -8
git diff --name-only
```

Then use `rg` searches rather than manual guessing.

Suggested static verification depends on available package scripts. Inspect `package.json` before running expensive commands.

## Handoff Format

### Summary

- whether Stage 5A runtime sweep is clean
- whether docs were updated
- whether Wave 27 can start next

### Code Search Proof

- commands/patterns used
- important matches and classification
- any remaining active raw calls and why they are acceptable

### Changed Files

- flat list

### Validation

- commands run
- commands not run and why
- manual/runtime evidence considered

### Risks

- remaining runtime risks
- any assumptions requiring follow-up

### Next Segment

- expected next segment: `Wave 27 / VENDOR_REPO_CLEANUP`
- recommended brief: `docs/delegation/briefs/SEGMENT_BRIEF_033_VENDOR_REPO_CLEANUP.md`, or prepare a refreshed `055` brief if the team wants numbering continuity
