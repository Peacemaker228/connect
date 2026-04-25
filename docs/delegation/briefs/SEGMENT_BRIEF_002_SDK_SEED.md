# Segment Brief 002: SDK Seed Extraction

## Segment

`sdk-seed-extraction`

## Goal

Сделать первый безопасный шаг к `packages/sdk`, но не превращать сегмент в общий рефактор client data-access.

Задача сегмента:
- создать первый usable слой в `packages/sdk`
- вынести туда **простые client-access hooks**, которые не завязаны на:
  - `Next router`
  - `Electron`
  - socket side-effects
  - сложную cache invalidation orchestration
- не ломать текущий runtime

## Prerequisite

Этот сегмент должен выполняться **после** `SEGMENT_BRIEF_001_APP_CORE_SEED.md` или при эквивалентно подготовленном baseline.

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [Wave 1 - FIRST_MIGRATION.md](../../waves/FIRST_MIGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)
- [SEGMENT_BRIEF_001_APP_CORE_SEED.md](./SEGMENT_BRIEF_001_APP_CORE_SEED.md)

## In Scope

### 1. Создать первый usable слой в `packages/sdk/src`

Нужно вынести только следующие источники:
- `src/lib/shared/data-access/server/api.ts`
- `src/lib/shared/data-access/server/api-socket.ts`
- `src/lib/shared/data-access/user/api.ts`

### 2. Подготовить alias для `packages/sdk`

Ожидаемое направление:
- `@sdk/*` -> `packages/sdk/src/*`

### 3. Переключить существующих потребителей на новый импорт

Но только тех, кто зависит от вынесенных сущностей.

## Out of Scope

Запрещено включать в сегмент:
- `src/lib/shared/data-access/chat/use-chat-query.ts`
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
- `src/lib/shared/data-access/navigation-sidebar/use-sidebar-socket.ts`
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`
- любые hooks, завязанные на `useSocket`
- любые hooks, завязанные на `useRouter`
- любые hooks, завязанные на toast orchestration
- любые backend changes
- любые API contract changes
- любые runtime entrypoints

## Why These Constraints Exist

Этот сегмент должен быть безопасным и предсказуемым.

Мы **не** берём chat/socket/sidebar hooks, потому что они:
- сильнее завязаны на текущий runtime
- завязаны на socket provider
- завязаны на локальную cache orchestration
- повышают риск разрастания scope

Во второй сегмент должны попасть только простые и понятные client-access hooks.

## Files to Inspect First

- `tsconfig.json`
- `src/lib/shared/data-access/server/api.ts`
- `src/lib/shared/data-access/server/api-socket.ts`
- `src/lib/shared/data-access/user/api.ts`

Их текущих потребителей тоже нужно найти до изменений.

## Expected Target Structure

Ожидаемая структура после выполнения сегмента:

```text
packages/
  sdk/
    src/
      queries/
        server.ts
        profile.ts
      mutations/
        invite.ts
```

Допустимы небольшие корректировки нейминга, если они последовательны и улучшают читаемость.

## Constraints

- не ломать текущий runtime
- не менять поведение запросов
- не менять API endpoints
- не менять cache semantics без явной необходимости
- не расширять scope

## Implementation Notes

### 1. Minimal Refactor Only

Не нужно переписывать hooks в новый большой abstraction layer.

Нужно сделать только минимальный перенос в новый shared location.

### 2. Keep Behavior Stable

Нужно сохранить:
- `queryKey`
- `retry`
- `enabled`
- shape return value
- shape mutation result

### 3. Naming

Если нейминг меняется, он должен становиться более явным.

Например:
- `api.ts` -> `queries/server.ts`
- `api-socket.ts` -> `mutations/invite.ts`
- `user/api.ts` -> `queries/profile.ts`

Но только если это не раздувает diff без пользы.

## Expected Deliverable

По завершении сегмента должно быть:
- создано первое рабочее наполнение `packages/sdk/src`
- добавлен alias для `@sdk/*`
- текущие потребители переключены на новый источник
- пользовательское поведение не изменилось

## Acceptance Criteria

- вынесены только файлы из scope
- socket-heavy hooks не тронуты
- router-coupled hooks не тронуты
- imports обновлены корректно
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не был запущен

## Validation

Минимум:
- `tsc --noEmit -p tsconfig.json`
- `eslint` по затронутым файлам, если доступен

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- что именно вынесено
- почему этот scope был безопасным

### Changed Files

Плоский список файлов

### What Changed

По каждому важному файлу:
- что изменено
- почему

### Validation

- что проверено
- что не проверено

### Deferred Items

Отдельным списком:
- какие hooks не были перенесены
- почему они сознательно оставлены на следующий сегмент

### Recommended Next Segment

Исполнитель должен предложить следующий логичный сегмент после этого PR.
