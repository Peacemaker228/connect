# Segment Brief 048: App API Channels/Members Cleanup

## Segment ID

`app-api-channels-members-cleanup`

## Branch

`wave/stage5a-app-api-channels-members-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the first narrow `src/app/api/*` compatibility route-family group after `pages/api/socket/*` cleanup.

This slice targets only `channels` and `members` app-router proxy routes whose active client flows already go through backend-aware SDK mutations.

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
  - `src/app/api/channels/route.ts`
  - `src/app/api/channels/[channelId]/route.ts`
  - `src/app/api/members/[memberId]/route.ts`
  - `src/app/api/members/[memberId]/services/*`
  - `src/app/api/utils.ts`
- remove these routes/helpers only if direct backend mode and SDK ownership cover the active flows
- update docs concisely with what was removed and what remains

### Out of Scope

- removing all `src/app/api/*`
- removing `src/app/api/servers/*`
- removing `src/app/api/messages` or `src/app/api/direct-messages`
- removing auth routes
- removing storage routes, especially `src/app/api/storage/access/route.ts`
- removing `server-upload` or `livekit`
- changing backend channel/member behavior
- changing SDK channel/member mutation contracts unless a tiny cleanup is required

## Expected Work

### 1. Re-verify usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/channels`
- `/api/members`
- imports from `@/app/api/utils`
- imports from `src/app/api/members/[memberId]/services/*`
- any direct fetch/axios calls that would still require same-origin `src/app/api` fallback

### 2. Confirm active SDK/backend paths

Active channel/member flows should go through:
- `packages/sdk/src/mutations/channel.ts`
- `packages/sdk/src/mutations/membership.ts`
- backend-owned `/api/channels`
- backend-owned `/api/members/:memberId`

`direct backend mode` is the active runtime assumption. Same-origin `src/app/api` fallback is no longer required for these newly cleaned routes.

### 3. Remove proven-unused app API routes

If verification confirms active flows are covered, delete:
- `src/app/api/channels/route.ts`
- `src/app/api/channels/[channelId]/route.ts`
- `src/app/api/members/[memberId]/route.ts`
- `src/app/api/members/[memberId]/services/patchMember.ts`
- `src/app/api/members/[memberId]/services/deleteMember.ts`
- `src/app/api/members/[memberId]/services/utils.ts`

Delete `src/app/api/utils.ts` only if no remaining callers exist after channel/member route removal.

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` app API routes are transitional compatibility and can be removed route-family by route-family when SDK/backend ownership covers the active product flow.

## Acceptance Criteria

- channel/member app API proxy routes are removed only after caller search and SDK/backend coverage are verified
- no active code imports removed helper files
- channel create/edit/delete still typecheck through SDK/backend paths
- member role/kick flows still typecheck through SDK/backend paths
- no unrelated app API routes are removed
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no active `src/app/api/channels` or `src/app/api/members` route dependency remains
- runtime sanity if available:
  - create channel
  - edit channel
  - delete channel
  - update member role
  - kick member

## Handoff Format

- removed routes/helpers
- code-search proof
- verification performed
- remaining `src/app/api/*` compatibility routes
- next recommended route-family cleanup
