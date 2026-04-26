# Architecture

## Purpose

Этот документ фиксирует целевую архитектуру проекта `connect`, чтобы migration work не принимал решения "по месту".

Он отвечает на вопросы:
- какой у проекта target state
- какие части системы являются временными
- какие части являются стратегическими
- в каком порядке архитектура должна эволюционировать

## Product Direction

- продукт `desktop-first`
- web важен, но не является главным архитектурным центром
- backend должен стать собственным и управляемым
- внешние зависимости должны сидеть за внутренними contracts/adapters

## Target Platform Shape

### Repository Model

- одна repo: `connect`
- monorepo-структура внутри repo
- без split на несколько repos на текущем этапе

### Top-Level Structure

```text
connect/
  apps/
    web/
    desktop/
    api/
  packages/
    app-core/
    sdk/
    ui/
    config/
  infra/
  docs/
```

## Runtime Roles

### `apps/web`

Роль:
- web shell
- routing
- page composition
- web-specific runtime integration

Не должно оставаться стратегическим местом для:
- core business logic
- long-term auth logic
- realtime backend logic
- media orchestration

### `apps/desktop`

Роль:
- Electron shell
- desktop integration
- protocol/deep-link handling
- OS-specific capabilities

Desktop не должен дублировать бизнес-логику backend.

### `apps/api`

Роль:
- основной backend-контур
- auth boundary
- domain boundary
- realtime boundary
- media control/signaling boundary

Целевая модель:
- `Nest modular monolith`

Не целимся в ранние микросервисы.

### `packages/app-core`

Роль:
- доменные типы
- contracts
- adapters interfaces
- shared use-case level logic
- runtime-agnostic schemas/helpers

Это не UI-пакет и не backend runtime.

### `packages/sdk`

Роль:
- typed API access
- client-facing transport helpers
- shared query/mutation access layer

Это не место для app-specific UI orchestration.

### `packages/ui`

Роль:
- primitives
- reusable presentational components
- UI helpers

Это не место для runtime-coupled feature logic.

### `infra`

Роль:
- `Postgres`
- `Redis`
- `MinIO` или иной S3-compatible storage
- `coturn`
- `SFU` stack

Stage note:
- the presence of `infra/redis` and `infra/minio` does not mean they must be introduced early
- for `Stage 5`, the preferred storage direction is managed cloud `S3-compatible` first
- self-hosted `MinIO` stays a later independence-focused option
- `Redis` should appear only when a concrete queue/cache/rate-limit need exists

## Current Transitional State

Сейчас проект — переходный монолит с уже вынесенным backend ownership для текущего domain/realtime слоя:
- `Next App Router` как web shell и server-side redirect/data flow
- `apps/api` как backend owner для domain/realtime
- thin compatibility layers в `src/app/api/*` и remaining `src/pages/api/socket/*`
- `Electron`
- `Clerk`
- `UploadThing`
- `LiveKit`
- `Prisma + MySQL`

Это допустимое текущее состояние, но не target state.

## Architectural Direction

Правильная эволюция такая:

1. зафиксировать архитектуру и границы
2. расцепить текущий проект изнутри
3. поднять `apps/api`
4. перенести домен и realtime в backend
5. убрать внешние core-зависимости
6. только потом переходить к тяжёлому media rewrite

## What Stays Temporary

Временные решения:
- `Next` как fullstack shell
- `Clerk` как auth provider
- `UploadThing` как storage dependency
- `LiveKit` как media layer
- `MySQL` как текущая БД

Они допустимы только до соответствующих migration stages.

## What Is Strategic

Стратегическими считаются:
- `apps/api`
- `packages/app-core`
- `packages/sdk`
- `packages/ui`
- собственные auth/storage/media/realtime boundaries
- собственная infra-модель

## Execution Rule

Если локальное решение конфликтует с этим документом, приоритет у этого документа и у [PLATFORM_MIGRATION_PLAN.md](./PLATFORM_MIGRATION_PLAN.md).
