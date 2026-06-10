# Segment Brief 185: Customer Server Edit Realtime Propagation Fix

## Metadata

- Branch: `feature/customer-server-edit-realtime-propagation-fix`
- Segment: `customer-server-edit-realtime-propagation-fix`
- Type: scoped realtime/cache UX fix
- Status: `pass / implemented`

## Context

Segment 184 fixed the editing user's local cache after server edit, but other connected participants still needed realtime propagation so server names/settings did not stay stale until a manual reload or unrelated refetch.

This segment adds a focused server update realtime event and client cache reconciliation for server list/sidebar/header state. It does not change storage, media, unread state, mentions, copy/reply, schema, migrations, production, or staging.

## Event Contract

Event key:

```ts
server:${serverId}:profile
```

Payload:

```ts
{
  action: 'server_updated',
  server: {
    id: string
    name?: string
    imageUrl?: string
  }
}
```

Shared contract:
- `packages/app-core/src/contracts/server-slice-realtime.ts`

Backend event helper:
- `apps/api/src/modules/realtime/realtime.events.ts`

## Backend Emit Location

- `apps/api/src/modules/servers/servers.controller.ts`
  - `PATCH /api/servers/:serverId` now awaits successful `ServersService.updateServer`;
  - after success, emits `createServerUpdatedRealtimeEvent(serverId, { id, name, imageUrl })`;
  - returns the existing server update response.

The existing update permission check remains in `ServersService.updateServer`. No DB schema or mutation contract change was made.

## Client Listener / Cache Update

- `src/lib/shared/data-access/navigation-sidebar/use-sidebar-socket.ts`
  - listens to `server:${serverId}:profile` for the current server sidebar/header;
  - updates `['servers']` and `['server', serverId]` caches.
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`
  - subscribes to `server:${id}:profile` for server ids already present in the accessible `['servers']` cache;
  - updates `['servers']` and matching `['server', serverId]` caches only if the server is already known locally.
- `src/lib/navigation/features/navigation-sidebar.tsx`
  - passes the current accessible server list into `useServersSocket`.

Unauthorized/unrelated clients do not apply the event because the client only subscribes based on server ids already present in its accessible server list and only updates caches that already contain the server.

## Behavior

- User A edits server name/settings.
- User A still gets the Segment 184 local mutation cache update.
- Backend emits `server_updated` after successful edit.
- User B, if connected and already has that server in the accessible server list/current server cache, receives the event and reconciles sidebar/header/list cache without a reload.
- Repeated edits map by `server.id`, so no duplicate list entries are created.

## Files Changed

- `packages/app-core/src/contracts/server-slice-realtime.ts`
  - added server profile realtime action/payload/key/helper.
- `apps/api/src/modules/realtime/realtime.events.ts`
  - added backend `server:${serverId}:profile` key and `createServerUpdatedRealtimeEvent`.
- `apps/api/src/modules/servers/servers.controller.ts`
  - emits server update event after successful update.
- `src/lib/shared/data-access/navigation-sidebar/use-sidebar-socket.ts`
  - listens for current server profile updates and reconciles current detail/list caches.
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`
  - listens for profile updates for accessible servers and reconciles list/detail caches.
- `src/lib/navigation/features/navigation-sidebar.tsx`
  - passes accessible servers into the socket hook.
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
  - recorded this segment result and next recommended segment.
- `docs/roadmap/STAGE_STATUS.md`
  - recorded this segment under Wave 35.
- `docs/delegation/briefs/SEGMENT_BRIEF_185_CUSTOMER_SERVER_EDIT_REALTIME_PROPAGATION_FIX.md`
  - added this handoff brief.

## Verification

Passed:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Not run:

- Manual/local two-session smoke was not completed in this shell because no two authenticated local user sessions/workspace were available.
- Existing Playwright browser specs were not run because the available specs are SFU/media smoke tests, and media/WebRTC is out of scope.
- Packaged desktop build was not run; desktop uses the shared Next UI path and the safe desktop config check passed.

## Intentionally Not Touched

- DB schema or Prisma migrations;
- unread notifications/read state;
- mentions;
- copy/reply implementation;
- storage/S3/env configuration;
- media/WebRTC/coturn/mediasoup/LiveKit;
- production or staging server commands;
- broad realtime auth/room refactor.

## Result

- server edit realtime propagation: `pass / implemented`
- backend event: `server_updated` on `server:${serverId}:profile`
- frontend cache reconciliation: `pass / implemented`
- two-user verification: `not run locally; needs authenticated two-session smoke`
- staging: `untouched`
- production: `untouched`

## Recommended Next Segment

`customer-unread-message-badges-and-sound-plan`

Rationale:
- server edit propagation is now covered; unread badges/sound are the next customer-priority item and need backend/read-state/realtime planning before implementation.
