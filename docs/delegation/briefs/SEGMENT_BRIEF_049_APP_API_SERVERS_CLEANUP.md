# Segment Brief 049: App API Servers Cleanup

## Segment ID

`app-api-servers-cleanup`

## Branch

`wave/stage5a-app-api-servers-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the `src/app/api/servers/*` compatibility route family after channels/members app API cleanup.

This slice targets only server app-router proxy routes whose active client flows already go through backend-aware SDK queries/mutations.

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
  - `src/app/api/servers/route.ts`
  - `src/app/api/servers/[serverId]/route.ts`
  - `src/app/api/servers/[serverId]/invite-code/route.ts`
  - `src/app/api/servers/[serverId]/leave/route.ts`
- remove these routes only if direct backend mode and SDK ownership cover the active flows
- update docs concisely with what was removed and what remains

### Out of Scope

- removing all `src/app/api/*`
- removing `src/app/api/messages` or `src/app/api/direct-messages`
- removing auth routes
- removing storage routes, especially `src/app/api/storage/access/route.ts`
- removing `server-upload` or `livekit`
- changing backend server behavior
- changing SDK server/membership contracts unless a tiny cleanup is required

## Expected Work

### 1. Re-verify usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/servers`
- `/api/servers/:serverId`
- `/api/servers/:serverId/invite-code`
- `/api/servers/:serverId/leave`
- direct fetch/axios calls that would still require same-origin `src/app/api/servers/*` fallback

### 2. Confirm active SDK/backend paths

Active server flows should go through:
- `packages/sdk/src/queries/server.ts`
- `packages/sdk/src/mutations/server.ts`
- `packages/sdk/src/mutations/membership.ts`
- backend-owned `/api/servers`
- backend-owned `/api/servers/:serverId`
- backend-owned `/api/servers/:serverId/invite-code`
- backend-owned `/api/servers/:serverId/leave`

`direct backend mode` is the active runtime assumption. Same-origin `src/app/api` fallback is no longer required for these newly cleaned routes.

### 3. Remove proven-unused app API routes

If verification confirms active flows are covered, delete:
- `src/app/api/servers/route.ts`
- `src/app/api/servers/[serverId]/route.ts`
- `src/app/api/servers/[serverId]/invite-code/route.ts`
- `src/app/api/servers/[serverId]/leave/route.ts`

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` app API routes are transitional compatibility and can be removed route-family by route-family when SDK/backend ownership covers the active product flow.

## Acceptance Criteria

- server app API proxy routes are removed only after caller search and SDK/backend coverage are verified
- server list/detail/create/edit/delete flows still typecheck through SDK/backend paths
- invite-code refresh still typecheck through SDK/backend paths
- server leave still typecheck through SDK/backend paths
- no unrelated app API routes are removed
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no active `src/app/api/servers` route dependency remains
- runtime sanity if available:
  - server list
  - server detail
  - create server
  - edit server
  - delete server
  - regenerate invite code
  - leave server

## Handoff Format

- removed routes
- code-search proof
- verification performed
- remaining `src/app/api/*` compatibility routes
- next recommended route-family cleanup
