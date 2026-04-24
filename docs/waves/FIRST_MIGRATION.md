# First Migration Wave

## Goal

`FIRST_MIGRATION` — это не весь `Stage 1` и не один большой PR.

Это первая безопасная волна миграции, цель которой:
- начать внутреннее расцепление текущего проекта
- заложить первые shared packages
- не ломать текущий runtime
- не трогать `src/app/*`, `src/pages/api/*`, `src/middleware.ts`, `electron/*`

## Position in the Main Plan

Этот документ подчинён [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md).

Правильное соответствие такое:
- `FIRST_MIGRATION` = первая волна внутри `Stage 1 / Sprint 2`
- `apps/api + Nest skeleton` = `Stage 2 / Sprint 3`
- перенос `invite/server/channel/member` = `Stage 3 / Sprint 4`

То есть после завершения этой волны мы не прыгаем сразу к переносу домена.
Сначала нужно закрыть хвост `Stage 1`, затем поднять `Nest`-контур, и только потом переносить доменную логику.

## Wave Structure

Одна волна = несколько небольших последовательных PR.

Для `FIRST_MIGRATION` текущая структура такая:
1. `SEGMENT 001` — `app-core seed extraction`
2. `SEGMENT 002` — `sdk seed extraction`
3. `SEGMENT 003` — `ui seed extraction`

Каждый сегмент:
- идёт отдельным PR
- остаётся маленьким и reviewable
- мержится отдельно в `core/reborn`

## Scope of This Wave

### Included

- seed extraction в `packages/app-core`
- seed extraction в `packages/sdk`
- seed extraction в `packages/ui`
- path aliases для новых shared packages
- shim/re-export слой в старых путях

### Explicitly Out of Scope

- `apps/api`
- `Nest` bootstrap
- перенос `invite/server/channel/member`
- перенос `messages/direct-messages/realtime`
- замена `Clerk`
- замена `UploadThing`
- замена `LiveKit`
- миграция `MySQL -> Postgres`
- `Next -> React`

## Stage 1 Done Checklist

`Stage 1` считается закрытым только когда выполнены все пункты ниже:

- [x] сделан seed extraction в `packages/app-core`
- [x] сделан seed extraction в `packages/sdk`
- [x] сделан seed extraction в `packages/ui`
- [x] добавлены и используются `@app-core/*`, `@sdk/*`, `@ui/*`
- [x] старые пути сохранены как shim/re-export слой
- [x] зафиксированы `ARCHITECTURE.md` и `BOUNDARIES.md`
- [ ] введены contracts/adapters для `AuthProvider`, `StorageProvider`, `MediaProvider`, `RealtimeProvider`

Коротко:
- `FIRST_MIGRATION` закрывает только безопасную extraction-часть `Stage 1`
- `Stage 1` в целом закрывается только после документов и adapter/contracts слоя

## What Comes Next

Правильная последовательность после `FIRST_MIGRATION` такая:

1. Закрыть оставшийся хвост `Stage 1`
2. Перейти к `Stage 2`: поднять `apps/api` и `Nest skeleton`
3. Перейти к `Stage 3`: начать перенос `invite/server/channel/member` domain

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [DELEGATION_AGENT_GUIDE.md](../delegation/DELEGATION_AGENT_GUIDE.md)
- [SEGMENT_BRIEF_001_APP_CORE_SEED.md](../delegation/briefs/SEGMENT_BRIEF_001_APP_CORE_SEED.md)
- [SEGMENT_BRIEF_002_SDK_SEED.md](../delegation/briefs/SEGMENT_BRIEF_002_SDK_SEED.md)
- [SEGMENT_BRIEF_003_UI_SEED.md](../delegation/briefs/SEGMENT_BRIEF_003_UI_SEED.md)
