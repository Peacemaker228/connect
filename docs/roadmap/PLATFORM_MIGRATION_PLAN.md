# Platform Migration Plan

## 1. Executive Summary

Проекту нужен не большой одномоментный rewrite, а последовательная смена архитектуры.

Цель:
- уйти от текущего `Next/Electron/fullstack-monolith`
- прийти к `desktop-first` платформе
- получить собственные `backend`, `auth`, `storage` и `media` boundaries

Главный принцип:
- не делать одновременно 5 миграций
- сначала выстроить границы
- потом вынести backend
- потом убрать внешние зависимости
- потом трогать media
- и только в конце решать, нужен ли уход с `Next`

## 2. Strategic Choice

Сейчас выбор не между `React` и `Next`.

`Next` уже использует `React`.

Реальный выбор такой:
- оставить связанный fullstack-монолит
- перейти к модульной платформе с чёткими границами

Для этого проекта правильнее второе.

Но реализовывать это нужно не через ранние микросервисы, а через:
- `Nest modular monolith`
- shared React packages
- отдельно вынесенные infra-компоненты только там, где это действительно нужно

## 3. Why This Fits This Project

- продукт `desktop-first`
- есть желание убрать `Clerk`
- есть желание убрать `UploadThing`
- есть желание полностью уйти от `LiveKit`
- есть готовность поднимать свою infra

Если оставить всё внутри текущего fullstack-монолита, проект снова упрётся в:
- auth, завязанный на внешний SDK
- media, завязанную на внешний SDK
- API, смешанный с web-shell
- desktop и web, связанные не архитектурой, а случайной сборкой зависимостей

## 4. Repository Strategy

### Recommendation

На текущем этапе проекту лучше остаться в рамках **одной репы `connect`**.

Правильная модель:
- одна repo
- monorepo-структура внутри repo
- разные `apps/*`, `packages/*`, `infra/*`

### Why Not Split Repos Now

Разделение на несколько реп сейчас создаст проблемы раньше, чем принесёт пользу:
- versioning hell
- рассинхрон контрактов
- неудобный локальный dev flow
- более тяжёлый CI/CD
- лишняя организационная сложность

### When Split Repos Might Make Sense

Split repos стоит обсуждать только когда появятся:
- разные команды с независимым ownership
- разные release cycles
- отдельные security boundaries
- реально самостоятельные сервисы, которые живут независимо

На текущем этапе этого не видно.

## 5. Target Architecture

- `apps/web` — web-клиент
- `apps/desktop` — Electron-клиент
- `apps/api` — `Nest` backend
- `packages/ui` — общие UI-компоненты
- `packages/app-core` — доменные типы, use-cases, adapters/contracts
- `packages/sdk` — typed API client для `web` и `desktop`
- `packages/config` — shared config, lint, tsconfig presets
- `infra`
  - `postgres`
  - `redis`
  - `minio`
  - `coturn`
  - `sfu`

## 6. Proposed Monorepo Tree

```text
connect/
  apps/
    web/
      src/
      public/
      package.json
    desktop/
      electron/
      package.json
    api/
      src/
        modules/
          auth/
          users/
          profiles/
          servers/
          channels/
          members/
          invites/
          messages/
          direct-messages/
          files/
          realtime/
          media/
        common/
        main.ts
      package.json
  packages/
    ui/
      src/
    app-core/
      src/
        auth/
        storage/
        media/
        realtime/
        server-domain/
        chat-domain/
        types/
        contracts/
    sdk/
      src/
        api/
        realtime/
        media/
    config/
      eslint/
      tsconfig/
  infra/
    docker/
    postgres/
    redis/
    minio/
    coturn/
    mediasoup/
  docs/
    roadmap/
      PLATFORM_MIGRATION_PLAN.md
      ARCHITECTURE.md
      BOUNDARIES.md
```

## 7. Current State Snapshot

Сейчас проект представляет собой переходный монолит с уже вынесенным backend ownership:
- `Next App Router` для страниц и server-side redirect/data flow
- `apps/api` как backend owner для текущего domain/realtime слоя
- thin compatibility layers в `src/app/api/*` и части `src/pages/api/socket/*`
- `Electron` как desktop shell
- backend-owned auth is now the active provider path; `Clerk` replacement work is largely complete and the remaining auth work is product-completeness
- managed-cloud `S3-compatible` storage is now the active storage path, while historical public URL compatibility remains as transitional baggage
- `LiveKit` как media layer
- `Prisma + MySQL` как persistence

Это означает, что главная проблема не в одной конкретной библиотеке, а в отсутствии жёстких архитектурных границ.

