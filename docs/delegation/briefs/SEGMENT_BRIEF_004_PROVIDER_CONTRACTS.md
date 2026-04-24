# Segment Brief 004: Provider Contracts

## Segment

`provider-contracts-seed`

## Recommended Branch Name

`wave/first-migration-provider-contracts`

## Goal

Закрыть оставшийся архитектурный хвост `Stage 1` без перехода к `Nest` и без runtime rewrite.

Задача сегмента:
- зафиксировать contracts/interfaces для:
  - `AuthProvider`
  - `StorageProvider`
  - `MediaProvider`
  - `RealtimeProvider`
- положить их в `packages/app-core`
- не внедрять полную реализацию
- не менять production behavior

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [FIRST_MIGRATION.md](../../waves/FIRST_MIGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Создать contracts в `packages/app-core`

Ожидаемое направление:

```text
packages/
  app-core/
    src/
      contracts/
        auth-provider.ts
        storage-provider.ts
        media-provider.ts
        realtime-provider.ts
```

### 2. Зафиксировать минимальные интерфейсы

Нужно определить:
- какие операции должен уметь auth boundary
- какие операции должен уметь storage boundary
- какие операции должен уметь media boundary
- какие операции должен уметь realtime boundary

Интерфейсы должны быть:
- минимальными
- понятными
- без лишней детализации под конкретный vendor

### 3. Добавить безопасные re-export entrypoints при необходимости

Если для читабельности нужен общий export-слой внутри `packages/app-core`, это допустимо.

## Out of Scope

Запрещено включать в сегмент:
- реальные реализации провайдеров
- внедрение `Clerk`, `UploadThing`, `LiveKit`, `Socket.IO` adapters
- перенос `apps/api`
- `Nest` bootstrap
- изменение `src/app/*`
- изменение `src/pages/api/*`
- изменение `src/middleware.ts`
- изменение `electron/*`
- массовую замену импортов по проекту

## Constraints

- не ломать текущий runtime
- не подменять contracts реальными integration-layer решениями
- не расширять scope до `Stage 2`
- не проектировать “идеальный на 2 года вперёд” overly large API

## Expected Deliverable

По завершении сегмента должно быть:
- создано 4 provider contracts файла
- contracts лежат в `packages/app-core`
- названия и shape согласованы с [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- `Stage 1` становится заблокирован только не на docs, а на реальном adapter/contracts слое

## Acceptance Criteria

- есть `AuthProvider`
- есть `StorageProvider`
- есть `MediaProvider`
- есть `RealtimeProvider`
- contracts не завязаны на конкретный vendor
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не запускался

## Validation

Минимум:
- `tsc --noEmit -p tsconfig.json`
- `eslint` по затронутым файлам, если доступен

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- какие contracts добавлены
- почему их shape выбран именно так

### Changed Files

Плоский список файлов

### What Changed

По каждому важному файлу:
- что добавлено
- почему

### Validation

- что проверено
- что не проверено

### Risks

- какие интерфейсы пока intentionally minimal
- что ещё предстоит добрать на этапе реальных adapters

### Recommended Next Segment

Следующий логичный сегмент после этого:
- либо thin adapters поверх текущих vendors
- либо `Stage 2` / `Nest skeleton`, если contracts признаны достаточными
