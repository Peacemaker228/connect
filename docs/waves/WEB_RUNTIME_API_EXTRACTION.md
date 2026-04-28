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

Current next slice inside this wave:
- continue with narrow route-family cleanup based on the inventory below, starting with legacy `pages/api/socket/channels/*` + `pages/api/socket/members/*` if code search still shows no active callers

Current runtime decision:
- `direct backend mode` is the active web runtime target for API reads/writes
- same-origin `Next` API fallback is transitional compatibility, not the long-term product contract
- after chat contract normalization, chat writes do not need to preserve same-origin `Next` API fallback if direct backend mode is configured and verified
- broad deletion of compatibility routes is still out of scope; future cleanup should proceed route-family by route-family using the inventory below

## Segment 044 Proxy Route Inventory

Inventory rule:
- `direct backend mode` through `packages/sdk` is the active target runtime
- same-origin `Next` API routes are compatibility/fallback only unless noted as active runtime URL builders
- `src/app/api/utils.ts` and `src/app/api/members/[memberId]/services/*` are helper files, not route entrypoints

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
| `src/app/api/servers/route.ts` | `packages/sdk/src/queries/server.ts`, `packages/sdk/src/mutations/server.ts` same-origin fallback | `/api/servers` |
| `src/app/api/servers/[serverId]/route.ts` | `packages/sdk/src/queries/server.ts`, `packages/sdk/src/mutations/server.ts` same-origin fallback | `/api/servers/:serverId` |
| `src/app/api/servers/[serverId]/invite-code/route.ts` | `packages/sdk/src/mutations/server.ts` same-origin fallback | `/api/servers/:serverId/invite-code` |
| `src/app/api/servers/[serverId]/leave/route.ts` | `packages/sdk/src/mutations/membership.ts` same-origin fallback | `/api/servers/:serverId/leave` |
| `src/app/api/channels/route.ts` | `packages/sdk/src/mutations/channel.ts` same-origin fallback | `/api/channels` |
| `src/app/api/channels/[channelId]/route.ts` | `packages/sdk/src/mutations/channel.ts` same-origin fallback | `/api/channels/:channelId` |
| `src/app/api/members/[memberId]/route.ts` | `packages/sdk/src/mutations/membership.ts` same-origin fallback | `/api/members/:memberId` |
| `src/app/api/messages/route.ts` | `src/app/(main)/(routes)/*/channels/[channelId]/page.tsx` passes `/api/messages` to chat read helper; direct mode goes to backend | `GET /api/messages` |
| `src/app/api/direct-messages/route.ts` | `src/app/(main)/(routes)/*/conversations/[memberId]/page.tsx` passes `/api/direct-messages` to chat read helper; direct mode goes to backend | `GET /api/direct-messages` |
| `src/app/api/server-upload/route.ts` | `packages/sdk/src/actions/storage.ts` fallback `/api/server-upload` | `/api/storage/upload`, `/api/storage/file` |
| `src/app/api/livekit/route.ts` | `packages/sdk/src/actions/media.ts` fallback `/api/livekit` | `/api/media/livekit-token` |
| `src/pages/api/socket/servers/invite.ts` | `packages/sdk/src/mutations/invite.ts` fallback `/api/socket/servers/invite` | `/api/invites/join` |
| `src/pages/api/socket/messages/index.ts` | no active component caller after chat contract normalization; retained only for legacy `/api/socket/messages` fallback shape | `/api/messages` |
| `src/pages/api/socket/messages/[messageId].ts` | no active component caller after chat contract normalization; retained only for legacy `/api/socket/messages/:id` fallback shape | `/api/messages/:messageId` |
| `src/pages/api/socket/direct-messages/index.ts` | no active component caller after chat contract normalization; retained only for legacy `/api/socket/direct-messages` fallback shape | `/api/direct-messages` |
| `src/pages/api/socket/direct-messages/[directMessageId].ts` | no active component caller after chat contract normalization; retained only for legacy `/api/socket/direct-messages/:id` fallback shape | `/api/direct-messages/:directMessageId` |

### Unused / Dead Route Candidates Kept For A Later Narrow Slice

These routes had no active caller in `src`, `packages`, or `apps` code search during Segment 044, but were not removed in this slice because they are part of the broader legacy `pages/api/socket/*` compatibility surface.

| Route | Reason kept |
| --- | --- |
| `src/pages/api/socket/channels/index.ts` | No active caller found; keep until channel fallback removal is split into its own route deletion slice. |
| `src/pages/api/socket/channels/[channelId].ts` | No active caller found; keep until channel fallback removal is split into its own route deletion slice. |
| `src/pages/api/socket/members/[memberId].ts` | No active caller found; keep until membership fallback removal is split into its own route deletion slice. |
| `src/pages/api/socket/servers/[serverId]/leave.ts` | No active caller found; keep until membership/server fallback removal is split into its own route deletion slice. |

### Removed Routes

| Route | Proof | Replacement |
| --- | --- | --- |
| `src/pages/api/socket/io.ts` | No caller found by code search; route already returned `410 Socket transport moved to apps/api realtime gateway` | `SocketProvider` connects to backend realtime gateway at `${publicApiUrl}/realtime`. |

### Broader Deletion Blockers

- `src/app/api/storage/access/route.ts` is still an active URL produced by `buildStorageAccessPath`.
- Several `src/app/api/*` routes are still same-origin fallback paths for SDK helpers when `NEXT_PUBLIC_API_URL` / development backend base URL is unavailable.
- Some `src/pages/api/socket/*` routes are now unused by active code but should be removed in small route-family slices so legacy fallback assumptions can be verified per flow.

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
