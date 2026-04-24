# Segment Brief 001: App Core Seed Extraction

## Segment

`app-core-seed-extraction`

## Goal

Сделать первый реальный шаг к `packages/app-core`, но только через перенос **чистого, runtime-agnostic кода**, который:
- не зависит от `db`
- не зависит от `Next runtime`
- не зависит от `Electron`
- не тянет за собой крупный архитектурный след

Результат сегмента должен:
- создать первый полезный слой в `packages/app-core`
- не сломать текущий runtime
- не запустить преждевременно большую миграцию

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](./PLATFORM_MIGRATION_PLAN.md)
- [FIRST_MIGRATION_PR.md](./FIRST_MIGRATION_PR.md)
- [DELEGATION_AGENT_GUIDE.md](./DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Добавить первый usable код в `packages/app-core/src`

Нужно перенести только следующие файлы или их содержимое:
- `src/lib/shared/utils/routes.ts`
- `src/lib/shared/utils/upload-file.ts`
- `src/lib/shared/utils/get-profile-name.ts`
- `src/lib/shared/data-access/server/models/serverModalSchema.ts`
- `src/lib/shared/data-access/chat/models/messageFileSchema.ts`
- `src/lib/chat/data-access/models/chatInputSchema.ts`

### 2. Добавить path alias для нового shared слоя

Нужно подготовить alias для импорта из `packages/app-core`.

Цель:
- текущий код должен начать импортировать эти сущности из нового shared location
- без перехода на workspaces
- без запуска package-manager migration

### 3. Обновить только необходимые импорты

Нужно изменить только те импорты, которые затрагивают вынесенные сущности.

## Out of Scope

Запрещено включать в сегмент:
- `src/lib/shared/utils/conversation.ts`
- `src/lib/channel/data-access/models/channelFormSchema.ts`
- любые файлы, завязанные на `db`
- любые файлы, завязанные на `@prisma/client`, если это создаёт лишний coupling
- `src/app/*`
- `src/pages/api/*`
- `src/middleware.ts`
- `electron/*`
- `Clerk`, `UploadThing`, `LiveKit`
- создание `Nest` backend
- workspaces migration

## Why These Constraints Exist

Этот сегмент должен быть безопасным.

Мы **не** переносим:
- `conversation.ts`, потому что он завязан на `db`
- `channelFormSchema.ts`, потому что он тянет `@/types` и `@prisma/client`, а значит пока не является хорошим seed-кандидатом для чистого `app-core`

Первый сегмент должен сформировать правильную привычку:
- сначала переносим чистые contracts
- потом переносим более связанные куски

## Files to Inspect First

- `tsconfig.json`
- `src/lib/shared/utils/routes.ts`
- `src/lib/shared/utils/upload-file.ts`
- `src/lib/shared/utils/get-profile-name.ts`
- `src/lib/shared/data-access/server/models/serverModalSchema.ts`
- `src/lib/shared/data-access/chat/models/messageFileSchema.ts`
- `src/lib/chat/data-access/models/chatInputSchema.ts`

Также нужно найти всех потребителей этих файлов перед изменениями.

## Expected Target Structure

Ожидаемая структура после выполнения сегмента:

```text
packages/
  app-core/
    src/
      routing/
        routes.ts
      files/
        upload-file.ts
      profiles/
        get-profile-name.ts
      schemas/
        server-form-schema.ts
        message-file-schema.ts
        chat-input-schema.ts
```

Допустимы небольшие корректировки нейминга, если они последовательны и логичны.

## Constraints

- не ломать текущий runtime
- не менять пользовательское поведение
- не расширять scope
- не делать “раз уж начали, перенесём ещё вот это”
- не придумывать новую архитектуру поверх уже согласованной

## Implementation Notes

### 1. Alias

Если добавляется alias, он должен быть минимальным и локальным.

Ожидаемое направление:
- `@app-core/*` -> `packages/app-core/src/*`

Исполнитель не должен одновременно вводить полноценную workspace migration.

### 2. Naming

Если нейминг меняется при переносе, он должен становиться **более явным**, а не менее.

Например:
- `serverModalSchema.ts` -> `server-form-schema.ts`
- `messageFileSchema.ts` -> `message-file-schema.ts`

Но только если это не создаёт лишнего шума в diff.

### 3. No Hidden Coupling

Если в процессе выяснится, что какой-то файл тянет лишнюю зависимость и уже не является “чистым”, его нужно **оставить вне сегмента** и явно отметить в handoff.

## Expected Deliverable

По завершении сегмента должно быть:
- создано первое рабочее наполнение `packages/app-core/src`
- добавлен alias для этого слоя
- текущие потребители переключены на новый источник
- runtime behavior не изменён

## Acceptance Criteria

- вынесены только чистые файлы из scope
- `conversation.ts` не тронут
- `channelFormSchema.ts` не тронут
- все обновлённые импорты валидны
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не был запущен
- handoff содержит список того, что не было перенесено и почему

## Validation

Минимум:
- `tsc --noEmit -p tsconfig.json`
- `eslint` по затронутым файлам, если доступен

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- что именно перенесено
- почему это безопасный первый шаг

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
- что сознательно **не** перенесено
- почему это оставлено на следующий сегмент

### Recommended Next Segment

Исполнитель должен предложить следующий логичный сегмент после этого PR.
