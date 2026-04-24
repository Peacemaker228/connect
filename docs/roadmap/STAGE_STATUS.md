# Stage Status

## Current Read Model

- `PLATFORM_MIGRATION_PLAN.md` = master plan
- `waves/*.md` = completed/current waves by stage
- `SEGMENT_BRIEF_*` = конкретные PR внутри волны

## Status by Stage

### Stage 0. Architecture Freeze

Status: `done`

Done:
- есть master migration plan
- зафиксирована repo strategy
- зафиксирована target architecture
- зафиксирована wave/segment delegation model

Remaining:
- none

### Stage 1. Internal Decoupling

Status: `done`

Done:
- `packages/app-core` seed extraction
- `packages/sdk` seed extraction
- `packages/ui` seed extraction
- `@app-core/*`, `@sdk/*`, `@ui/*`
- shim/re-export слой в старых путях
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

Remaining:
- finish transitional cleanup for the same slice
- invites
- servers
- channels
- members
- messages
- direct messages
- socket transport
 
## Next Correct Step

Следующий большой шаг не `domain extraction`, а:

1. завершить первый Stage 3 slice или его realtime tail
2. только потом расширять Stage 3 дальше
3. не смешивать это с auth/storage/media/database migrations
