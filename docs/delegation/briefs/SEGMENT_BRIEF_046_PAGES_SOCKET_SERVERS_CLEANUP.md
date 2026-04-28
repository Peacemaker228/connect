# Segment Brief 046: Pages Socket Servers Cleanup

## Segment ID

`pages-socket-servers-cleanup`

## Branch

`wave/stage5a-pages-socket-servers-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by cleaning the legacy `pages/api/socket/servers/*` route family after Segment 044 inventory and Segment 045 channels/members cleanup.

This slice removes the retired server socket routes after moving invite join off the legacy socket fallback.

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
- move invite join off `/api/socket/servers/invite` fallback and onto `/api/invites/join`
- remove `src/pages/api/socket/servers/invite.ts` after the fallback is removed and code search proves no remaining active callers
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

### 3. Move and remove invite socket fallback

Update `packages/sdk/src/mutations/invite.ts` so invite join uses `/api/invites/join` through the backend-aware client instead of `/api/socket/servers/invite`.

After the SDK fallback is removed and code search confirms no active callers remain, delete:
- `src/pages/api/socket/servers/invite.ts`

### 4. Keep active server/invite paths intact

Server leave should continue through:
- `packages/sdk/src/mutations/membership.ts`
- backend-owned `/api/servers/:serverId/leave`
- remaining `src/app/api/servers/[serverId]/leave` compatibility where applicable

Invite join should continue through:
- `packages/sdk/src/mutations/invite.ts`
- backend-owned `/api/invites/join`

### 5. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` API fallback is transitional compatibility. This slice deliberately drops the legacy socket fallback for invite join and removes the retired server socket routes.

## Acceptance Criteria

- `servers/[serverId]/leave` socket route is removed only if no active callers remain
- invite join no longer references `/api/socket/servers/invite`
- `servers/invite` socket route is removed after the SDK fallback is moved
- no unrelated proxy routes are removed
- server leave and invite join paths still typecheck
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no remaining active caller for deleted server socket routes
- targeted code search proving no remaining active `/api/socket/servers/invite` caller outside docs
- runtime sanity if available:
  - leave server
  - join invite

## Handoff Format

- removed routes
- invite fallback change
- code-search proof
- verification performed
- any remaining legacy `pages/api/socket/*` routes
- next recommended route-family cleanup
