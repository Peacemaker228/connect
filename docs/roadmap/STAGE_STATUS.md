# Stage Status

## Current Read Model

- `PLATFORM_MIGRATION_PLAN.md` = master plan
- `waves/*.md` = completed/current waves by stage
- `SEGMENT_BRIEF_*` = concrete PR slices inside a wave

## Status by Stage

### Stage 0. Architecture Freeze

Status: `done`

Done:
- master migration plan exists
- repo strategy is fixed
- target architecture is fixed
- wave/segment delegation model is fixed

Remaining:
- none

### Stage 1. Internal Decoupling

Status: `done`

Done:
- `packages/app-core` seed extraction
- `packages/sdk` seed extraction
- `packages/ui` seed extraction
- `@app-core/*`, `@sdk/*`, `@ui/*`
- shim/re-export layer in old paths
- `AuthProvider` contract
- `StorageProvider` contract
- `MediaProvider` contract
- `RealtimeProvider` contract

Remaining:
- none at contract-definition level

### Stage 2. Nest Foundation

Status: `done`

Done:
- `apps/api`
- `Nest` skeleton
- config/logger/health
- base module scaffold
- realtime scaffold

Remaining:
- none at foundation level

### Stage 3. Domain and Realtime Extraction

Status: `in progress`

Done:
- first backend-owned slice moved to `apps/api`: invites/servers/channels/members
- `src/app/api/*` for this slice converted to compatibility/proxy layer
- `src/pages/api/socket/*` for this slice reduced to transitional auth/proxy/socket emit layer
- transitional cleanup for the same slice completed
- proxy response handling in legacy `pages/api/socket/*` aligned through a shared helper
- remaining channel validation removed from legacy socket layer so ownership stays in `apps/api`

Remaining:
- realtime extraction for the same slice
- complete Stage 3 for invites/servers/channels/members beyond the transitional Socket.IO tail
- messages
- direct messages
- socket transport

## Next Correct Step

The next big step inside `Stage 3` is:

1. do realtime extraction for the first Stage 3 slice
2. only after that expand Stage 3 further
3. do not mix this with auth/storage/media/database migrations