## 8. Decision by Major Direction

### `Next.js -> React`

Это не первый приоритет.

Сейчас `Next` реально используется:
- `middleware`
- server-side auth gate
- `app/api`
- `pages/api`
- `next-intl`
- invite-flow
- SSR redirect

Для продукта такого типа чистый React в долгую выглядит логичнее, если backend будет отдельным.

Но делать это до выноса backend и auth невыгодно.

Вывод:
- в долгую — возможно да
- сейчас — нет

### Backend in `Nest.js`

Это главный архитектурный шаг.

Сейчас переходное состояние такое:
- core domain logic уже живёт в `apps/api`
- thin compatibility flow всё ещё проходит через `app/api`
- часть transitional HTTP entrypoints всё ещё остаётся в `pages/api/socket/*`
- auth/profile resolution всё ещё проходит через web runtime

Вынос в `Nest` даст:
- модульность
- единый auth boundary
- единый realtime boundary
- подготовку к отказу от `Clerk`, `LiveKit`, `UploadThing`

Вывод:
- это правильный фундамент

### Replace `Clerk`

Стратегически это разумно, если нужен полный контроль над:
- desktop flow
- сессиями
- redirect logic
- аккаунтами
- доступом

Но это не должна быть “самописная авторизация на коленке”.

Нужно закрыть:
- registration/login
- password hashing
- email verification
- password reset
- refresh/access tokens или server sessions
- device/session management

Вывод:
- да, убирать
- но только после появления собственного backend-ядра

### Replace `UploadThing`

Current storage decision:
- prefer managed cloud `S3-compatible` storage first
- do not introduce `Redis` in the initial storage step
- do not start with self-hosted `MinIO`
- keep `MinIO` as a later option once the storage boundary is stable
- keep files `public` for the current product stage
- keep `backend-redirect` as the current active read/access contract
- do not do a mass migration of legacy storage URLs right now
- `Stage 5` is now considered complete at the current roadmap level
- the implemented storage hygiene path stays narrow: staged/temp-upload sweeper, not a full bucket-vs-DB orphan scanner

Это не выглядит срочной задачей.

Сейчас в проекте уже есть хороший промежуточный слой: загрузка идёт через backend route, а не через произвольный direct flow из UI.

Значит, storage можно заменить позже на:
- `MinIO`
- `S3-compatible storage`
- другой backend storage provider

Вывод:
- сначала изолировать через adapter
- потом при необходимости менять реализацию

### `MySQL -> Postgres`

Это полезная миграция, но не та, которая сейчас решает главную боль.

`Postgres` в долгую даст более сильную базу для:
- сложных запросов
- расширения backend
- JSONB / аналитики / полнотекста

Но менять БД одновременно с backend/auth/media нельзя.

Вывод:
- да
- но отдельным controlled migration после стабилизации backend

### Replace `LiveKit`

Если это системный product blocker, то это действительно ключевое стратегическое направление.

Но тут важно понимать:
- уход от `LiveKit` не отменяет сетевую реальность `WebRTC`
- всё равно понадобятся:
  - `TURN/STUN`
  - signaling
  - `SFU/MCU`
  - диагностика
  - reconnect flow

Писать свой WebRTC-стек с нуля не надо.

Рациональный путь:
- свой signaling/control plane
- свой auth/media contract
- open-source `SFU`

Первый сильный кандидат:
- `mediasoup`

Вывод:
- да, это главное продуктовое направление
- но это не быстрый рефактор, а отдельная платформа

## 9. Migration Order

1. Архитектурная фиксация
2. Внутреннее расцепление текущего проекта
3. Поднять `Nest` как modular monolith
4. Перенести domain/realtime в `Nest`
5. Убрать `Clerk`
6. Изолировать storage и решить судьбу `UploadThing`
7. Перевести БД на `Postgres`
8. Подготовить media architecture
9. Заменить `LiveKit`
10. Только потом решать, нужен ли уход с `Next`

Late-order note:
- deferred auth-product completeness such as `email verification` and `password reset` should happen near the end of the roadmap
- this late auth work should be completed before the final `Next.js -> React` decision

## 10. Detailed Migration Stages

### Stage 0. Architecture Freeze

Срок:
- `3-5 дней`

Что делаем:
- фиксируем target architecture
- фиксируем boundaries:
  - `auth`
  - `storage`
  - `media`
  - `realtime`
  - `domain api`
- описываем, какие части временно остаются в `Next`, а какие уходят в `Nest`

