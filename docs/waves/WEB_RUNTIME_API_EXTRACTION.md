# Wave 26. Web Runtime API Extraction

## Goal

This wave starts `Stage 5A` after storage foundation is stable enough to stop relying on `Next` proxy/API ownership as the long-term runtime shape.

Wave task:
- reduce remaining `app/api` and `pages/api` compatibility/proxy layers
- move web runtime closer to direct backend access through `packages/sdk`
- keep current product behavior stable while the web shell becomes thinner

## Position in the Main Plan

Mapping:
- `Stage 5` storage foundation is now complete at the current roadmap level
- `Wave 26 / WEB_RUNTIME_API_EXTRACTION` is the first active wave of `Stage 5A`

Current completed slices inside this wave:
- API base URL and backend-aware HTTP client foundation
- backend CORS/origin foundation for direct web-to-backend calls
- first shared SDK extraction slices for `server`, `profile`, and `invite` access paths
- first shared feature mutation extraction slices for server CRUD and invite-code refresh
- channel create/edit/delete mutations now use shared SDK ownership instead of raw same-origin proxy calls
- membership and server-membership mutations now use shared SDK ownership instead of raw same-origin proxy calls
- message create/update/delete mutations now use shared SDK ownership while preserving the current chat runtime contract
- chat read/infinite-query path now uses shared SDK ownership while preserving pagination and realtime fallback behavior
- auth login/register/logout runtime actions now use shared SDK ownership while preserving cookie-session behavior
- storage upload/delete runtime actions now use shared SDK ownership while preserving staged upload lifecycle
- media token runtime action now uses backend/API-owned token generation through the shared SDK while preserving current LiveKit behavior
- chat runtime API/socket contract is now normalized, so chat reads/writes use domain API paths while realtime remains socket/event based
- remaining `Next` API/proxy routes have been inventoried before broad deletion; only the already-retired `src/pages/api/socket/io.ts` route was removed
- legacy `pages/api/socket/channels/*` and `pages/api/socket/members/[memberId]` routes were removed after repeated code search confirmed no active callers
- legacy `pages/api/socket/servers/[serverId]/leave.ts` was removed after repeated code search confirmed no active callers
- invite join fallback was moved off `pages/api/socket/servers/invite.ts`; the legacy invite socket route was then removed
- legacy `pages/api/socket/messages/*` and `pages/api/socket/direct-messages/*` routes were removed after repeated code search confirmed no active callers; obsolete SDK socket-path normalization was removed
- `src/app/api/channels/*` and `src/app/api/members/[memberId]` app-router proxy routes were removed after repeated code search confirmed active channel/member flows use backend-aware SDK mutations
- `src/app/api/servers/*` app-router proxy routes were removed after repeated code search confirmed active server flows use backend-aware SDK queries/mutations

Current next slice inside this wave:
- continue with narrow route-family cleanup based on the inventory below; remaining `src/app/api/*` routes must still be removed route-family by route-family, not by broad deletion

Current runtime decision:
- `direct backend mode` is the active web runtime target for API reads/writes
- same-origin `Next` API fallback is transitional compatibility, not the long-term product contract
- after chat contract normalization, chat writes do not need to preserve same-origin `Next` API fallback if direct backend mode is configured and verified
- broad deletion of compatibility routes is still out of scope; future cleanup should proceed route-family by route-family using the inventory below

## Segment 044 Proxy Route Inventory

Inventory rule:
- `direct backend mode` through `packages/sdk` is the active target runtime
- same-origin `Next` API routes are compatibility/fallback only unless noted as active runtime URL builders

### Active Compatibility Routes

| Route | Caller evidence | Why it remains |
| --- | --- | --- |
| `src/app/api/storage/access/route.ts` | `packages/app-core/src/files/upload-file.ts` builds `/api/storage/access?...` for stored file reads | Active backend-redirect read/access URL; not safe to remove until file access URL building supports direct backend mode. |

### Transitional Fallback Routes

