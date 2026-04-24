# Domain Extraction Slice 1 Wave

## Goal

Эта волна соответствует началу `Stage 3`.

Первый реальный backend-owned domain slice:
- invites
- servers
- channels
- members

Задача волны:
- перенести этот slice в `apps/api`
- перевести `Next` entrypoints в compatibility/proxy слой
- оставить `pages/api/socket` transitional, но без хранения там основной доменной логики

## Position in the Main Plan

Соответствие такое:
- `FIRST_MIGRATION` = `Stage 1`
- `NEST_FOUNDATION` = `Stage 2`
- `DOMAIN_EXTRACTION_SLICE_1` = старт `Stage 3`

## Scope of This Wave

### Included

- controllers/services для invites, servers, channels, members в `apps/api`
- `PrismaService` в common backend layer
- thin proxy helper для вызова `apps/api`
- `src/app/api/*` compatibility layer для invite/server/channel/member slice
- `src/pages/api/socket/*` transitional proxy/socket emit layer для того же slice

### Out of Scope

- `messages`
- `direct-messages`
- полный realtime extraction
- `Clerk` replacement
- `UploadThing` replacement
- `LiveKit` replacement
- `Postgres` migration

## Current Result

Сейчас в рамках этой волны:
- первый Stage 3 slice уже живёт в `apps/api`
- `Next app/api` больше не является местом хранения основной логики для этого slice
- `pages/api/socket` ещё transitional, но уже не backend-owned domain layer

## Transitional Risks

- auth всё ещё transitional через profile resolution в `Next`
- backend получает `x-profile-id`
- legacy Socket.IO transport ещё не вынесен полностью
- для полноценного smoke/e2e нужен валидный `DATABASE_URL` для standalone `apps/api`

## What Comes Next

Следующий шаг внутри `Stage 3` должен быть одним из двух:

1. дочистить transitional хвосты в этом же domain slice
2. отдельно идти в realtime extraction для этого slice

Важно:
- не смешивать это с `messages/direct-messages`
- не смешивать это с auth/media/database migrations

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md](../delegation/briefs/SEGMENT_BRIEF_006_INVITE_SERVER_DOMAIN.md)
