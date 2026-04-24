# Segment Brief 005: Nest Skeleton Bootstrap

## Segment

`nest-skeleton-bootstrap`

## Recommended Branch Name

`wave/nest-foundation-skeleton`

## Goal

Начать `Stage 2` и поднять отдельный backend-контур в `apps/api`, но без раннего переноса доменной логики.

Задача сегмента:
- создать `apps/api`
- поднять базовый `Nest` skeleton
- зафиксировать backend entrypoint и модульный каркас
- не переносить пока `invite/server/channel/member`
- не менять текущий runtime web/desktop

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [FIRST_MIGRATION.md](../../waves/FIRST_MIGRATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Создать `apps/api`

Ожидаемое направление:

```text
apps/
  api/
    src/
      main.ts
      app.module.ts
      common/
      modules/
    package.json
```

### 2. Поднять минимальный Nest bootstrap

Нужно сделать только каркас:
- `main.ts`
- `AppModule`
- health/basic app boot
- базовую структуру `common` и `modules`

### 3. Зафиксировать стартовый backend scaffold

Допустимо создать пустые или почти пустые module directories для будущего развития:
- `auth`
- `users`
- `profiles`
- `servers`
- `channels`
- `members`
- `invites`
- `messages`
- `direct-messages`
- `realtime`
- `media`

Но без реального переноса туда текущей доменной логики.

## Out of Scope

Запрещено включать в сегмент:
- перенос `invite/server/channel/member`
- перенос `messages/direct-messages`
- перенос `Socket.IO` логики
- замену `Clerk`
- замену `LiveKit`
- замену `UploadThing`
- миграцию `MySQL -> Postgres`
- массовые изменения в `src/app/*`
- массовые изменения в `src/pages/api/*`
- интеграцию backend в production flow

## Constraints

- не ломать текущий runtime
- не делать domain migration в этом же PR
- не превращать сегмент в микросервисную архитектуру
- не тянуть в сегмент лишнюю infra-сложность

## Expected Deliverable

По завершении сегмента должно быть:
- физически создано `apps/api`
- `Nest` skeleton собирается
- есть понятный backend entrypoint
- есть базовая структура под будущие модули
- текущий web/desktop runtime не изменён

## Acceptance Criteria

- есть `apps/api`
- есть `main.ts`
- есть `AppModule`
- есть базовая модульная структура
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не запускался
- доменная логика ещё не переносилась

## Validation

Минимум:
- typecheck по новой backend-части
- lint по затронутым backend-файлам
- проверка, что текущий runtime не затронут

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- какой backend scaffold создан
- почему scope был удержан только на skeleton

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

- какие интеграции ещё не подключены
- что именно остаётся на следующий сегмент

### Recommended Next Segment

Следующий логичный сегмент после этого:
- либо `invite/server/channel/member` domain extraction
- либо промежуточный backend config/module hardening segment, если каркас окажется слишком сырым
