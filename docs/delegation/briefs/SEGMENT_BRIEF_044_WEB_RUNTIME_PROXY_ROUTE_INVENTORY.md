# Segment Brief 044: Web Runtime Proxy Route Inventory

## Segment ID

`web-runtime-proxy-route-inventory`

## Branch

`wave/stage5a-web-runtime-proxy-route-inventory`

## Goal

Continue `Wave 26 / Stage 5A` by inventorying the remaining `Next` compatibility/proxy routes before any broad deletion.

This is an inventory-first cleanup slice. It must make the remaining proxy surface explicit and remove only routes that are proven unused and safe to remove.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- this brief

## Scope

### In Scope

- inventory remaining `src/app/api/*` routes
- inventory remaining `src/pages/api/*` routes
- classify each route as:
  - active compatibility route
  - transitional fallback route
  - unused/dead route candidate
  - not safe to remove yet
- remove only routes that are proven unused by code search and runtime assumptions
- document the inventory result in the wave/status docs

### Out of Scope

- broad deletion of all `Next` API routes
- changing backend domain behavior
- changing auth/session/storage/media/realtime architecture
- `Postgres` migration
- frontend rewrite to `React + Vite`

## Expected Work

### 1. Build the inventory

Inspect:
- `src/app/api/*`
- `src/pages/api/*`
- `packages/sdk/src`
- `src/lib`
- `src/app`

Use code search to find active callers for each proxy route.

### 2. Classify route ownership

For every remaining route, decide whether it is:
- still required for active runtime
- required only for transitional compatibility
- dead and removable
- unclear and must be kept

Do not guess. If uncertain, keep the route and document why.

### 3. Remove only proven-dead routes

Only delete a route if:
- no active caller exists
- direct backend mode covers the product flow
- docs/brief constraints allow removal
- typecheck/lint stay green

### 4. Document the result

Update docs with:
- what routes remain
- what routes were removed, if any
- what still blocks broader proxy deletion
- the next recommended cleanup slice

## Runtime Assumption

`direct backend mode` is the active target for `Stage 5A`.

That means browser API calls should go to `apps/api` through `packages/sdk`, not rely on same-origin `Next` API routes as the product runtime.

Same-origin `Next` API routes may remain only as transitional compatibility until explicitly inventoried and removed.

## Acceptance Criteria

- remaining `Next` API/proxy route surface is inventoried
- no broad route deletion is performed without proof
- any removed route is backed by code search and direct backend coverage
- direct backend mode remains the active runtime path
- docs clearly state what remains and why

## Verification

- typecheck
- lint changed files
- targeted runtime sanity for:
  - login/session
  - server/channel/member mutations
  - channel messages
  - direct messages
  - file upload/read/delete
  - LiveKit token request

## Handoff Format

- route inventory table or bullet list
- removed routes, if any
- kept routes and why
- verification performed
- next recommended slice