Результат:
- `ARCHITECTURE.md`
- `BOUNDARIES.md`
- список backend-модулей
- список внешних зависимостей, которые временно остаются за адаптерами

### Stage 1. Internal Decoupling

Срок:
- `1-2 недели`

Что делаем:
- вводим адаптеры:
  - `AuthProvider`
  - `StorageProvider`
  - `MediaProvider`
  - `RealtimeProvider`
- убираем прямое использование внешних SDK из произвольных частей UI
- сводим API-вызовы в единый слой
- выносим shared DTO и domain types
- готовим shared client SDK контракты

Результат:
- UI знает про внутренние интерфейсы, а не про конкретные `Clerk/UploadThing/LiveKit`

### Stage 2. `Nest` Foundation

Срок:
- `1-2 недели`

Что делаем:
- создаём `apps/api`
- поднимаем:
  - config
  - logger
  - healthcheck
  - `auth` module scaffold
  - `users/profiles` module scaffold
  - `servers/channels/messages/invites` scaffold
  - websocket gateway scaffold
- пока оставляем `Prisma`
- пока работаем с текущей БД

Результат:
- появляется отдельный backend-контур

### Stage 3. Domain and Realtime Extraction

Срок:
- `2-4 недели`

Что переносим:
- servers
- channels
- members
- invites
- messages
- direct messages
- socket events
- permissions/roles

Что делаем:
- `Next API` превращаем в thin proxy или выключаем
- `Socket.IO` уходит из `pages/api/socket/*` в `Nest gateway`
- web/desktop начинают работать через `Nest API`

Результат:
- основной домен живёт уже не в `Next`

### Stage 4. Replace `Clerk`

Срок:
- `2-4 недели`

Что делаем:
- реализуем собственный auth-модуль:
  - registration/login
  - password hashing
  - email verification
  - password reset
  - refresh/access tokens или sessions
  - device/session management
- переносим current profile resolution на свой backend
- удаляем интеграцию `Clerk`

Результат:
- auth становится частью платформы

Late-roadmap note:
- `email verification`
- `password reset`
- similar non-blocking auth-product completeness work

These items may be intentionally deferred until the very end of the roadmap, before the final `Next.js -> React` decision, as long as backend-owned auth/provider replacement is already complete and the current product can operate without them.

### Stage 5. Storage Abstraction

Current execution note:
- prefer managed cloud `S3-compatible` storage first
- do not add `Redis` in this stage without a concrete storage-driven need
- do not turn this stage into an early self-hosted infra rollout
- managed-cloud validation may be done with any acceptable `S3-compatible` provider; a temporary provider choice such as `Yandex Object Storage` does not change the architectural direction
- keep files `public` for now
- keep `backend-redirect` as the current runtime read/access model
- do not force a mass legacy URL migration during this stage

Срок:
- `1-2 недели`

Что делаем:
- вводим полноценный `StorageProvider`
- реализуем backend storage:
  - временно можно оставить `UploadThing`
  - затем добавить `MinIO`/`S3-compatible storage`
- все загрузки и получение ссылок идут только через backend

Результат:
- storage становится replaceable

### Stage 5A. Web Runtime API Extraction

Срок:
- `1-2 недели`

Что делаем:
- убираем remaining `pages/api` и `app/api` compatibility/proxy layers из `Next`
- переводим web runtime на direct requests в `apps/api`
- точкой доступа делаем client access layer через `packages/sdk`
- на client side используем query/mutation flow (`TanStack Query`; `axios` допустим как transport client, если он нужен команде)
- оставляем `Next` как web shell/router layer, а не как product API layer

Результат:
- web ходит напрямую в backend
- `Next` больше не владеет API/proxy ownership
- переход к `React + Vite` потом становится заметно проще

### Stage 6. `MySQL -> Postgres`

Срок:
- `1-2 недели`

Что делаем:
- поднимаем `Postgres`
- адаптируем `Prisma`
- пишем миграцию данных
- прогоняем staging migration
- делаем controlled cutover

Результат:
- проект уходит на более удобную БД для долгого роста

### Stage 7. Media Preparation

Срок:
- `1-2 недели`

Что делаем:
- вводим финальный `MediaProvider`
- описываем media contract:
  - room lifecycle
  - participant lifecycle
  - audio/video state
  - screen share
  - permissions
  - reconnect
- проектируем signaling/control plane в backend
- поднимаем `coturn`
- фиксируем SFU-стек

Результат:
- появляется архитектурная база под media rewrite

### Stage 8. Media MVP

Срок:
- `3-6 недель`

