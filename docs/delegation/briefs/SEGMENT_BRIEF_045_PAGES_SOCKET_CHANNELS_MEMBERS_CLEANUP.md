# Segment Brief 045: Pages Socket Channels/Members Cleanup

## Segment ID

`pages-socket-channels-members-cleanup`

## Branch

`wave/stage5a-pages-socket-channels-members-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the first proven-unused legacy `pages/api/socket/*` route-family group after Segment 044 inventory.

This slice targets the old `channels` and `members` socket-compatibility HTTP routes only.

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

- verify no active callers remain for:
  - `src/pages/api/socket/channels/index.ts`
  - `src/pages/api/socket/channels/[channelId].ts`
  - `src/pages/api/socket/members/[memberId].ts`
- remove the routes only if code search still proves they are unused
- update docs with the removed route-family group and remaining blockers

### Out of Scope

- removing all `pages/api/socket/*`
- removing `messages` / `direct-messages` socket compatibility routes
- removing `servers/invite` or `servers/[serverId]/leave`
- changing backend channel/member behavior
- changing SDK channel/member mutations
- changing realtime event behavior
- auth, storage, media, or database migration work

## Expected Work

### 1. Re-verify inventory

Before deletion, run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/socket/channels`
- `/api/socket/members`
- route file imports
- dynamic URL builders that could still target these routes

### 2. Remove only proven-unused routes

If no active callers exist, delete:
- `src/pages/api/socket/channels/index.ts`
- `src/pages/api/socket/channels/[channelId].ts`
- `src/pages/api/socket/members/[memberId].ts`

Do not delete adjacent server/message/direct-message routes in this slice.

### 3. Keep active domain paths intact

Current channel/member flows should continue through:
- `packages/sdk/src/mutations/channel.ts`
- `packages/sdk/src/mutations/membership.ts`
- backend-owned `apps/api` routes
- remaining `src/app/api/*` compatibility where still used by fallback mode

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` API fallback is transitional compatibility. This slice removes only legacy `pages/api/socket/*` routes with no active callers.

## Acceptance Criteria

- targeted `channels` and `members` legacy socket routes are removed only after code search confirms no active callers
- channel create/edit/delete still typecheck through SDK/backend paths
- member role/kick flows still typecheck through SDK/backend paths
- no unrelated proxy routes are removed
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no remaining `/api/socket/channels` or `/api/socket/members` callers
- runtime sanity if available:
  - create channel
  - edit channel
  - delete channel
  - update member role
  - kick member

## Handoff Format

- removed routes
- code-search proof
- verification performed
- any remaining legacy `pages/api/socket/*` routes
- next recommended route-family cleanup
