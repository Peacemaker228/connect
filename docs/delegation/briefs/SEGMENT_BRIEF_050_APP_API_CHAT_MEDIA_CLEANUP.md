# Segment Brief 050: App API Chat/Media Cleanup

## Segment ID

`app-api-chat-media-cleanup`

## Branch

`wave/stage5a-app-api-chat-media-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by removing the next small group of `src/app/api/*` compatibility routes:
- chat read routes: `messages` and `direct-messages`
- media token fallback route: `livekit`

This can be one PR, preferably with separate commits for chat routes and media route cleanup.

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
  - `src/app/api/messages/route.ts`
  - `src/app/api/direct-messages/route.ts`
  - `src/app/api/livekit/route.ts`
- remove chat read app-router proxy routes if direct backend mode covers chat reads
- move media token SDK action off `/api/livekit` fallback and onto `/api/media/livekit-token`
- remove `src/app/api/livekit/route.ts` after fallback removal and caller search
- update docs concisely with what was removed and what remains

### Out of Scope

- removing all `src/app/api/*`
- removing auth routes
- removing profile/user routes
- removing storage routes
- removing `server-upload`
- changing backend message/direct-message behavior
- changing chat pagination/cache/realtime behavior
- changing LiveKit/media architecture
- `Postgres` or broader media rewrite work

## Expected Work

### 1. Re-verify chat route usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/messages`
- `/api/direct-messages`
- direct `fetch` calls
- direct axios calls outside SDK
- chat page props and chat SDK helpers

Chat reads/writes should continue through:
- `packages/sdk/src/queries/chat.ts`
- `packages/sdk/src/mutations/message.ts`
- backend-owned `/api/messages`
- backend-owned `/api/direct-messages`

`direct backend mode` is the active runtime assumption. Same-origin `src/app/api/messages` and `src/app/api/direct-messages` fallback is no longer required once verified.

### 2. Re-verify media route usage

Inspect:
- `packages/sdk/src/actions/media.ts`
- `src/lib/shared/features/media-room.tsx`
- backend media route in `apps/api`

Move media token SDK action away from `/api/livekit` fallback so it always uses `/api/media/livekit-token` through the backend-aware client.

### 3. Remove proven-unused app API routes

If verification confirms active flows are covered, delete:
- `src/app/api/messages/route.ts`
- `src/app/api/direct-messages/route.ts`
- `src/app/api/livekit/route.ts`

Do not remove unrelated routes in this slice.

### 4. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` app API routes are transitional compatibility and can be removed route-family by route-family when SDK/backend ownership covers the active product flow.

## Suggested Commit Split

Commit 1:
- remove `messages` and `direct-messages` app-router proxy routes after verification

Commit 2:
- remove `/api/livekit` fallback from SDK media action
- delete `src/app/api/livekit/route.ts`
- update docs

## Acceptance Criteria

- chat read/write flows still typecheck through SDK/backend paths
- media token acquisition still typecheck through SDK/backend path
- no active `/api/livekit` fallback reference remains outside docs/history
- no unrelated app API routes are removed
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no active dependency on deleted app API routes
- runtime sanity if available:
  - channel message read/create/edit/delete
  - direct message read/create/edit/delete
  - LiveKit token request / joining a media room

## Handoff Format

- removed routes
- SDK cleanup performed
- code-search proof
- verification performed
- remaining `src/app/api/*` compatibility routes
- next recommended route-family cleanup
