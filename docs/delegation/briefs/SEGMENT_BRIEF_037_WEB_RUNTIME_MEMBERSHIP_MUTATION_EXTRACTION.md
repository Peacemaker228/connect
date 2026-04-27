# Segment Brief 037: Web Runtime Membership Mutation Extraction

## Segment ID

`web-runtime-membership-mutation-extraction`

## Branch

`wave/stage5a-web-runtime-membership-mutation-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the next practical server-membership mutation bundle away from raw same-origin `Next` proxy calls and into shared backend-aware SDK mutations.

## Scope

### In Scope

- member role-change / kick mutations
- leave-server mutation
- shared mutation hooks in `packages/sdk`
- the membership-related modal/component callers that currently own those raw transport calls
- cache/update handling that naturally belongs to this same server-membership runtime bundle

### Out of Scope

- broad rewrite of all feature components
- removing every `src/app/api/*` or `src/pages/api/*` route in one step
- auth/storage/media/postgres work

## Expected Work

### 1. Extract server-membership mutation ownership

Move member-management and leave-server mutation paths into shared SDK ownership as one practical runtime bundle.

### 2. Replace raw feature transport calls

Membership-related feature components should stop owning direct same-origin proxy calls where the SDK can own them instead.

### 3. Keep the runtime stable

Do not widen the step into a large feature/UI rewrite.

## Acceptance Criteria

- membership/server-membership mutation paths no longer depend on direct raw same-origin proxy calls in the targeted bundle
- shared SDK ownership increases
- active runtime behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for member role-change, kick, and leave-server flows

## Handoff Format

- what server-membership mutation paths were moved
- what still remains on the old proxy path
- what the next narrow extraction slice should be
