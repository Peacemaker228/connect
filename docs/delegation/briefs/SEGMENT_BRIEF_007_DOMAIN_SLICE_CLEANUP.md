# Segment Brief 007: Domain Slice Cleanup

## Segment

`domain-slice-cleanup`

## Recommended Branch Name

`wave/domain-slice-1-cleanup`

## Goal

Не расширять `Stage 3` дальше, а аккуратно дочистить первый domain slice:
- invites
- servers
- channels
- members

Задача сегмента:
- привести transitional хвосты этого slice в порядок
- проверить consistency между `apps/api`, `src/app/api/*` и `src/pages/api/socket/*`
- не лезть пока в `messages/direct-messages`
- не лезть в auth/media/database migrations

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [DOMAIN_EXTRACTION_SLICE_1.md](../../waves/DOMAIN_EXTRACTION_SLICE_1.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Дочистить compatibility/proxy слой

Нужно проверить и при необходимости привести к одному стилю:
- `src/app/api/servers/*`
- `src/app/api/channels/*`
- `src/app/api/members/*`
- invite-related app routes

### 2. Дочистить transitional socket layer

Нужно проверить и при необходимости привести к одному стилю:
- `src/pages/api/socket/servers/*`
- `src/pages/api/socket/channels/*`
- `src/pages/api/socket/members/*`

### 3. Удержать ownership в `apps/api`

Критерий:
- основная доменная логика этого slice не должна возвращаться в `Next` слои

## Out of Scope

Запрещено включать в сегмент:
- `messages`
- `direct-messages`
- полный realtime extraction
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration
- новый domain slice

## Constraints

- не расширять scope
- не смешивать cleanup с новым большим переносом
- не ломать текущий runtime
- сохранять `apps/api` как backend owner для этого slice

## Expected Deliverable

По завершении сегмента должно быть:
- первый Stage 3 slice дочищен в transitional частях
- compatibility/proxy слой стал ровнее и понятнее
- legacy socket layer для этого slice стал тоньше и чище

## Acceptance Criteria

- `apps/api` остаётся owner этого slice
- `Next app/api` не содержит обратно доменную логику
- `pages/api/socket` не содержит обратно доменную логику
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не запускался

## Validation

Минимум:
- typecheck
- lint по затронутым файлам
- логическая проверка, что ownership slice не расползся обратно в `Next`

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- какие transitional хвосты дочищены
- какие ещё сознательно оставлены

### Changed Files

Плоский список файлов

### What Changed

По каждому важному файлу:
- что изменено
- почему

### Validation

- что проверено
- что не проверено

### Risks

- какие переходные точки ещё остались
- что будет следующим логичным шагом

### Recommended Next Segment

Следующий логичный сегмент после этого:
- либо realtime extraction для этого же slice
- либо расширение Stage 3 на следующий domain slice
