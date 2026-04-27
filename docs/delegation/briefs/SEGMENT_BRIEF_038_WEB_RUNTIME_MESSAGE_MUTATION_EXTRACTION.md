# Segment Brief 038: Web Runtime Message Mutation Extraction

## Segment ID

`web-runtime-message-mutation-extraction`

## Branch

`wave/stage5a-web-runtime-message-mutation-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the next practical message-related mutation bundle away from raw same-origin `Next` proxy calls and into shared backend-aware SDK mutations.

## Scope

### In Scope

- message-related modal mutation paths
- direct-message / channel-message write/delete mutation ownership where the current targeted UI still uses raw transport calls
- shared mutation hooks in `packages/sdk`

### Out of Scope

- full chat transport rewrite
- full page-level replacement of all `apiUrl` / `socketUrl` props in one step
- auth/storage/media/postgres work

## Expected Work

### 1. Extract message mutation ownership

Move the next narrow set of message-related write/delete paths into shared SDK ownership.

### 2. Replace raw feature transport calls

Targeted message-related feature components should stop owning direct same-origin proxy calls where the SDK can own them instead.

### 3. Keep the runtime stable

Do not widen the step into a full chat runtime rewrite.

## Acceptance Criteria

- targeted message-related mutation paths no longer depend on direct raw same-origin proxy calls
- shared SDK ownership increases
- active runtime behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for the migrated message-related mutation flows

## Handoff Format

- what message-related mutation paths were moved
- what still remains on the old proxy path
- what the next narrow extraction slice should be
