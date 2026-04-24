# Segment Brief 006: Invite and Server Domain Extraction

## Segment

`invite-server-domain-extraction`

## Recommended Branch Name

`wave/domain-extraction-invites-servers`

## Goal

Начать `Stage 3` и перенести первый реальный backend-owned domain slice в `apps/api`.

Первый slice:
- invites
- servers
- channels
- members

Задача сегмента:
- начать перенос этой доменной логики в `apps/api`
- не трогать пока messages/direct-messages
- не смешивать это с auth replacement
- не смешивать это с media/storage/database migrations

## Source of Truth

Перед началом работы исполнитель обязан прочитать:
- [PLATFORM_MIGRATION_PLAN.md](../../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../../roadmap/STAGE_STATUS.md)
- [NEST_FOUNDATION.md](../../waves/NEST_FOUNDATION.md)
- [DELEGATION_AGENT_GUIDE.md](../DELEGATION_AGENT_GUIDE.md)

## In Scope

### 1. Найти текущие доменные entrypoints

Нужно проанализировать текущие источники логики для:
- invites
- servers
- channels
- members

Ожидаемые кандидаты:
- `src/app/api/servers/*`
- `src/app/api/channels/*`
- `src/app/api/members/*`
- invite-related routes и server utilities

### 2. Начать backend-owned перенос в `apps/api`

Ожидаемое направление:
- `apps/api/src/modules/servers/*`
- `apps/api/src/modules/channels/*`
- `apps/api/src/modules/members/*`
- `apps/api/src/modules/invites/*`

### 3. Держать migration slice narrow

Сегмент должен переносить именно первый domain slice, а не весь backend сразу.

## Out of Scope

Запрещено включать в сегмент:
- `messages`
- `direct-messages`
- полный `Socket.IO` transport migration
- замену `Clerk`
- замену `UploadThing`
- замену `LiveKit`
- `Postgres` migration
- frontend rewrite

## Constraints

- не смешивать Stage 3 с поздними migrations
- не превращать сегмент в “перенесём сразу всё”
- по возможности сохранять текущий runtime стабильным
- если нужен transitional proxy/thin compatibility layer, это допустимо

## Expected Deliverable

По завершении сегмента должно быть:
- первый реальный domain slice начал жить в `apps/api`
- ownership этого slice смещён из `Next API` в backend direction
- scope не расползся в messages/auth/media

## Acceptance Criteria

- затронут только invite/server/channel/member slice
- `apps/api` получает реальную доменную нагрузку
- текущий runtime не ломается
- typecheck проходит
- lint по затронутым файлам проходит или есть явное объяснение, почему не запускался

## Validation

Минимум:
- typecheck
- lint по затронутым файлам
- логическая проверка, что scope не вышел за slice

## Handoff Requirements

Исполнитель обязан в конце вернуть:

### Summary

- какой domain slice реально перенесён
- какая часть ещё осталась в `Next`

### Changed Files

Плоский список файлов

### What Changed

По каждому важному файлу:
- что перенесено
- почему

### Validation

- что проверено
- что не проверено

### Risks

- какие transitional parts ещё остались
- какие точки всё ещё сидят в `Next API`

### Recommended Next Segment

Следующий логичный сегмент после этого:
- либо продолжение domain extraction
- либо отдельный realtime extraction segment, если domain slice уже стабилен