Первая цель:
- не “100000 человек”
- а рабочий MVP:
  - `1:1`
  - маленькие комнаты
  - audio/video
  - screen share
  - reconnect
  - desktop/web parity

Что делаем:
- свой signaling в backend
- свой auth/media binding
- `mediasoup` + `coturn`
- интеграция через `MediaProvider`

Результат:
- первый собственный production-capable media stack

### Stage 9. Media Hardening

Срок:
- `4-8 недель`

Что добавляем:
- room policies
- moderation
- quality control
- metrics
- tracing/logging
- load testing
- horizontal scaling
- fallback/reconnect strategies
- recording later if needed

Результат:
- платформа готова к росту от маленьких комнат к большим сценариям

### Deferred Late-Roadmap Auth Product Work

This checkpoint exists for auth-product capabilities that are useful but not required to finish provider replacement:
- `email verification`
- `password reset`
- similar late auth-product completeness tasks

This checkpoint should happen near the end of the roadmap, right before the final decision on `Next.js -> React`.

### Stage 10. Decide on `Next.js`

Срок:
- после стабилизации backend

Критерий:
- если `Next` остаётся просто удобным web-shell, можно его оставить
- если он всё ещё мешает desktop-first модели и не даёт ценности, тогда переходить на `React + Vite`

Вывод:
- это последний крупный шаг, а не первый

## 11. Sprint-Based Execution Plan

### Sprint 1. Architecture and Boundaries

Цель:
- перестать принимать архитектурные решения по месту

Что делаем:
- создаём `docs/roadmap/ARCHITECTURE.md`
- создаём `docs/roadmap/BOUNDARIES.md`
- описываем backend modules
- фиксируем contracts:
  - `AuthProvider`
  - `StorageProvider`
  - `MediaProvider`
  - `RealtimeProvider`
- проектируем будущую monorepo-структуру

Выход:
- target architecture согласована

### Sprint 2. Frontend Decoupling

Цель:
- чтобы UI перестал знать напрямую про внешние платформы

Что делаем:
- вводим адаптеры для:
  - auth
  - storage
  - media
- сводим API-вызовы в единый слой
- выносим общие domain types
- выносим shared SDK contracts

Выход:
- UI работает через внутренние интерфейсы

### Sprint 3. `Nest` Skeleton

Цель:
- завести отдельный backend-контур

Что делаем:
- создаём `apps/api`
- поднимаем:
  - config
  - logger
  - health
  - base modules
  - websocket gateway skeleton
- подключаем текущую БД

Выход:
- `Nest` стартует и собирается

### Sprint 4. Move Invites and Server Domain

Цель:
- вынести первый реальный кусок логики из `Next`

Что делаем:
- переносим:
  - invites
  - servers
  - channels
  - members
- переносим права/роли
- переносим соответствующие socket events

Выход:
- создание сервера, каналы, инвайты и участники работают через `Nest`

### Sprint 5. Messages and Realtime

Цель:
- вытащить основную коммуникационную механику

Что делаем:
- переносим:
  - messages
  - direct messages
  - socket transport

Выход:
- основной runtime domain живёт в `Nest`

### Sprint 6. Auth Foundation

Цель:
- подготовить replacement для `Clerk`

Что делаем:
- проектируем auth flow
- создаём auth module
- заводим session/user/auth schema

Выход:
- есть рабочий auth prototype

### Sprint 7. Remove `Clerk`

Цель:
- убрать внешний auth dependency из core

Что делаем:
- меняем current user/profile resolution
- меняем middleware и protected routes
- меняем sign-in/sign-up flows

Выход:
- auth работает без `Clerk`

### Sprint 8. Storage Foundation

Цель:
- убрать storage lock-in

Что делаем:
- вводим `StorageProvider`
- делаем backend storage service
- сначала можно оставить `UploadThing` под капотом
- потом добавить `MinIO`

Выход:
- storage provider переключаем без ломки UI

### Sprint 9. Optional Removal of `UploadThing`

Цель:
- убрать dependency полностью, если это подтверждённый приоритет

Что делаем:
- переключаем backend на `MinIO` или иной S3-compatible storage

Выход:
- `UploadThing` больше не нужен

### Sprint 10. `Postgres`

Цель:
- перевести persistence на целевую БД

Что делаем:
- адаптируем `Prisma`
- поднимаем `Postgres`
- делаем migration/cutover

Выход:
- прод работает на `Postgres`

### Sprint 11. Media Architecture

Цель:
- подготовить почву для ухода от `LiveKit`

Что делаем:
- финализируем `MediaProvider`
- проектируем signaling/control plane
- поднимаем `coturn`
- выбираем SFU stack

