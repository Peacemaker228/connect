# Segment Brief 200: Customer Auth Session Idle Boundary Hardening

## Metadata

- Branch: `feature/customer-auth-session-idle-boundary-hardening`
- Base: latest `core/reborn`
- Segment: `customer-auth-session-idle-boundary-hardening`
- Type: `P0 customer-priority auth/session runtime reliability`
- Status: `pass / implemented locally; manual idle smoke pending`
- Commit policy: do not commit automatically; provide PowerShell-safe `git add` and `git commit` commands in the handoff

## Context

`staging.ax-connect.ru` is an active working stand for an external team. After idle, the app could temporarily render a half-authenticated shell:

- account menu fallback showed `AX` / missing identity;
- current user could appear in their own member list;
- server rail unread badges could update while channel/member row badges did not;
- a later refresh/refetch recovered identity and row badges.

Segment 197 hardened the client shell against missing profile/current-member state, but the deeper boundary remained in backend auth/session:

- access-token cookie TTL defaults to 15 minutes;
- `AuthService.getRequestContext()` intentionally swallows expired/invalid access-cookie `UnauthorizedException` and can fall through to anonymous context;
- `GET /api/auth/session` then returned `200` with `profile: null`;
- the SDK refresh-on-401 path did not deterministically run because the response was not `401`.

This was an auth/session recovery boundary bug, not an unread badge bug.

## Goal

Make long-idle auth/session recovery deterministic:

- if the access cookie expired but the refresh cookie is still valid, `GET /api/auth/session` refreshes and returns an authenticated session snapshot;
- if refresh is missing/invalid/expired, the session read returns a clear anonymous snapshot without clearing cookies from this GET path, avoiding cross-tab refresh-token rotation races;
- the app shell does not render normal member/account/unread UI until profile and current member are valid again.

## Scope

In scope:

- backend-owned `/api/auth/session` cookie recovery path;
- reuse of existing `AuthService.refreshSession()` and `AuthCookiesService`;
- preserving `/api/auth/session/refresh` and SDK refresh-on-401 behavior;
- client cache reconciliation after current member recovery;
- docs/status updates.

Out of scope:

- broad auth rewrite;
- new auth provider/library;
- DB schema/migrations;
- staging DB reset;
- storage/S3 work;
- WebRTC/media/TURN/LiveKit work;
- mentions/replies/link previews;
- notification sound changes;
- production Postgres migration.

## Implementation

Backend:

- added `AuthService.readSessionWithCookieRecovery()`;
- authenticated contexts still return the normal session snapshot;
- anonymous contexts with no refresh cookie return the normal anonymous snapshot;
- anonymous contexts with a refresh cookie call the existing `refreshSession()` path;
- successful refresh rotates cookies and returns `exchangeSnapshot.session`;
- failed refresh due `UnauthorizedException` returns anonymous without clearing cookies from session read;
- other refresh errors still propagate as real backend errors.

Controller:

- `GET /api/auth/session` is now passthrough-response aware;
- applies issued access/refresh cookies after recovery;
- deliberately does not clear cookies when refresh recovery fails, because a parallel tab may have already rotated the refresh cookie successfully and a late failed response must not erase that session.

Client:

- kept `refreshBackendSession()` single-flight behavior and SDK refresh-on-401 unchanged;
- kept Segment 197 profile/current-member shell gating unchanged;
- when `currentMemberId` becomes available, invalidates server-scoped unread, global unread, current server, and server list caches so row badges and subscriptions reconcile after identity recovery.

## Behavior Before / After

Before:

- expired access cookie could produce anonymous `200 profile:null`;
- SDK 401 refresh did not run;
- `useGetProfile()` had to perform a compensating refresh;
- during the gap, UI could enter a half-authenticated shell if profile/current member was missing.

After:

- `GET /api/auth/session` self-heals with the refresh cookie when possible;
- successful recovery returns authenticated `profile` and rotates cookies;
- invalid refresh returns explicit anonymous state without clearing cookies from the session-read response;
- frontend still treats missing profile/current member as a bounded recovering/auth-expired state instead of normal shell state;
- recovered current member triggers unread/server cache reconciliation.

## Acceptance Notes

- `/api/auth/session` now refreshes through the refresh cookie.
- Existing `/api/auth/session/refresh` endpoint remains unchanged.
- Existing SDK refresh-on-401 behavior remains unchanged.
- `GET /api/auth/session` does not clear cookies on refresh failure; explicit logout remains the cleanup path.
- Unread realtime event contracts and socket privacy keys are unchanged.
- Direct unread remains private on `member:${memberId}:direct-unread`.
- Active chat mark-read and own-message negative behavior are unchanged.

## Verification

Passed locally:

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

Focused auth/session smoke:

- attempted to start a temporary local API on a separate port with `AUTH_ACCESS_TOKEN_TTL_SECONDS=1`;
- blocked before endpoint smoke because this shell has no `DATABASE_URL` in process env, so Prisma could not initialize;
- an already-running local API existed on port `4000`, but it was not used as proof because it likely predated this code change;
- no staging/prod database or secret values were used or printed.

Manual idle smoke:

- pending two-user browser smoke with access-token expiry / valid refresh cookie;
- pending truly expired refresh smoke.

## Handoff Requirements

Return:

- root cause confirmed;
- exact backend auth/session behavior before/after;
- changed files;
- whether `/api/auth/session` now refreshes via refresh cookie;
- whether frontend auth boundary/provider changed;
- whether unread/socket behavior changed;
- verification results;
- manual idle smoke status;
- remaining risk;
- PowerShell-safe git commands.
