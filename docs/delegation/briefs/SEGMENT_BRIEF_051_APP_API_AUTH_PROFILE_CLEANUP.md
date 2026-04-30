# Segment Brief 051: App API Auth/Profile Cleanup

## Segment ID

`app-api-auth-profile-cleanup`

## Branch

`wave/stage5a-app-api-auth-profile-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the remaining auth/profile `src/app/api/*` compatibility routes after verifying that direct backend mode and shared SDK ownership cover the active product flow.

This is an auth-sensitive slice. Do not redesign auth. Only remove the transitional Next app-router fallback layer when the backend-owned endpoints are already used by the SDK.

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
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/session/logout/route.ts`
  - `src/app/api/user/route.ts`
- remove auth SDK fallback paths to same-origin app-router routes:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/user`
- use backend-owned auth/profile endpoints directly through the backend-aware SDK:
  - `POST /api/auth/login/password`
  - `POST /api/auth/register/password`
  - `POST /api/auth/session/logout`
  - `GET /api/auth/session`
- delete the auth/profile app-router proxy routes only after caller search proves they are no longer required
- update docs concisely with what was removed and what remains

### Out of Scope

- changing cookie names or cookie security policy
- changing login/register/logout UX
- adding email verification
- adding password reset
- changing protected route strategy
- changing `middleware`
- removing storage routes
- removing `src/app/api/server-upload/route.ts`
- removing `src/app/api/storage/access/route.ts`
- broad deletion of `src/app/api/*`

## Expected Work

### 1. Re-verify auth/profile usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/session/logout`
- `/api/user`
- `/api/auth/session`
- direct `fetch` calls
- direct axios calls outside SDK

Active auth/profile runtime should go through:
- `packages/sdk/src/actions/auth.ts`
- `packages/sdk/src/queries/profile.ts`
- `apps/api/src/modules/auth/auth.controller.ts`

### 2. Remove transitional fallback path helpers

In `packages/sdk/src/actions/auth.ts`, remove fallback branching that depends on `getBackendApiBaseUrl()` and always call:
- `/api/auth/login/password`
- `/api/auth/register/password`

Keep logout on:
- `/api/auth/session/logout`

In `packages/sdk/src/queries/profile.ts`, remove fallback branching and always call:
- `/api/auth/session`

Keep response normalization if it is still needed for the backend session shape.

### 3. Remove proven-unused app API routes

If verification confirms active flows are covered, delete:
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/session/logout/route.ts`
- `src/app/api/user/route.ts`

Do not remove storage routes in this slice.

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` app API auth/profile routes are transitional compatibility and can be removed once SDK/backend ownership covers login, register, logout, and session/profile reads.

## Suggested Commit Split

Commit 1:
- remove auth/profile SDK fallback branching
- keep runtime behavior pointed at backend-owned endpoints

Commit 2:
- delete proven-unused auth/profile app-router proxy routes
- update docs

## Acceptance Criteria

- login still typechecks through `POST /api/auth/login/password`
- register still typechecks through `POST /api/auth/register/password`
- logout still typechecks through `POST /api/auth/session/logout`
- profile/session read still typechecks through `GET /api/auth/session`
- no active dependency on `/api/auth/login`, `/api/auth/register`, or `/api/user` remains outside docs/history
- no unrelated app API routes are removed
- docs are updated concisely

## Verification

- typecheck
- API typecheck
- lint changed files where applicable
- targeted code search proving no active dependency on deleted app API auth/profile routes
- runtime sanity if available:
  - register
  - login
  - refresh protected page/profile state
  - logout
  - guest-only redirect after logout

## Handoff Format

- removed fallback paths
- removed routes
- code-search proof
- verification performed
- remaining `src/app/api/*` compatibility routes
- next recommended route-family cleanup
