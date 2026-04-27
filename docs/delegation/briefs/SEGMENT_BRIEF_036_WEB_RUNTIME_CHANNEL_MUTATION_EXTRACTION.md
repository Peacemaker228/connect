# Segment Brief 036: Web Runtime Channel Mutation Extraction

## Segment ID

`web-runtime-channel-mutation-extraction`

## Branch

`wave/stage5a-web-runtime-channel-mutation-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the next narrow channel-focused mutation slice away from raw same-origin `Next` proxy calls and into shared backend-aware SDK mutations.

## Scope

### In Scope

- shared channel mutation hooks in `packages/sdk`
- create/edit/delete channel runtime paths
- reducing direct raw `axios` calls from channel modals/components

### Out of Scope

- broad rewrite of all feature components
- removing every `src/app/api/*` or `src/pages/api/*` route in one step
- auth/storage/media/postgres work

## Expected Work

### 1. Extract channel mutation ownership

Move channel create/edit/delete mutations into shared SDK ownership.

### 2. Replace raw feature transport calls

Channel-facing feature components should stop owning direct same-origin transport calls where the SDK can own them instead.

### 3. Keep the runtime stable

Do not widen the step into a large feature/UI rewrite.

## Acceptance Criteria

- channel mutation paths no longer depend on direct raw same-origin proxy calls in the targeted feature components
- shared SDK ownership increases
- active runtime behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for create/edit/delete channel flows

## Handoff Format

- what channel mutation paths were moved
- what still remains on the old proxy path
- what the next narrow extraction slice should be