| Route | Caller evidence | Direct backend owner |
| --- | --- | --- |
| `src/app/api/auth/login/route.ts` | `packages/sdk/src/actions/auth.ts` fallback `/api/auth/login` | `POST /api/auth/login/password` |
| `src/app/api/auth/register/route.ts` | `packages/sdk/src/actions/auth.ts` fallback `/api/auth/register` | `POST /api/auth/register/password` |
| `src/app/api/auth/session/logout/route.ts` | `packages/sdk/src/actions/auth.ts` uses `/api/auth/session/logout` | `POST /api/auth/session/logout` |
| `src/app/api/user/route.ts` | `packages/sdk/src/queries/profile.ts` fallback `/api/user` | `GET /api/auth/session` |
| `src/app/api/messages/route.ts` | `src/app/(main)/(routes)/*/channels/[channelId]/page.tsx` passes `/api/messages` to chat read helper; direct mode goes to backend | `GET /api/messages` |
| `src/app/api/direct-messages/route.ts` | `src/app/(main)/(routes)/*/conversations/[memberId]/page.tsx` passes `/api/direct-messages` to chat read helper; direct mode goes to backend | `GET /api/direct-messages` |
| `src/app/api/server-upload/route.ts` | `packages/sdk/src/actions/storage.ts` fallback `/api/server-upload` | `/api/storage/upload`, `/api/storage/file` |
| `src/app/api/livekit/route.ts` | `packages/sdk/src/actions/media.ts` fallback `/api/livekit` | `/api/media/livekit-token` |

### Unused / Dead Route Candidates Kept For A Later Narrow Slice

These routes had no active caller in `src`, `packages`, or `apps` code search during Segment 044, but were not removed in that slice because they are part of the broader legacy `pages/api/socket/*` compatibility surface.

| Route | Reason kept |
| --- | --- |
| _None currently_ | Segment 045 and Segment 046 removed the previously documented dead channel/member/server-leave route candidates. |

### Removed Routes

