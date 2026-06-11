# Segment Brief 197: Customer Idle Profile Reconnect Sidebar State Fix

## Metadata

- Branch: `feature/customer-idle-profile-reconnect-sidebar-state-fix`
- Base: latest `core/reborn`
- Segment: `customer-idle-profile-reconnect-sidebar-state-fix`
- Type: customer-priority core runtime stability fix
- Priority: `P0/P1 staging incident`
- Status: `pass / implemented locally; manual idle smoke pending`
- Commit policy: do not commit automatically; provide PowerShell-safe `git add` and `git commit` commands in the handoff

## Context

`staging.ax-connect.ru` is an active working stand for an external team. After the unread/global badge rollout, an operator left two authenticated browser windows idle for several hours.

After returning, the UI temporarily entered an inconsistent authenticated shell state:

- user menu avatar fallback showed `AX`;
- user emails/names were missing;
- the current user appeared in the member list even though the current user should be filtered out;
- clicking self appeared to route/redirect strangely;
- server rail unread badges increased with incoming messages;
- channel/member row unread indicators did not update;
- after a brief blink/refetch, profile data returned and channel/member unread badges appeared.

Initial code inspection points to a profile/current-member readiness issue, not a database migration failure:

- `ServerSidebar` filters members with `profileId !== profile?.id`; if `profile` is temporarily `undefined` or `null`, the self member is not filtered out.
- `currentMember` is derived from the same profile; when missing, `useUnreadSocket` receives no `currentMemberId` and does not subscribe to server-scoped unread keys.
- global server rail unread can still update separately through global unread summary/socket state, explaining why only server badges changed.

This must be treated as a core runtime stability issue before adding sound/native notifications or other unread features.

## Required Reading

Read before changing code:

- `rules/rules.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/review/mini-review.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/ax-connect_runbook.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_194_CUSTOMER_UNREAD_REALTIME_IDEMPOTENCY_RECONNECT_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_195_CUSTOMER_GLOBAL_UNREAD_SUMMARY_AND_SERVER_BADGES.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_196_CUSTOMER_UNREAD_TAB_BADGE_AND_NEW_DIVIDER.md`

## Files To Inspect First

Use `rg` and targeted reads before editing:

- `packages/sdk/src/queries/profile.ts`
- `packages/sdk/src/api/http-client.ts`
- `packages/sdk/src/queries/server.ts`
- `packages/sdk/src/queries/unread.ts`
- `src/lib/server-list/features/server-sidebar.tsx`
- `src/lib/shared/features/backend-user-menu.tsx`
- `src/lib/navigation/features/navigation-sidebar.tsx`
- `src/lib/shared/data-access/unread/use-unread-socket.ts`
- `src/lib/shared/data-access/unread/use-global-unread-socket.ts`
- `src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts`
- `src/lib/shared/providers` and socket provider files
- auth/session backend files only if client-side inspection shows a real backend/session bug:
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/src/modules/auth/auth-cookies.service.ts`

## Goal

Fix the idle/reconnect UI state where the authenticated shell can temporarily render without a valid profile/current member.

The app must not show incorrect participant lists, incorrect account identity, or disabled server-scoped unread subscriptions while profile/session state is still recovering after idle.

## In Scope

- Make profile/current-member readiness explicit in the server sidebar.
- Prevent self member from appearing when `profile` is not ready.
- Prevent `BackendUserMenu` from showing misleading `AX` / `Account` fallback inside an otherwise authenticated app shell while profile is loading or recovering.
- Ensure server-scoped unread socket subscriptions activate/re-activate after profile/current member recovery.
- Add targeted query reconciliation on profile recovery where needed.
- Strengthen `useGetProfile` focus/reconnect behavior if necessary.
- Keep existing SDK refresh-on-401 behavior intact.
- Add small non-secret diagnostics/logging only if it helps reproduce the staging idle issue.
- Update docs with the actual root cause and result.

## Out Of Scope

Do not include:

- sound notifications;
- OS/browser Notification API;
- favicon/native app badges;
- mentions, `@all`, replies;
- link previews;
- copy/reply message actions;
- storage/S3 changes;
- WebRTC/media/coturn/mediasoup changes;
- DB schema or migrations;
- staging DB reset;
- production deploy or production Postgres work;
- LiveKit changes;
- broad auth rewrite.

## Expected Implementation Direction

Do not guess. Inspect the current flows first.

Likely safe direction:

1. Treat `profile === undefined` as loading/recovering, not as a valid shell state.
2. Treat `profile === null` carefully:
   - if it means authenticated session truly failed, existing auth routing should handle it;
   - do not render normal server/member UI as if profile were valid.
3. In `ServerSidebar`, do not derive `members`, `currentMember`, `role`, search data, or unread socket subscription from a missing profile.
4. Render a bounded loading/skeleton state for the server sidebar/account area while profile is loading/recovering.
5. When profile becomes available again:
   - current member should be resolved;
   - self should disappear from member list;
   - `useUnreadSocket` should subscribe with `currentMemberId`;
   - server-scoped unread summary should reconcile from backend.
6. Keep global unread/server rail behavior unchanged.
7. Avoid unbounded retry loops, intervals, or polling.

If the root cause is confirmed to be profile query caching a temporary `null` after idle, consider a minimal SDK-level fix:

- `refetchOnWindowFocus`;
- `refetchOnReconnect`;
- careful retry/refetch behavior for `/api/auth/session`;
- preserving last good profile during a transient refetch, if compatible with current auth behavior.

But do not mask a real expired session forever. If the session is genuinely gone, route to login or show a real auth-expired state according to existing app behavior.

## Acceptance Criteria

Core behavior:

- After idle/reconnect, the app never shows the current user inside the member list because profile is temporarily missing.
- User menu does not show misleading `AX` / `Account` fallback while profile is merely loading/recovering.
- Once profile recovers, server sidebar shows the correct current user state without page reload.
- Server-scoped unread row badges recover after profile/currentMember recovery.
- Global server rail unread behavior remains unchanged.
- Active channel/conversation mark-read behavior remains unchanged.
- Own messages still do not create own unread.
- Direct unread remains private on `member:${memberId}:direct-unread`.

Regression:

- Normal first-load server sidebar still works.
- Login/session flow still works.
- If the user is truly unauthenticated, the app does not stay in an infinite fake loading state.
- Segment 196 `Новое` divider and title unread count still work.

## Manual Smoke

Run locally if possible, then staging after merge/deploy.

Two authenticated users / two browser contexts:

1. Open the same server/channel in both windows.
2. Confirm each user does not see themselves in the member list.
3. Confirm account menu shows correct name/email/avatar fallback.
4. Leave both windows idle long enough to trigger the prior issue if practical.
5. Return to both windows without hard refresh.
6. Before interacting heavily, inspect:
   - account menu identity;
   - member list self-filtering;
   - server rail unread;
   - channel/direct unread row badges;
   - console/network errors.
7. Send messages both directions.
8. Confirm server rail and channel/direct row badges update correctly.
9. Open the unread channel/DM and confirm badges clear.
10. Reload and confirm state remains correct.

If the issue appears during manual smoke, collect redacted evidence:

- screenshots of UI state;
- browser console errors;
- Network statuses for:
  - `/api/auth/session`
  - `/api/servers`
  - `/api/servers/:serverId`
  - `/api/unread/servers/:serverId/summary`
  - `/api/unread/servers/summary`
- socket connection status if visible.

Do not paste cookies, tokens, secret env values, or full private payloads into docs.

## Verification Commands

Run locally on PowerShell:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

If the implementation touches auth/session backend behavior, also run focused auth/session smoke where available and document what was or was not run.

## Docs To Update

Add or update:

- this brief;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/roadmap/STAGE_STATUS.md`.

