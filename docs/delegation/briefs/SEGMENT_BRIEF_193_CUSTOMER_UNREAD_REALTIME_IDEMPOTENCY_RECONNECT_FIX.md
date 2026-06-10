# Segment Brief 193: Customer Unread Realtime Idempotency and Reconnect Fix

## Metadata

- Branch: `feature/customer-unread-realtime-idempotency-reconnect-fix`
- Base: `core/reborn` after Segment 192 docs are merged
- Segment: `customer-unread-realtime-idempotency-reconnect-fix`
- Type: customer-priority unread realtime correctness fix
- Status: `ready for implementation`

## Goal

Stabilize the current unread badge realtime behavior before expanding unread into global server badges, browser title indicators, sound, desktop notifications, or mention/reply attention.

The observed local issue:

- two browsers with two different users initially showed unread badges correctly;
- after idle time, one direction of unread updates could stop showing;
- a single incoming message could increment the badge as if two events were received;
- refreshing both browser sessions restored correct state.

This means backend read-state is likely correct, but the live client cache can drift from backend truth after idle/reconnect/HMR/session churn.

## Current Implementation Context

Relevant files:

- `src/lib/shared/data-access/unread/use-unread-socket.ts`
- `packages/sdk/src/queries/unread.ts`
- `packages/app-core/src/contracts/message-slice-realtime.ts`
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/unread/unread.service.ts`
- `src/lib/server-list/features/server-sidebar.tsx`
- `src/lib/server-list/features/server-channel.tsx`
- `src/lib/server-list/features/server-member.tsx`

Current realtime transport:

- Socket.IO, not SSE;
- Socket.IO may internally fall back to polling if WebSocket is unavailable.

Current event keys:

- channel unread: `server:${serverId}:unread`;
- direct unread: `member:${memberId}:direct-unread`.

Current client behavior:

- unread socket handlers increment React Query cache with `unreadCount + payload.unreadCount`;
- active chat attempts to mark read when an incoming unread event targets the currently open chat;
- reload restores correct state because it refetches backend summary.

## Likely Root Causes To Verify

Do not assume only one cause. Inspect real code and reproduce.

Candidate causes:

- duplicate Socket.IO listeners after idle/reconnect/HMR/remount;
- event handlers incrementing cache without idempotency;
- missing dedupe by `messageId`;
- missed summary refetch after socket reconnect or browser focus;
- race between mark-read mutation and incoming unread event for the active chat;
- stale React Query summary after session refresh/reconnect;
- multiple mounted sidebars or hooks subscribing to the same keys.

## Required Implementation Direction

Make unread realtime **idempotent and reconnect-safe**.

Expected changes:

- dedupe unread realtime events by `messageId` per event scope/key;
- prevent one message from incrementing the same unread summary more than once in a client session;
- refetch or invalidate unread summary on Socket.IO reconnect/connect recovery;
- refetch or invalidate unread summary on browser focus after idle;
- keep backend summary as source of truth;
- keep optimistic cache update only as a fast path, not final authority;
- preserve sender/own-message negative behavior;
- preserve active chat mark-read behavior;
- avoid broad realtime transport refactor.

Preferred shape:

- add a small client-side processed-event guard for unread messages;
- debounce summary invalidation if needed to avoid network spam;
- use `queryClient.invalidateQueries({ queryKey: getUnreadSummaryQueryKey(serverId) })` or equivalent targeted refetch after reconnect/focus;
- ensure cleanup removes listeners exactly once;
- keep direct unread private on `member:${memberId}:direct-unread`.

## Acceptance Criteria

Local two-browser smoke:

- user A and user B are logged in different browsers or browser contexts;
- channel unread works A -> B and B -> A;
- direct unread works A -> B and B -> A;
- one message increments unread by exactly `1`;
- repeated idle/reconnect/focus does not double-increment;
- refresh still restores the same values;
- opening the active chat clears unread;
- own messages do not create own unread;
- no privacy regression: direct unread is not emitted as server-wide payload.

Recommended focused smoke cases:

1. Channel message A -> B while B is in another channel.
2. Channel message B -> A while A is in another channel.
3. Direct message A -> B while B is not in that DM.
4. Direct message B -> A while A is not in that DM.
5. Leave both browsers idle, then send one message and confirm only one increment.
6. Force reconnect/reload one browser and confirm summary reconciles from backend.
7. Open unread channel/DM and confirm badge clears.

## Verification

Run at minimum:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Also run/manual verify:

- local two-browser unread smoke above;
- browser console has no duplicate listener/reconnect errors;
- network summary refetch after reconnect/focus is bounded and not spammy.

## Out Of Scope

- global unread summary across servers;
- browser tab badge;
- notification sound/mute;
- desktop native notifications;
- `New` divider;
- `@user`, `@all`, reply attention;
- WebRTC/media;
- storage/S3;
- production Postgres migration;
- staging DB reset.

## Next Segment After This Passes

`customer-global-unread-summary-and-server-badges`

Reason:
- global unread and server rail badges should be built only after the current per-server/direct unread realtime path is idempotent and reconnect-safe.
