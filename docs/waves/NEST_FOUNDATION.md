# Nest Foundation Wave

## Goal

Эта волна соответствует `Stage 2 / Nest Foundation`.

Её задача:
- создать `apps/api`
- поднять `Nest` skeleton
- зафиксировать backend entrypoint
- создать базовый common/config/logger/health scaffold
- подготовить модульный backend-каркас без раннего переноса доменной логики

## Position in the Main Plan

Соответствие такое:
- `FIRST_MIGRATION` = `Stage 1`
- `NEST_FOUNDATION` = `Stage 2`
- следующий шаг после этой волны = `Stage 3 / domain + realtime extraction`

## Scope of This Wave

### Included

- `apps/api`
- `main.ts`
- `AppModule`
- `CommonModule`
- config/logger scaffold
- health module
- realtime gateway scaffold
- пустые/минимальные backend modules для будущих доменов

### Out of Scope

- перенос `invite/server/channel/member`
- перенос `messages/direct-messages`
- перенос текущего `Socket.IO` runtime
- auth replacement
- storage replacement
- media replacement
- database migration

## Completion Criteria

Волна считается закрытой, когда:
- [x] создан `apps/api`
- [x] создан `main.ts`
- [x] создан `AppModule`
- [x] добавлены common/config/logger части
- [x] добавлен health endpoint
- [x] добавлен realtime scaffold
- [x] создан модульный backend-каркас
- [x] текущий web/desktop runtime не затронут

## Result

`Stage 2` теперь закрыт на уровне foundation.

Это ещё не domain migration и не production backend switch.
Это только корректный backend-контур, от которого уже можно безопасно начинать `Stage 3`.

## What Comes Next

Следующий шаг:

1. начать `Stage 3`
2. переносить первый реальный domain slice
3. не смешивать этот шаг с `Clerk` replacement, `Postgres` migration или media rewrite

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [SEGMENT_BRIEF_005_NEST_SKELETON.md](../delegation/briefs/SEGMENT_BRIEF_005_NEST_SKELETON.md)
