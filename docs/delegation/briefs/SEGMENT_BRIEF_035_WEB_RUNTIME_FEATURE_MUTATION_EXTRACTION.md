# Segment Brief 035: Web Runtime Feature Mutation Extraction

## Segment ID

`web-runtime-feature-mutation-extraction`

## Branch

`wave/stage5a-web-runtime-feature-mutation-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the next narrow set of feature-facing mutations away from implicit same-origin `Next` API ownership and toward shared backend-aware SDK mutations.

## Scope

### In Scope

- create or extend shared mutation hooks in `packages/sdk`
- migrate a narrow set of feature mutations that still call `Next` proxy/API paths directly
- reduce direct raw `axios` mutation calls from feature modals/components where a shared SDK mutation can own them

### Out of Scope

- broad rewrite of all feature components
- removing every `src/app/api/*` or `src/pages/api/*` route in one step
- auth/storage/media/postgres work

## Expected Work

### 1. Extract another narrow shared mutation slice

Move the next reviewable group of feature mutations onto shared SDK hooks.

### 2. Prefer reuse over scattered transport calls

Centralize transport ownership in `packages/sdk` instead of leaving raw same-origin calls inside feature components.

### 3. Keep current runtime stable

Do not widen the segment into a large feature/UI rewrite.

## Acceptance Criteria

- another narrow group of feature mutations no longer depends on implicit same-origin proxy assumptions
- shared SDK ownership increases
- active runtime behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for the migrated mutation paths

## Handoff Format

- what mutation paths were moved into shared SDK ownership
- what still remains on the old proxy path
- what the next narrow extraction slice should be
