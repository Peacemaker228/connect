# Segment Brief 043: Web Runtime Chat Contract Normalization

## Segment ID

`web-runtime-chat-contract-normalization`

## Branch

`wave/stage5a-web-runtime-chat-contract-normalization`

## Goal

Continue `Wave 26 / Stage 5A` by tightening the remaining chat runtime contract after chat reads and message mutations have moved under shared SDK ownership.

This is preparation for proxy-route cleanup. It is not a realtime rewrite.

## Required Reading

- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- this brief

## Scope

### In Scope

- page-level chat props that still pass mixed `apiUrl` / `socketUrl` values
- chat components that still treat `/api/socket/*` as a mutation/API contract
- SDK message/chat helpers and their path normalization, only where the runtime contract can be clarified safely
- keeping direct backend mode and legacy fallback mode both working

### Out of Scope

- deleting all `src/app/api/*` or `src/pages/api/*` routes
- redesigning Socket.IO/realtime behavior
- changing message/domain behavior
- auth, storage, media, or database migration work

## Expected Work

### 1. Inspect the current chat runtime contract

Review:
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- chat input/item/query components that consume `apiUrl` and `socketUrl`
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/queries/chat.ts`

### 2. Separate API paths from realtime paths

Where safe, make the code distinguish:
- domain API read/write paths such as `/api/messages` and `/api/direct-messages`
- realtime/socket paths used only for socket transport concerns

Avoid using `/api/socket/*` as the general mutation API contract unless it is still required for legacy fallback.

### 3. Preserve compatibility

Do not remove fallback behavior in the same slice unless it is proven unused and covered by checks.

## Acceptance Criteria

- chat pages/components expose a clearer API-vs-realtime contract
- message read/write paths continue to work in direct backend mode
- legacy fallback still works where the project still depends on it
- no broad proxy-route deletion is introduced

## Verification

- typecheck
- lint changed files
- targeted runtime sanity for channel messages and direct messages

## Handoff Format

- what chat runtime contract was normalized
- what `/api/socket/*` usage still remains and why
- whether the next slice can start proxy-route inventory/cleanup
