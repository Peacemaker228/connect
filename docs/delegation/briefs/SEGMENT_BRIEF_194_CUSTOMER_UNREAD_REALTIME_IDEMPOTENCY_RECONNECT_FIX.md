# Segment Brief 194: Customer Unread Realtime Idempotency Reconnect Fix

## Metadata

- Branch: `feature/customer-unread-realtime-idempotency-reconnect-fix`
- Base: latest `core/reborn`
- Segment: `customer-unread-realtime-idempotency-reconnect-fix`
- Type: customer-priority unread realtime correctness fix
- Status: `pass / implemented locally; manual two-browser smoke pending`

## Goal

Make current per-server/channel and per-member/direct unread realtime idempotent and reconnect-safe before expanding unread into global server badges or notification surfaces.

## Problem

Local two-browser testing showed live unread cache drift after idle/reconnect:

- one direction could stop showing unread until reload;
- one incoming message could increment a badge as if two events were processed;
- reload restored the correct backend unread summary.

This pointed to client realtime/cache drift, not DB migration/read-state failure.

## Changes

Changed:

- `src/lib/shared/data-access/unread/use-unread-socket.ts`

Implemented:

- bounded client-side dedupe for unread realtime events by:
  - current member id;
  - server id;
  - event scope;
  - `messageId`;
- dedupe map TTL: 5 minutes;
- dedupe cap: 500 processed unread events;
- duplicate events no longer increment the same React Query unread summary cache twice;
- targeted backend-summary reconciliation through `queryClient.invalidateQueries({ queryKey: getUnreadSummaryQueryKey(serverId) })`;
- reconciliation is debounced to avoid listener/reconnect/focus spam;
- reconciliation runs after:
  - processed unread realtime events;
  - duplicate unread realtime events;
  - socket `connect`;
  - Socket.IO manager `reconnect`;
  - browser `focus`;
  - `visibilitychange` back to `visible`;
- active channel/direct behavior is preserved:
  - incoming message in active channel marks channel read instead of creating a badge;
  - incoming message in active DM marks conversation read instead of creating a badge;
- own-message negative behavior is preserved;
- direct unread remains private on `member:${memberId}:direct-unread`.

## Design Notes

The optimistic `+payload.unreadCount` cache update remains only a fast path. Backend unread summary remains the source of truth and is refetched after event/reconnect/focus paths.

The dedupe guard is module-scoped rather than hook-instance-scoped so a duplicate mounted sidebar or HMR/remount listener cannot increment the same browser-session cache twice for the same message id.

## Not Included

- global unread summary;
- server rail badges;
- browser tab badge;
- notification sound or mute setting;
- desktop native notification;
- `New` divider;
- `@user`, `@all`, reply attention;
- WebRTC/media;
- storage/S3;
- migrations;
- staging or production DB changes.

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

Note:

- the first `tsc` run was started in parallel with `next build` and failed because `.next/types` was being regenerated;
- rerunning `tsc` after `build:web` completed passed.

Manual smoke still required:

- channel A -> B unread increments exactly by `1`;
- channel B -> A unread increments exactly by `1`;
- direct A -> B unread increments exactly by `1`;
- direct B -> A unread increments exactly by `1`;
- own messages do not create own unread;
- opening channel/DM clears badge;
- idle/reconnect/focus does not double-increment;
- reload matches live UI state.

## Next Segment

`customer-global-unread-summary-and-server-badges`
