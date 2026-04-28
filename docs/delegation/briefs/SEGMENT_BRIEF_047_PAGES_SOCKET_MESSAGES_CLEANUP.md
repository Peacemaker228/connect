# Segment Brief 047: Pages Socket Messages Cleanup

## Segment ID

`pages-socket-messages-cleanup`

## Branch

`wave/stage5a-pages-socket-messages-cleanup`

## Goal

Continue `Wave 26 / Stage 5A` by cleaning the remaining legacy `pages/api/socket/messages/*` and `pages/api/socket/direct-messages/*` HTTP compatibility routes.

This slice should remove the old socket-shaped message HTTP routes only after confirming that chat reads/writes now use domain API paths through the SDK.

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
  - `/api/socket/messages`
  - `/api/socket/direct-messages`
- remove legacy socket-path normalization from SDK message/chat helpers if it is no longer needed
- remove these routes only after code search proves no active callers remain:
  - `src/pages/api/socket/messages/index.ts`
  - `src/pages/api/socket/messages/[messageId].ts`
  - `src/pages/api/socket/direct-messages/index.ts`
  - `src/pages/api/socket/direct-messages/[directMessageId].ts`
- update docs concisely with what was removed and what remains

### Out of Scope

- removing `src/app/api/messages/route.ts`
- removing `src/app/api/direct-messages/route.ts`
- changing backend message/direct-message behavior
- changing realtime event behavior
- changing chat pagination/cache semantics
- auth, storage, media, or database migration work

## Expected Work

### 1. Re-verify route usage

Run targeted code search across:
- `src`
- `packages`
- `apps`

Check for:
- `/api/socket/messages`
- `/api/socket/direct-messages`
- `socketUrl`
- `socketQuery`
- dynamic URL builders that could still target these routes

### 2. Clean SDK legacy socket-path support if safe

Inspect:
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/queries/chat.ts`

If active callers now pass only domain API paths (`/api/messages`, `/api/direct-messages`), remove obsolete socket-path normalization for:
- `/api/socket/messages`
- `/api/socket/direct-messages`

Do not change request payloads, query params, cache keys, pagination, or realtime behavior.

### 3. Remove proven-unused routes

If no active callers remain, delete:
- `src/pages/api/socket/messages/index.ts`
- `src/pages/api/socket/messages/[messageId].ts`
- `src/pages/api/socket/direct-messages/index.ts`
- `src/pages/api/socket/direct-messages/[directMessageId].ts`

### 4. Keep active domain paths intact

Message and direct-message flows should continue through:
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/queries/chat.ts`
- backend-owned `/api/messages`
- backend-owned `/api/direct-messages`
- remaining `src/app/api/messages` and `src/app/api/direct-messages` compatibility where still applicable

### 5. Update docs

Update:
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/roadmap/STAGE_STATUS.md`

Only add concise status updates. Do not duplicate the full inventory again.

## Runtime Assumption

`direct backend mode` is the active target runtime for `Stage 5A`.

Same-origin `Next` API fallback is transitional compatibility. This slice removes legacy message socket HTTP routes after chat runtime has been normalized to domain API paths.

## Acceptance Criteria

- no active `/api/socket/messages` or `/api/socket/direct-messages` callers remain outside docs/history
- SDK message/chat helpers no longer preserve obsolete socket-path normalization if no active caller needs it
- legacy message/direct-message socket routes are removed only after caller search proves they are unused
- active chat read/write flows still typecheck through domain API paths
- no unrelated proxy routes are removed
- docs are updated concisely

## Verification

- typecheck
- lint changed files where applicable
- targeted code search proving no active `/api/socket/messages` or `/api/socket/direct-messages` callers
- runtime sanity if available:
  - channel message read/create/edit/delete
  - direct message read/create/edit/delete
  - message file upload
  - realtime message updates

## Handoff Format

- removed routes
- SDK cleanup performed, if any
- code-search proof
- verification performed
- any remaining legacy `pages/api/socket/*` routes
- next recommended cleanup slice
