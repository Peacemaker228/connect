# Segment Brief 041: Web Runtime Storage Action Extraction

## Segment ID

`web-runtime-storage-action-extraction`

## Branch

`wave/stage5a-web-runtime-storage-action-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving browser storage runtime actions away from direct same-origin `Next` proxy fetches and toward shared backend-aware SDK/API wrappers.

This is runtime extraction work, not a new storage architecture wave.

## Scope

### In Scope

- upload action used by `FileUpload`
- delete/cleanup action used by staged upload helpers
- shared storage API helpers in `packages/sdk`
- replacing direct feature-level `fetch('/api/server-upload')` calls where the backend-aware SDK can own them

### Out of Scope

- storage redesign
- changing storage provider
- changing public/backend-redirect access policy
- removing all storage `app/api` proxy routes in one step
- auth/media/postgres work

## Expected Work

### 1. Extract storage action ownership

Move upload and delete request ownership into shared backend-aware SDK/API helpers.

### 2. Preserve current storage behavior

Keep staged upload lifecycle, cleanup behavior, serialized upload values, and current backend-owned storage path stable.

### 3. Keep this as runtime extraction

Do not reopen `Stage 5` storage architecture decisions.

## Acceptance Criteria

- targeted storage runtime actions no longer own direct same-origin `fetch('/api/server-upload')` calls in feature utilities/components
- direct backend mode works through the shared backend-aware request layer
- existing upload/delete/staged cleanup behavior remains stable

## Verification

- typecheck
- lint
- targeted runtime sanity for server image upload, message file upload, staged cleanup, and file delete

## Handoff Format

- what storage runtime actions were moved
- what storage proxy routes still remain
- what the next narrow extraction slice should be
