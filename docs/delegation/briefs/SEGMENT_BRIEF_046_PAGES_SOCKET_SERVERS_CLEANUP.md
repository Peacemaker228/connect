# Segment Brief 046: Pages Socket Servers Cleanup

## Segment ID

`pages-socket-servers-cleanup`

## Branch

`wave/stage5a-pages-socket-servers-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by cleaning the legacy `pages/api/socket/servers/*` route family after Segment 044 inventory and Segment 045 channels/members cleanup.

This slice must distinguish between actually dead server socket routes and transitional fallback routes that are still referenced by SDK code.

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

- verify active callers for:
  - `src/pages/api/socket/servers/[serverId]/leave.ts`
  - `src/pages/api/socket/servers/invite.ts`
- remove `src/pages/api/socket/servers/[serverId]/leave.ts` only if repeated code search still proves it has no active callers
- keep `src/pages/api/socket/servers/invite.ts` if it is still used as SDK fallback
- update docs concisely with what was removed and what remains

### Out of Scope

- removing all `pages/api/socket/*`
- removing messages/direct-messages socket compatibility routes
- removing `src/app/api/*`
- changing invite join behavior
- changing server leave behavior in `apps/api`
- changing SDK behavior unless a tiny fallback clarification is required
- auth, storage, media, or database migration work

## Expected Work

### 1. Re-verify route usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/socket/servers`
- `/api/socket/servers/invite`
- `/api/socket/servers/*/leave`
- route file imports
- dynamic URL builders that could still target these routes

### 2. Remove only dead server socket route

If no active callers exist, delete:
- `src/pages/api/socket/servers/[serverId]/leave.ts`

Do not delete:
- `src/pages/api/socket/servers/invite.ts`

unless code search proves it is no longer referenced and direct backend fallback behavior is explicitly handled. At the time of this brief, `packages/sdk/src/mutations/invite.ts` is expected to still reference `/api/socket/servers/invite` as fallback, so deletion is not expected.

### 3. Keep active server/invite paths intact

Server leave should continue through:
- `packages/sdk/src/mutations/membership.ts`
- backend-owned `/api/servers/:serverId/leave`
- remaining `src/app/api/servers/[serverId]/leave` compatibility where applicable

Invite join fallback should remain intact if still referenced by:
- `packages/sdk/src/mutations/invite.ts`

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` API fallback is transitional compatibility. This slice removes only server socket routes with no active callers and keeps fallback routes that are still referenced.

## Acceptance Criteria

- `servers/[serverId]/leave` socket route is removed only if no active callers remain
- `servers/invite` socket route is kept if SDK fallback still references it
- no unrelated proxy routes are removed
- server leave and invite join paths still typecheck
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no remaining active caller for deleted server socket routes
- targeted code search proving any kept server socket route is still intentionally referenced
- runtime sanity if available:
  - leave server
  - join invite

## Handoff Format

- removed routes
- kept server socket routes and why
- code-search proof
- verification performed
- any remaining legacy `pages/api/socket/*` routes
- next recommended route-family cleanup