| Route | Proof | Replacement |
| --- | --- | --- |
| `src/pages/api/socket/io.ts` | No caller found by code search; route already returned `410 Socket transport moved to apps/api realtime gateway` | `SocketProvider` connects to backend realtime gateway at `${publicApiUrl}/realtime`. |
| `src/pages/api/socket/channels/index.ts` | Repeated Segment 045 code search found no active `/api/socket/channels` callers outside docs and the route file itself | `packages/sdk/src/mutations/channel.ts` uses `/api/channels` through the backend-aware client. |
| `src/pages/api/socket/channels/[channelId].ts` | Repeated Segment 045 code search found no active `/api/socket/channels/:channelId` callers outside docs and the route file itself | `packages/sdk/src/mutations/channel.ts` uses `/api/channels/:channelId` through the backend-aware client. |
| `src/pages/api/socket/members/[memberId].ts` | Repeated Segment 045 code search found no active `/api/socket/members/:memberId` callers outside docs and the route file itself | `packages/sdk/src/mutations/membership.ts` uses `/api/members/:memberId` through the backend-aware client. |
| `src/pages/api/socket/servers/[serverId]/leave.ts` | Repeated Segment 046 code search found no active `/api/socket/servers/*/leave` callers outside docs and the route file itself | `packages/sdk/src/mutations/membership.ts` uses `/api/servers/:serverId/leave` through the backend-aware client. |
| `src/pages/api/socket/servers/invite.ts` | Invite join fallback was deliberately moved from `/api/socket/servers/invite` to `/api/invites/join`, then code search found no remaining active callers | `packages/sdk/src/mutations/invite.ts` uses `/api/invites/join` through the backend-aware client. |
| `src/pages/api/socket/messages/index.ts` | Repeated Segment 047 code search found no active `/api/socket/messages` callers outside docs; obsolete SDK socket-path normalization was removed | `packages/sdk/src/queries/chat.ts` and `packages/sdk/src/mutations/message.ts` use `/api/messages` through the backend-aware client. |
| `src/pages/api/socket/messages/[messageId].ts` | Repeated Segment 047 code search found no active `/api/socket/messages/:id` callers outside docs; obsolete SDK socket-path normalization was removed | `packages/sdk/src/mutations/message.ts` uses `/api/messages/:messageId` through the backend-aware client. |
| `src/pages/api/socket/direct-messages/index.ts` | Repeated Segment 047 code search found no active `/api/socket/direct-messages` callers outside docs; obsolete SDK socket-path normalization was removed | `packages/sdk/src/queries/chat.ts` and `packages/sdk/src/mutations/message.ts` use `/api/direct-messages` through the backend-aware client. |
| `src/pages/api/socket/direct-messages/[directMessageId].ts` | Repeated Segment 047 code search found no active `/api/socket/direct-messages/:id` callers outside docs; obsolete SDK socket-path normalization was removed | `packages/sdk/src/mutations/message.ts` uses `/api/direct-messages/:directMessageId` through the backend-aware client. |
| `src/app/api/channels/route.ts` | Segment 048 code search found channel create callers use `@sdk/mutations/channel`; direct backend mode resolves `/api/channels` to `apps/api`. | `packages/sdk/src/mutations/channel.ts` uses `/api/channels` through the backend-aware client. |
| `src/app/api/channels/[channelId]/route.ts` | Segment 048 code search found channel update/delete callers use `@sdk/mutations/channel`; direct backend mode resolves `/api/channels/:channelId` to `apps/api`. | `packages/sdk/src/mutations/channel.ts` uses `/api/channels/:channelId` through the backend-aware client. |
| `src/app/api/members/[memberId]/route.ts` and services | Segment 048 code search found member role/kick callers use `@sdk/mutations/membership`; direct backend mode resolves `/api/members/:memberId` to `apps/api`. | `packages/sdk/src/mutations/membership.ts` uses `/api/members/:memberId` through the backend-aware client. |
| `src/app/api/utils.ts` | After Segment 048 route removal, no remaining callers imported `getServerId`. | No replacement needed. |
| `src/app/api/servers/route.ts` | Segment 049 code search found server list/create callers use `@sdk/queries/server` and `@sdk/mutations/server`; direct backend mode resolves `/api/servers` to `apps/api`. | `packages/sdk/src/queries/server.ts` and `packages/sdk/src/mutations/server.ts` use `/api/servers` through the backend-aware client. |
| `src/app/api/servers/[serverId]/route.ts` | Segment 049 code search found server detail/update/delete callers use `@sdk/queries/server` and `@sdk/mutations/server`; direct backend mode resolves `/api/servers/:serverId` to `apps/api`. | `packages/sdk/src/queries/server.ts` and `packages/sdk/src/mutations/server.ts` use `/api/servers/:serverId` through the backend-aware client. |
| `src/app/api/servers/[serverId]/invite-code/route.ts` | Segment 049 code search found invite-code refresh callers use `@sdk/mutations/server`; direct backend mode resolves `/api/servers/:serverId/invite-code` to `apps/api`. | `packages/sdk/src/mutations/server.ts` uses `/api/servers/:serverId/invite-code` through the backend-aware client. |
| `src/app/api/servers/[serverId]/leave/route.ts` | Segment 049 code search found leave-server callers use `@sdk/mutations/membership`; direct backend mode resolves `/api/servers/:serverId/leave` to `apps/api`. | `packages/sdk/src/mutations/membership.ts` uses `/api/servers/:serverId/leave` through the backend-aware client. |

### Broader Deletion Blockers

- `src/app/api/storage/access/route.ts` is still an active URL produced by `buildStorageAccessPath`.
- Several `src/app/api/*` routes are still same-origin fallback paths for SDK helpers when `NEXT_PUBLIC_API_URL` / development backend base URL is unavailable.
- No `src/pages/api/socket/*` HTTP compatibility route remains after Segment 047; future cleanup should focus on remaining `src/app/api/*` compatibility/fallback routes.

## In Scope

- web runtime API extraction
- reducing `Next` proxy/API ownership
- strengthening direct client-to-backend access through the shared SDK layer

## Out of Scope

- `Postgres` migration
- media rewrite
- new auth redesign
- broad frontend rewrite to `React + Vite`

## Constraints

- keep auth/storage boundaries stable
- keep the runtime working while extraction happens
- prefer narrow, reviewable slices over big-bang frontend/API rewrites

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