Выход:
- есть tech design media stack

### Sprint 12. Media MVP

Цель:
- получить первую рабочую версию без `LiveKit`

Что делаем:
- `1:1`
- маленькие комнаты
- audio/video
- screen share
- reconnect

Выход:
- несколько пользователей могут стабильно созваниваться без `LiveKit`

### Sprint 13+. Media Hardening

Цель:
- подготовка к росту

Что добавляем:
- moderation
- observability
- metrics
- tracing
- room policies
- scaling strategy
- failure recovery
- load testing

## 12. First Migration Targets by Current Paths

### Move First into `packages/app-core`

Сначала логично вытаскивать не UI, а контракты и доменные утилиты.

Кандидаты:
- `src/lib/shared/utils/routes.ts`
- `src/lib/shared/utils/upload-file.ts`
- `src/lib/shared/utils/conversation.ts`
- `src/lib/shared/utils/get-profile-name.ts`
- `src/lib/shared/data-access/server/models/serverModalSchema.ts`
- `src/lib/shared/data-access/chat/models/messageFileSchema.ts`
- `src/lib/channel/data-access/models/channelFormSchema.ts`
- `src/lib/chat/data-access/models/chatInputSchema.ts`

### Move First into `packages/sdk`

Кандидаты:
- `src/lib/shared/data-access/server/api.ts`
- `src/lib/shared/data-access/server/api-socket.ts`
- `src/lib/shared/data-access/user/api.ts`
- `src/lib/shared/data-access/chat/use-chat-query.ts`
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
- `src/lib/shared/data-access/navigation-sidebar/use-sidebar-socket.ts`
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`

### Move First into `packages/ui`

Кандидаты:
- весь `src/lib/shared/ui/*`
- часть `src/lib/shared/features/*`, которая не зависит от текущего runtime

Первыми кандидатами обычно являются:
- `button.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `input.tsx`
- `select.tsx`
- `toast.tsx`
- `tooltip.tsx`
- `spinner.tsx`
- `avatar.tsx`
- `badge.tsx`

### Leave in `apps/web` for Now

Эти файлы лучше не трогать в первую волну:
- `src/app/layout.tsx`
- `src/app/(auth)/*`
- `src/app/(invite)/*`
- `src/app/(main)/*`
- `src/middleware.ts`
- `src/app/api/*`
- `src/pages/api/*`

Они являются текущим runtime shell и должны переноситься постепенно, не первыми.

### Future Move into `apps/api`

Кандидаты на перенос в `Nest`:
- remaining compatibility HTTP handlers in `src/pages/api/socket/*`
- `src/app/api/servers/*`
- `src/app/api/channels/*`
- `src/app/api/messages/*`
- `src/app/api/direct-messages/*`
- `src/app/api/members/*`
- `src/app/api/server-upload/*`
- `src/app/api/livekit/*`

### Keep in `apps/desktop`

Эти файлы со временем должны жить отдельно:
- весь `electron/*`
- `global.d.ts` desktop bridge fragments
- desktop-specific handlers and helpers

## 13. What Not to Do

- не переносить сначала `Next -> React`
- не делать одновременно `Nest + Auth + Postgres + Media`
- не писать свой WebRTC-стек с нуля
- не превращать backend сразу в distributed system
- не трогать БД до появления централизованного backend
- не делить repo на несколько repos слишком рано

## 14. Practical Immediate Start

Если начинать прямо сейчас, первый пакет работ должен быть таким:

1. Описать target architecture и boundaries
2. Ввести `AuthProvider`, `StorageProvider`, `MediaProvider`, `RealtimeProvider`
3. Поднять `Nest` skeleton
4. Перенести в `Nest`:
   - invites
   - servers
   - channels
   - members
5. После этого начинать migration away from `Clerk`

## 15. Rough Timeline

- stages `0-2`: `2-4 недели`
- stages `3-5`: `4-8 недель`
- stage `6`: `1-2 недели`
- stages `7-9`: `2-4+ месяца`
- stage `10`: отдельно, когда backend стабилен

Итог:
- backend/auth/storage migration — среднесрочный проект
- замена `LiveKit` — отдельное тяжёлое направление

## 16. Final Recommendation

Проекту нужен не ещё один rewrite, а управляемый переход к:
- `desktop-first modular platform`
- `Nest modular monolith`
- adapter-based integration
- своему auth/storage/media control plane

Это даст:
- контроль
- заменяемость зависимостей
- понятные границы
- нормальную базу для долгосрочного роста
