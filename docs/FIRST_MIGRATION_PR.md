# First Migration PR

## Цель

Первый миграционный PR после создания каркаса не должен ломать текущий runtime.

Задача этого PR:
- начать выстраивать архитектурные границы
- не менять production behavior
- не трогать критичные runtime-entrypoints

## Что переносим в первую очередь

### В `packages/app-core`

- `src/lib/shared/utils/routes.ts`
- `src/lib/shared/utils/upload-file.ts`
- `src/lib/shared/utils/conversation.ts`
- `src/lib/shared/utils/get-profile-name.ts`
- `src/lib/shared/data-access/server/models/serverModalSchema.ts`
- `src/lib/shared/data-access/chat/models/messageFileSchema.ts`
- `src/lib/channel/data-access/models/channelFormSchema.ts`
- `src/lib/chat/data-access/models/chatInputSchema.ts`

## Что переносим после этого

### В `packages/sdk`

- `src/lib/shared/data-access/server/api.ts`
- `src/lib/shared/data-access/server/api-socket.ts`
- `src/lib/shared/data-access/user/api.ts`
- `src/lib/shared/data-access/chat/use-chat-query.ts`
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
- `src/lib/shared/data-access/navigation-sidebar/use-sidebar-socket.ts`
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`

### В `packages/ui`

Первая безопасная волна:
- `src/lib/shared/ui/button.tsx`
- `src/lib/shared/ui/dialog.tsx`
- `src/lib/shared/ui/dropdown-menu.tsx`
- `src/lib/shared/ui/form.tsx`
- `src/lib/shared/ui/input.tsx`
- `src/lib/shared/ui/select.tsx`
- `src/lib/shared/ui/toast.tsx`
- `src/lib/shared/ui/tooltip.tsx`
- `src/lib/shared/ui/spinner.tsx`
- `src/lib/shared/ui/avatar.tsx`
- `src/lib/shared/ui/badge.tsx`

## Что пока не трогаем

Не трогаем в первый реальный PR:
- `src/app/*`
- `src/pages/api/*`
- `src/middleware.ts`
- `electron/*`
- auth/runtime bootstrap
- current media implementation

## Что станет следующим большим шагом

После первого безопасного PR:
1. поднять `apps/api`
2. создать `Nest` skeleton
3. начать перенос `invite/server/channel/member` domain