Do not change WebRTC/Stage 9 docs except to preserve the paused status.

## Implementation Result

Status: `pass / implemented locally; manual idle smoke pending`

Root cause found:

- The backend auth/session endpoint itself was not changed.
- Client inspection showed an idle auth recovery gap: if an access cookie is present but expired, backend auth context can fall back to an anonymous session snapshot and `/api/auth/session` can return `200` with `profile: null`.
- The SDK refresh-on-401 interceptor does not run for that anonymous `200` response, so `useGetProfile` could cache `null` until a later refetch/recovery path.
- `ServerSidebar` treated missing `profile` as a valid render state: it filtered members with `profileId !== profile?.id`, so the current user was not filtered out while `profile` was `undefined`/`null`.
- The same missing profile prevented `currentMember` resolution, so `useUnreadSocket` had no `currentMemberId` and did not subscribe to server-scoped unread keys; global unread/server rail could still update through the separate global summary path.

Changed runtime behavior:

- `useGetProfile` now attempts one cookie-session refresh when `/api/auth/session` returns no profile, then reads the refreshed profile from the exchange response or a follow-up session read.
- The existing SDK refresh-on-401 behavior is preserved and now shares one `refreshBackendSession()` promise with explicit profile recovery and manual `refreshSession()`, avoiding competing refresh calls.
- `useGetProfile` explicitly refetches on browser focus and reconnect.
- `ServerSidebar` no longer derives `members`, `currentMember`, `role`, search data, or normal account UI until both `profile` and `currentMember` are available.
- While profile/current member is recovering, the sidebar renders a bounded loading/error/auth-expired state instead of misleading member rows or `AX`/`Account`.
- When `currentMember` becomes available, the server-scoped unread summary is invalidated so channel/direct row badges reconcile from the backend.
- `BackendUserMenu` shows a neutral disabled loading avatar when no profile snapshot props are available, instead of deriving `AX` / `Account` from missing data.

Changed files:

- `packages/sdk/src/api/http-client.ts`
- `packages/sdk/src/actions/auth.ts`
- `packages/sdk/src/queries/profile.ts`
- `src/lib/server-list/features/server-sidebar.tsx`
- `src/lib/shared/features/backend-user-menu.tsx`
- `docs/delegation/briefs/SEGMENT_BRIEF_197_CUSTOMER_IDLE_PROFILE_RECONNECT_SIDEBAR_STATE_FIX.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

Not touched:

- backend auth/session controller/service/cookie behavior;
- unread realtime event contracts or socket hook subscription logic;
- global unread/server rail behavior;
- database schema/migrations;
- storage, media/WebRTC/LiveKit, production/staging infra.

Verification:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Result: all commands passed locally.

Manual smoke:

- authenticated two-user idle/reconnect smoke is still pending; no ready two-user authenticated local/staging browser sessions were available in this shell.
- staging smoke should focus on profile recovery, member self-filtering, account identity, server rail unread, channel/direct row unread badges, clear-on-open, and Segment 196 title/divider regression.

## Handoff Requirements

Return:

- root cause found;
- changed files;
- exact runtime behavior before/after;
- whether auth/session backend was touched;
- whether unread realtime/socket behavior was touched;
- verification command results;
- manual smoke status;
- remaining risks;
- PowerShell-safe git add/commit commands.

## Commit Command Format

Do not use Bash continuations in PowerShell.

Return commands in this style:

```powershell
$files = @(
  'path/to/file-a.ts',
  'path/to/file-b.tsx',
  'docs/delegation/briefs/SEGMENT_BRIEF_197_CUSTOMER_IDLE_PROFILE_RECONNECT_SIDEBAR_STATE_FIX.md',
  'docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md',
  'docs/roadmap/STAGE_STATUS.md'
)
git add -- $files
git commit -m "fix(customer): stabilize profile recovery after idle"
```
