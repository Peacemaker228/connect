# Boundaries

## Purpose

Этот документ фиксирует архитектурные границы, через которые проект должен двигаться дальше.

Главная идея:
- внешние сервисы и runtime-specific детали не должны быть размазаны по всему приложению
- доступ к ним должен идти через внутренние contracts/adapters

## Core Boundaries

### 1. Auth Boundary

Назначение:
- current user
- session model
- access control
- auth redirects
- device/session lifecycle

Сейчас:
- backend-owned auth/session boundary is the active path
- historical `Clerk` references are roadmap history only, not active runtime ownership

Target:
- собственный auth module в `apps/api`
- клиент работает через внутренний `AuthProvider`, а не через прямой SDK usage по всему UI
- browser auth transport должен идти через `Secure` + `HttpOnly` cookie-based session flow
- protected routes в web runtime должны быть только UX/router-слоем над backend session checks, а не источником реальной защиты

Правило:
- новые auth-зависимости нельзя тащить напрямую в feature/UI слой

### 2. Storage Boundary

Назначение:
- upload initiation
- file metadata
- signed URL / file access
- storage policy

Сейчас:
- backend-controlled managed-cloud `S3-compatible` storage is the active path
- historical public URL compatibility still exists for old values and gradual normalization

Target:
- backend-controlled storage flow
- provider можно менять между managed `S3-compatible` storage и later self-hosted `MinIO`

Current Stage 5 direction:
- cloud-first managed `S3-compatible` storage
- no `Redis` in the initial storage foundation
- no self-hosted `MinIO` as the first move
- keep the later path open for `MinIO` only after the storage boundary is stable
- keep files `public` for the current product stage
- keep `backend-redirect` as the current active runtime read/access contract
- keep legacy URL compatibility instead of forcing a mass migration now

Правило:
- клиент не должен считать конкретный storage vendor частью core-логики

### 3. Media Boundary

Назначение:
- room lifecycle
- participant lifecycle
- audio/video state
- screen share
- reconnect behavior
- media permissions

Сейчас:
- `LiveKit`

Target:
- свой media contract
- свой signaling/control plane
- open-source `SFU`

Правило:
- media client API должен быть абстрагирован от конкретного vendor

### 4. Realtime Boundary

Назначение:
- websocket transport
- room/server events
- messaging events
- subscription model

Сейчас:
- transport ownership уже находится в `apps/api`, а legacy `src/pages/api/socket/*` остался как transitional HTTP compatibility layer
- клиентские hooks уже работают против backend-owned realtime transport через общие contracts

Target:
- единый realtime boundary в `apps/api`
- клиент использует внутренний `RealtimeProvider`

Правило:
- realtime hooks не должны становиться транспортно-зависимыми feature-островами без общей границы

### 5. Domain API Boundary

Назначение:
- servers
- channels
- members
- invites
- messages
- direct messages
- permissions/roles

Сейчас:
- core domain ownership уже находится в `apps/api`
- `Next API` и legacy HTTP entrypoints остались thin compatibility/proxy layers
- client access еще продолжает сходиться к `packages/sdk`

Target:
- домен живёт в `apps/api`
- клиенты ходят в backend через `packages/sdk`

Правило:
- UI не должен быть местом хранения доменной логики

### Web Runtime Note

- web runtime в долгую должен опираться на direct client requests в `apps/api`, а не на `Next` proxy routes
- `pages/api` и `app/api` в `Next` для domain access должны остаться только временным compatibility layer
- как web client data layer допустимы `TanStack Query` + `axios` (или другой thin HTTP client), но ownership должен оставаться у backend
- для `Stage 5A` direct backend mode считается active runtime target; same-origin `Next` API fallback больше не должен блокировать нормализацию новых chat write paths, но broad proxy deletion всё равно требует отдельного inventory/cleanup шага
- Segment 044 inventory зафиксировал remaining `Next` route surface в `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`; future removal должен идти route-family slices, а не broad deletion

## Package Boundaries

### `packages/app-core`

Можно:
- contracts
- interfaces
- runtime-agnostic schemas
- shared domain types

Нельзя:
- `Next` runtime
- `Electron` runtime
- прямой backend bootstrap
- app-specific UI

### `packages/sdk`

Можно:
- typed access to API
- transport helpers
- shared queries/mutations

Нельзя:
- page/runtime orchestration
- large feature-side effects
- backend ownership

### `packages/ui`

Можно:
- primitives
- reusable presentational building blocks
- UI helpers

Нельзя:
- auth logic
- backend logic
- app routing
- runtime-specific providers

## Early-Stage No-Touch Areas

До поздних stages не трогаем без прямой необходимости:
- `src/app/*`
- `src/pages/api/*`
- `src/middleware.ts`
- `electron/*`

Причина:
- это текущие runtime entrypoints
- ранний перенос этих частей создаёт лишний риск и ломает migration sequencing

## Boundary Ownership Direction

Целевая ownership-модель такая:
- `apps/web` = shell
- `apps/desktop` = shell
- `apps/api` = backend ownership
- `packages/app-core` = contracts/types/use-case layer
- `packages/sdk` = client access layer
- `packages/ui` = UI primitives/shared presentation

## Stage 1 Required Contracts

Для закрытия early decoupling нужны как минимум contracts уровня интерфейсов:
- `AuthProvider`
- `StorageProvider`
- `MediaProvider`
- `RealtimeProvider`

Это не означает немедленную полную реализацию.
Сначала важна именно фиксация границы.

## Execution Rule

Если код тянет прямую vendor/runtime-связность через эту границу, это считается архитектурным долгом и должно либо:
- остаться временным и быть явно помеченным
- либо быть вынесено за boundary при ближайшем подходящем segment/wave
