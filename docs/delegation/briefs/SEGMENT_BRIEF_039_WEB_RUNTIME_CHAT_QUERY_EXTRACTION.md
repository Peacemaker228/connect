# Segment Brief 039: Web Runtime Chat Query Extraction

## Segment ID

`web-runtime-chat-query-extraction`

## Branch

`wave/stage5a-web-runtime-chat-query-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the next practical chat-read query bundle away from raw same-origin `fetch` assumptions and toward backend-aware SDK/query ownership.

## Scope

### In Scope

- `useChatQuery` and its message/direct-message read paths
- shared query helpers in `packages/sdk` if needed
- preserving the existing page-level chat runtime contract while reducing raw transport ownership

### Out of Scope

- full chat transport rewrite
- replacing every `apiUrl` / `socketUrl` prop in one step
- realtime/socket redesign
- auth/storage/media/postgres work

## Expected Work

### 1. Extract chat read ownership

Move the message/direct-message read path used by `useChatQuery` toward shared backend-aware request handling.

### 2. Preserve runtime behavior

Do not break infinite scrolling, cursor behavior, fallback polling, or realtime refresh behavior.

### 3. Keep the segment bounded

This is a chat-read query step, not a full chat runtime rewrite.

## Acceptance Criteria

- targeted chat read path no longer owns raw same-origin `fetch` assumptions directly
- direct backend mode keeps working through the shared backend-aware request layer
- existing chat pagination/realtime behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for channel messages and direct messages list loading

## Handoff Format

- what chat read/query paths were moved
- what still remains on the old proxy/runtime path
- what the next narrow extraction slice should be
