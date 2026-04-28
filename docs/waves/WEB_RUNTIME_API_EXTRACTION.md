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

Current next slice inside this wave:
- continue extraction through storage upload/delete runtime action wrappers before broad proxy-route removal

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
