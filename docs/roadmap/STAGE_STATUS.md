# Stage Status

## Current Read Model

- `PLATFORM_MIGRATION_PLAN.md` = master plan
- `FIRST_MIGRATION.md` = текущая волна внутри `Stage 1`
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

Status: `in progress`

Done:
- `packages/app-core` seed extraction
- `packages/sdk` seed extraction
- `packages/ui` seed extraction
- `@app-core/*`, `@sdk/*`, `@ui/*`
- shim/re-export слой в старых путях

Remaining:
- `AuthProvider` contract
- `StorageProvider` contract
- `MediaProvider` contract
- `RealtimeProvider` contract
- contracts/adapters слой поверх уже зафиксированных boundaries

### Stage 2. Nest Foundation

Status: `not started`

Planned:
- `apps/api`
- `Nest` skeleton
- config/logger/health
- base module scaffold

### Stage 3. Domain and Realtime Extraction

Status: `not started`

Planned:
- invites
- servers
- channels
- members
- messages
- direct messages
- socket transport

## Exact Stage 1 Done Definition

`Stage 1` считается закрытым только когда:

- [x] создан `packages/app-core` seed layer
- [x] создан `packages/sdk` seed layer
- [x] создан `packages/ui` seed layer
- [x] добавлены `@app-core/*`, `@sdk/*`, `@ui/*`
- [x] старые пути работают через shim/re-export слой
- [x] есть `ARCHITECTURE.md`
- [x] есть `BOUNDARIES.md`
- [ ] есть `AuthProvider`, `StorageProvider`, `MediaProvider`, `RealtimeProvider` contracts

## Next Correct Step

Следующий большой шаг не `domain extraction`, а:

1. закрыть хвост `Stage 1`
2. поднять `Stage 2` — `apps/api` и `Nest skeleton`
3. только потом идти в `Stage 3`
