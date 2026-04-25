# Stage Status

## Current Read Model

- `PLATFORM_MIGRATION_PLAN.md` = master plan
- `waves/*.md` = ordered waves by stage
- `SEGMENT_BRIEF_*` = concrete PR slices inside a wave

Current wave order:
- `Wave 1` = `FIRST_MIGRATION`
- `Wave 2` = `NEST_FOUNDATION`
- `Wave 3` = `DOMAIN_EXTRACTION_SLICE_1`
- `Wave 4` = `DOMAIN_EXTRACTION_SLICE_2_MESSAGES`
- `Wave 5` = `SOCKET_TRANSPORT_EXTRACTION`
- `Wave 6` = `AUTH_FOUNDATION`

## Status by Stage

### Stage 0. Architecture Freeze

Status: `done`

Done:
- master migration plan exists
- repo strategy is fixed
- target architecture is fixed
- wave/segment delegation model is fixed

Remaining:
- none

### Stage 1. Internal Decoupling

Status: `done`

Done:
- `packages/app-core` seed extraction
- `packages/sdk` seed extraction
- `packages/ui` seed extraction
- `@app-core/*`, `@sdk/*`, `@ui/*`
- shim/re-export layer in old paths
- `AuthProvider` contract
- `StorageProvider` contract
- `MediaProvider` contract
- `RealtimeProvider` contract

Remaining:
- none at contract-definition level

### Stage 2. Nest Foundation

Status: `done`

Done:
- `apps/api`
- `Nest` skeleton
- config/logger/health
- base module scaffold
- realtime scaffold

Remaining:
- none at foundation level

### Stage 3. Domain and Realtime Extraction

Status: `done`

Done:
- first backend-owned slice moved to `apps/api`: invites/servers/channels/members
- `src/app/api/*` for this slice converted to compatibility/proxy layer
- `src/pages/api/socket/*` for this slice reduced to transitional auth/proxy ownership
- transitional cleanup for the same slice completed
- proxy response handling in legacy `pages/api/socket/*` aligned through a shared helper
- remaining channel validation removed from legacy socket layer so ownership stays in `apps/api`
- realtime contract for the first slice centralized in `packages/app-core`
- client listeners for the first slice aligned to the shared realtime contract
- second backend-owned slice started in `apps/api`: messages/direct-messages
- `src/app/api/messages/*` and `src/app/api/direct-messages/*` reduced to compatibility/proxy ownership
- `src/pages/api/socket/messages/*` and `src/pages/api/socket/direct-messages/*` reduced to transitional auth/proxy ownership
- realtime contract for the message slice centralized in `packages/app-core`
- socket transport ownership moved from legacy `pages/api/socket/*` into the backend realtime gateway
- `Nest` realtime gateway is now the transport owner
- web runtime connects directly to backend realtime transport
- legacy `src/pages/api/socket/*` no longer owns socket emit behavior

Remaining:
- non-blocking transitional cleanup only
- auth/profile resolution is still transitional and still belongs to a later stage

### Stage 4. Auth Replacement Path

Status: `in progress`

Done:
- backend auth foundation exists in `apps/api`
- centralized auth service resolves transitional auth context
- reusable guards and decorators replace direct `x-profile-id` reads in backend controllers
- backend-owned `/api/auth/session` snapshot endpoint exists
- domain backend modules now depend on the auth boundary instead of raw header access

Remaining:
- move more profile/session resolution onto the backend auth boundary
- keep current runtime working while reducing direct `Clerk` coupling
- full `Clerk` replacement
- backend-owned sessions/devices/tokens

## Next Correct Step

The next correct step by plan is:

1. continue `Stage 4` with auth context/profile integration on top of the new backend auth boundary
2. keep this focused on the auth boundary only
3. do not mix this with storage, `Postgres`, or `LiveKit/media` migrations
