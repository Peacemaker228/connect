# Segment Brief 055: Prisma Boundary Inventory

## Segment ID

`prisma-boundary-inventory`

## Branch

`wave/stage6-prisma-boundary-prep`

## Goal

Prepare a controlled `Stage 6 / MySQL -> Postgres` path without starting the database migration.

This segment is an inventory and planning handoff only. It must not change `DATABASE_URL`, the Prisma datasource provider, schema provider, migrations, or runtime behavior.

## Required Reading

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/waves/PRISMA_BOUNDARY_PREP.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- this brief

## Code Search Evidence

Commands used for this inventory:

```powershell
rg -n '@prisma/client' src apps packages messages -g '!node_modules/**'
rg -n 'from [''"].*utils/db[''"]|from [''"].*/db[''"]|from [''"].*@/lib/shared/utils/db[''"]' src apps packages -g '!node_modules/**'
rg -n '\bdb\.' src apps packages -g '!node_modules/**' -g '!dist/**' -g '!build/**'
rg -n 'PrismaService|private readonly prisma|this\.prisma|prisma\.' apps/api/src -g '!node_modules/**'
```

## Inventory

### Backend-owned Prisma usage in `apps/api`

Current backend DB ownership is centralized through:

- `apps/api/src/common/database/prisma.service.ts`
- `apps/api/src/common/common.module.ts`

Backend modules using `PrismaService` directly:

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth-identities.service.ts`
- `apps/api/src/modules/auth/auth-sessions.service.ts`
- `apps/api/src/modules/channels/channels.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `apps/api/src/modules/invites/invites.service.ts`
- `apps/api/src/modules/members/members.service.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/servers/servers.service.ts`

This is the expected long-term owner area for Prisma during Stage 6.

### Temporary Next server-side Prisma reads

`src/lib/shared/utils/db.ts` still owns a `PrismaClient` singleton for the web shell.

Direct `db` callers found:

- `src/app/(setup)/page.tsx`
- `src/app/(invite)/(routes)/invite/[inviteCode]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/layout.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `src/lib/shared/utils/conversation.ts`

These are server-side reads/guards and conversation bootstrap helpers in the Next shell. They can remain temporarily, but they are the main boundary cleanup target before a clean Stage 6 cutover.

### Shared/client/sdk imports from `@prisma/client`

`packages/sdk` still imports Prisma model/enum types:

- `packages/sdk/src/queries/chat.ts`
- `packages/sdk/src/queries/profile.ts`
- `packages/sdk/src/queries/server.ts`
- `packages/sdk/src/mutations/channel.ts`
- `packages/sdk/src/mutations/membership.ts`
- `packages/sdk/src/mutations/message.ts`
- `packages/sdk/src/mutations/server.ts`

Shared/UI/runtime imports from `@prisma/client` also remain in:

- `src/types.ts`
- `messages/en/common/index.ts`
- `messages/ru/common/index.ts`
- `src/lib/shared/utils/backend-auth-context.ts`
- `src/lib/shared/utils/role-icon-map.tsx`
- `src/lib/shared/utils/hooks/use-modal-store.ts`
- `src/lib/channel/data-access/models/channelFormSchema.ts`
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/server-list/features/server-channel.tsx`
- `src/lib/server-list/features/server-header.tsx`
- `src/lib/server-list/features/server-member.tsx`
- `src/lib/server-list/features/server-section.tsx`
- `src/lib/server-list/features/server-sidebar.tsx`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/modals/common/channel-modal.tsx`
- `src/lib/shared/features/modals/create-channel-modal.tsx`
- `src/lib/shared/features/modals/create-server-modal.tsx`
- `src/lib/shared/features/modals/delete-server-modal.tsx`
- `src/lib/shared/features/modals/edit-channel-modal.tsx`
- `src/lib/shared/features/modals/initial-modal.tsx`
- `src/lib/shared/features/modals/members-modal.tsx`

These are mostly type/enum imports rather than direct DB calls, but they couple client/shared packages to generated Prisma types.

## PrismaService / CommonModule Review

Current shape:

- `PrismaService extends PrismaClient`
- `PrismaService` is exported from global `CommonModule`
- `PrismaService` implements `OnModuleDestroy` and disconnects on shutdown

Minimal improvement to consider before Stage 6:

- add `OnModuleInit` and call `$connect()` to fail fast at API startup

This should be a separate small backend-only segment because it changes connection timing and should not be mixed with datasource/provider migration.

## What Can Stay Temporarily

- backend-owned Prisma use inside `apps/api` services
- server-side Next reads in `src/app/*` until each one has a backend/SDK replacement
- Prisma enum/model type imports in UI/shared as long as no provider/schema cutover happens in the same segment

## Stage 6 Blockers

Before a clean `MySQL -> Postgres` cutover:

- `src/lib/shared/utils/db.ts` keeps a second Prisma runtime outside `apps/api`
- `src/app/*` pages still perform direct DB reads for setup, invite validation, server routing, channel/member validation, and conversation bootstrap
- `packages/sdk` and client/shared UI still import generated Prisma types instead of app-core/API contracts
- `Wave 28 / PRISMA_BOUNDARY_PREP` now documents the first Stage 6 boundary-prep wave

## First Safe Stage 6 Segment

Start with a non-provider-changing boundary segment:

1. introduce app-core/API DTOs for `ChannelType`, `MemberRole`, `Profile`, `Server`, `Member`, `Channel`, `Message`, and direct-message chat snapshots where they are exposed to SDK/UI
2. replace `@prisma/client` imports in `packages/sdk` and client/shared UI with those contracts
3. keep backend services and Prisma schema unchanged
4. verify with typecheck only

This removes generated Prisma type leakage from the client/shared layers before any database provider migration.

## Out of Scope

- changing `DATABASE_URL`
- changing Prisma datasource provider from `mysql` to `postgresql`
- writing or applying data migrations
- moving every Next server-side read in one segment
- changing runtime behavior

## Handoff

- Prisma runtime ownership is already mostly backend-owned in `apps/api`
- the remaining pre-Stage6 work is boundary cleanup, not a database migration yet
- first safe segment: remove `@prisma/client` imports from `packages/sdk` and browser/shared UI by introducing stable app-core/API contracts
- only after that should a second segment move Next server-side reads behind backend/SDK endpoints one route family at a time
