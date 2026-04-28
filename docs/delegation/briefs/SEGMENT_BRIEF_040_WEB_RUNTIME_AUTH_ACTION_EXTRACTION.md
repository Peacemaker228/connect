# Segment Brief 040: Web Runtime Auth Action Extraction

## Segment ID

`web-runtime-auth-action-extraction`

## Branch

`wave/stage5a-web-runtime-auth-action-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving browser auth runtime actions away from direct same-origin `Next` proxy fetches and toward shared backend-aware SDK/API wrappers.

This is runtime extraction work, not a new auth architecture wave.

## Scope

### In Scope

- login/register browser action wrappers
- logout browser action wrapper
- shared auth API helpers in `packages/sdk`
- replacing direct feature-level `fetch('/api/auth/...')` calls where the backend-aware SDK can own them

### Out of Scope

- auth redesign
- new auth product-completeness features such as email verification or password reset
- deleting all auth `app/api` proxy routes in one step
- storage/media/postgres work

## Expected Work

### 1. Extract auth action ownership

Move login/register/logout request ownership into shared backend-aware SDK/API helpers.

### 2. Preserve current browser behavior

Keep cookie-session behavior, redirects, error handling, and logout hard redirect behavior stable.

### 3. Keep this as runtime extraction

Do not reopen `Stage 4` auth architecture decisions.

## Acceptance Criteria

- targeted auth runtime actions no longer own direct same-origin `fetch` calls in feature components
- direct backend mode works through the shared backend-aware request layer
- existing login/register/logout behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for login, register, and logout flows

## Handoff Format

- what auth runtime actions were moved
- what auth proxy routes still remain
- what the next narrow extraction slice should be
