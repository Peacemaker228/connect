# Segment Brief 042: Web Runtime Media Token Extraction

## Segment ID

`web-runtime-media-token-extraction`

## Branch

`wave/stage5a-web-runtime-media-token-extraction`

## Goal

Continue `Wave 26 / Stage 5A` by moving the browser media-token runtime action away from direct same-origin `Next` API fetches and toward backend-owned/API-layer ownership.

This is runtime API extraction work, not a media stack rewrite.

## Scope

### In Scope

- LiveKit token request currently owned by `src/app/api/livekit`
- backend/API ownership for issuing the current LiveKit token
- shared media API helper in `packages/sdk` if useful
- replacing direct `fetch('/api/livekit?...')` from `MediaRoom`

### Out of Scope

- replacing LiveKit
- changing SFU/media architecture
- changing room/participant product behavior
- auth/storage/postgres work

## Expected Work

### 1. Extract media token request ownership

Move the current LiveKit token request path toward backend/API ownership and shared client access.

### 2. Preserve current media behavior

Keep current LiveKit room connection behavior, token shape, device handling, and error handling stable.

### 3. Keep this as runtime extraction

Do not turn this into the future media rewrite.

## Acceptance Criteria

- `MediaRoom` no longer owns direct same-origin `fetch('/api/livekit')`
- current LiveKit token acquisition still works
- no media architecture rewrite is introduced

## Verification

- typecheck
- lint
- targeted runtime sanity for joining a voice/video room

## Handoff Format

- what media-token runtime path was moved
- what `Next` media proxy route still remains, if any
- what the next narrow extraction slice should be
