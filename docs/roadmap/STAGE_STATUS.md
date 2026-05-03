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
- `Wave 7` = `AUTH_CONTEXT_INTEGRATION`
- `Wave 8` = `AUTH_RUNTIME_INTEGRATION`
- `Wave 9` = `AUTH_MIDDLEWARE_INTEGRATION`
- `Wave 10` = `AUTH_SESSIONS_FOUNDATION`
- `Wave 11` = `AUTH_COOKIE_RUNTIME_INTEGRATION`
- `Wave 12` = `AUTH_IDENTITY_OWNERSHIP_FOUNDATION`
- `Wave 13` = `AUTH_OWN_ENTRYPOINTS_INTEGRATION`
- `Wave 14` = `AUTH_CLERK_REMOVAL`
- `Wave 15` = `AUTH_RESIDUAL_CLERK_CLEANUP`
- `Wave 16` = `AUTH_STAGE4_COMPATIBILITY_CLEANUP`
- `Wave 17` = `STORAGE_FOUNDATION`
- `Wave 18` = `STORAGE_S3_PROVIDER_IMPLEMENTATION`
- `Wave 19` = `STORAGE_MANAGED_CLOUD_VALIDATION`
- `Wave 20` = `STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP`
- `Wave 21` = `STORAGE_METADATA_OWNERSHIP_FOUNDATION`
- `Wave 22` = `CLERK_REPO_CLEANUP` (optional side cleanup, done)
- `Wave 23` = `STORAGE_RUNTIME_READ_RESOLUTION`
- `Wave 24` = `STORAGE_ACCESS_POLICY_FOUNDATION`
- `Wave 25` = `STORAGE_STAGED_UPLOAD_SWEEPER`
- `Wave 26` = `WEB_RUNTIME_API_EXTRACTION`
- `Wave 27` = `VENDOR_REPO_CLEANUP` (done)
- `Wave 28` = `PRISMA_BOUNDARY_PREP`
- `Wave 29` = `POSTGRES_PROVIDER_SWITCH_PLAN`

## Status by Stage

### Stage 0. Architecture Freeze

Status: `done`

Done:
- a master migration plan exists
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

Status: `done`

Done:
- backend auth foundation exists in `apps/api`
- a centralized auth service resolves transitional auth context
- reusable guards and decorators replace direct `x-profile-id` reads in backend controllers
- backend-owned `/api/auth/session` snapshot endpoint exists
- domain backend modules now depend on the auth boundary instead of raw header access
- backend can resolve session/profile by user identity through the auth boundary
- `currentProfile()` and `currentProfilePages()` now use the backend auth boundary as the primary path
- direct active-flow `ensureProfile()` ownership is removed from current profile resolution
- `src/app/api/*` proxy routes now use backend-auth headers instead of manual `x-profile-id` glue
- `src/pages/api/socket/*` proxy routes now use backend-auth headers instead of manual `x-profile-id` glue
- middleware auth wiring now goes through a local auth adapter instead of direct Clerk middleware usage
- layout/provider runtime auth wiring now goes through a local auth provider boundary
- the current runtime auth state/identity loading is centralized in runtime auth utilities
- backend-owned auth session persistence exists
- backend session refresh/rotation/revocation now goes through the persisted auth-session state
- backend cookie transport foundation exists for browser auth: exchange/refresh/logout can set or clear `Secure` + `HttpOnly` session cookies
- auth context resolution can now be authenticated by cookie-backed access token as well as transitional headers
- browser/runtime auth can now bootstrap and clear backend cookie sessions through dedicated auth routes
- the current runtime profile / session resolution prefers backend cookie-session auth before falling back to transitional Clerk-backed identity resolution
- runtime provider and middleware are integrated with the backend cookie-session path as the primary browser auth flow
- backend-owned auth identity foundation exists
- Clerk identity resolution now goes through backend auth-identity ownership instead of direct profile upsert logic
- password hashing/verification foundation exists in the backend auth boundary
- backend password-based register/login endpoints now exist on top of the backend session/cookie model
- browser/runtime auth entrypoints now use backend-owned login/register flow as the primary path
- sign-in/sign-up pages now prefer local auth entrypoint forms with Clerk left as fallback mode
- shared auth entrypoint validation is centralized through app-core schema/contracts
- `Clerk` is removed from the active browser/runtime auth path
- app-shell auth provider and middleware now run on backend-owned auth flow instead of `Clerk`
- residual `Clerk` imports are removed from `server-upload`, `uploadthing`, and the legacy `ensure-profile` helper path
- repo-level `Clerk` leftovers are removed from package/build/electron glue: the dead `@clerk/nextjs` dependency is gone, build env no longer carries `CLERK_*`, and desktop bridge naming is auth-neutral
- legacy `CLERK` auth identity provider values are removed through a separate destructive Prisma cleanup migration before the schema enum is narrowed; `PASSWORD` is now the only auth identity provider in the current data model

Remaining:
- deferred late-roadmap auth product work only:
  - auth hardening before production/final React-Vite decision:
    - CSRF strategy for cookie auth
    - login/register rate limiting and brute-force protection
    - integration/e2e coverage for access expiry, refresh rotation, logout, expired refresh, and protected-route behavior
    - production cookie/CORS/secure/domain verification
    - review of the custom token format against a standard JWT/PASETO-style implementation
    - session/device management UX if product scope requires it
  - `email verification`
  - `password reset`
  - similar non-blocking auth-product completeness work
- these items are intentionally moved to the very end of the roadmap, before the final `Next.js -> React` decision

### Stage 5. Storage Foundation

Status: `done`

Done:
- backend-owned storage module exists in `apps/api`
- storage provider token and provider shape exist behind the backend boundary
- the former `server-upload` route was reduced to a thin proxy during `Stage 5` and later removed during `Stage 5A`
- multipart proxying to backend works through the shared backend proxy helper
- the current runtime upload flow stays working while direct storage-vendor spread is reduced
- cloud-first `S3-compatible` direction is fixed in docs and config shape
- `Redis` is intentionally excluded from the initial storage step
- real managed-cloud `S3-compatible` provider now exists in `apps/api`
- active storage ownership can now move through the new `S3-compatible` provider instead of the temporary UploadThing adapter
- explicit backend upload policy for `messageFile` is now fixed instead of remaining implicit
- the new provider is validated against a real managed-cloud bucket
- live upload flow works end-to-end through the backend-owned storage path
- runtime image host wiring is aligned for the managed-cloud storage host
- the main explicit orphan-cleanup flows are covered in the UI/storage boundary lifecycle
- the active storage runtime no longer depends on `UploadThing`
- the old `Next` `UploadThing` route and UI utility leftovers are removed from active code
- the unsafe `UploadThing` delete/cleanup compatibility path is removed instead of being kept weaker than the managed-cloud ownership model
- new upload values can now carry backend-owned storage metadata (`fileKey` + `fileUrl` + `fileType`) instead of staying raw-vendor-URL-only
- storage delete/cleanup now prefers backend-owned file-key metadata and falls back to public URL parsing only for legacy values
- active runtime file reads can now go through a backend-owned storage access path instead of using stored public URLs as the only direct runtime read contract
- current managed-cloud reads still resolve to public object URLs under the hood, but file-key-based access resolution is now the preferred active path
- new stored uploads can now explicitly mark backend-owned runtime access policy (`backend-redirect`) instead of depending on implicit read assumptions
- backend storage access responses now expose explicit access-policy metadata (`kind`, `upstream`, `compatibility`) while current managed-cloud resolution remains public-URL-backed under the hood
- backend-owned uploads are now marked as `staged` until a domain success-path finalizes them
- a bounded staged-upload sweeper can now clean only aged files that remain `staged`, without introducing a full bucket-vs-DB orphan scanner

Remaining:
- non-blocking later storage evolution only:
  - decide whether historical `UploadThing` read compatibility (for old CDN URLs) stays temporary or is later normalized away
  - decide whether public URL compatibility stays temporary or moves toward stronger metadata/file-key ownership later
  - decide whether the current `backend-redirect` contract later evolves into `signed-url` or `proxy-stream` access for stronger backend ownership

### Stage 6. MySQL -> Postgres

Status: `active`

Current wave:
- `Wave 29 / POSTGRES_PROVIDER_SWITCH_PLAN`

Current intent:
- create the separate Stage 6 provider-switch/data-migration plan after `Wave 28`
- define future implementation segments for schema/provider diff audit, local Postgres env, migration strategy, data export/import, staging validation, rollback, and cutover
- keep this as a planning wave, not the provider switch itself
- keep `DATABASE_URL`, Prisma datasource provider, `prisma/schema.prisma`, migrations, and runtime DB behavior unchanged during this planning wave

Done:
- `Prisma boundary inventory / pre-Stage6 preparation` exists in `docs/delegation/briefs/SEGMENT_BRIEF_055_PRISMA_BOUNDARY_INVENTORY.md`
- generated Prisma model/enum type leakage has been removed from `packages/sdk`
- generated Prisma model/enum type leakage has been removed from browser/shared UI
- the setup route no longer uses the web-shell Prisma runtime for initial server routing
- server routing guards under `src/app/(main)/(routes)/servers/[serverId]` no longer use the web-shell Prisma runtime
- conversation bootstrap under `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]` no longer uses the web-shell Prisma runtime
- invite validation under `src/app/(invite)/(routes)/invite/[inviteCode]` no longer uses the web-shell Prisma runtime
- the final Wave 28 caller sweep found no remaining `src/lib/shared/utils/db.ts` callers, and the unused web-shell Prisma helper has been removed
- `Wave 28 / PRISMA_BOUNDARY_PREP` is closed as boundary-prep only and did not change Prisma schema, migrations, datasource provider, `DATABASE_URL`, or runtime DB behavior
- `Wave 29 / POSTGRES_PROVIDER_SWITCH_PLAN` exists as the Stage 6 planning wave for the future provider switch/data migration
- `schema/provider diff audit` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_056_SCHEMA_PROVIDER_DIFF_AUDIT.md`
- the audit recommends a clean Postgres baseline instead of translating the current incomplete MySQL migration history
- `local-postgres-baseline-design` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_057_LOCAL_POSTGRES_BASELINE_DESIGN.md`
- the first Postgres baseline strategy is clean baseline with current Prisma-managed relation behavior preserved where supported
- `local-postgres-validation-infra` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_058_LOCAL_POSTGRES_VALIDATION_INFRA.md`
- isolated local-only Postgres validation Compose config and env examples exist under `infra/postgres`

Remaining:
- no provider switch has been performed yet
- next segment should prepare executable MySQL data-audit queries before baseline generation or import work

## Next Correct Step

The next correct step by plan is:

1. start `mysql-data-audit-query-pack`
2. prepare executable MySQL data-audit queries for orphan rows, enum parity, case/collation duplicates, DateTime parity, and row counts
3. keep `Stage 5A` direct-backend runtime assumptions intact
4. do not reintroduce `Next` API/proxy routes under `src/app/api/*` or `src/pages/api/socket/*`
5. do not change `DATABASE_URL`, the Prisma datasource provider, `prisma/schema.prisma`, migrations, or runtime DB behavior during the next segment

Current `Wave 26` progress:
- backend-aware API base URL/client foundation exists
- backend CORS/origin foundation exists for direct browser calls
- first shared SDK extraction slices are already done for `server`, `profile`, and `invite`
- the first shared feature mutation extraction slices are already done for server CRUD and invite-code refresh
- channel create/edit/delete mutations are now moved under shared SDK ownership
- membership and server-membership mutations are now moved under shared SDK ownership
- message create/update/delete mutations are now moved under shared SDK ownership while preserving the current chat runtime contract
- chat read/infinite-query path is now moved under shared SDK ownership while preserving pagination and realtime fallback behavior
- auth login/register/logout runtime actions are now moved under shared SDK ownership while preserving cookie-session behavior
- storage upload/delete runtime actions are now moved under shared SDK ownership while preserving staged upload lifecycle
- media token runtime action is now moved under backend/API-owned token generation through shared SDK ownership while preserving current LiveKit behavior
- chat runtime API/socket contract is now normalized so chat reads/writes use domain API paths while realtime remains socket/event based
- Stage 5A active runtime assumption: direct backend mode is the target; same-origin `Next` API fallback is transitional and no longer a hard guarantee for newly normalized chat write paths
- remaining `Next` compatibility/proxy routes have been inventoried in `docs/waves/WEB_RUNTIME_API_EXTRACTION.md`
- the already-retired `src/pages/api/socket/io.ts` route was removed after code search showed no active callers and realtime transport was already owned by `apps/api`
- legacy `src/pages/api/socket/channels/*` and `src/pages/api/socket/members/[memberId].ts` routes were removed after repeated code search showed no active callers and SDK channel/member mutations already used backend-aware domain API paths
- legacy `src/pages/api/socket/servers/[serverId]/leave.ts` was removed after repeated code search showed no active callers and SDK server-leave mutation already used the backend-aware `/api/servers/:serverId/leave` domain path
- invite join fallback was moved off `src/pages/api/socket/servers/invite.ts`, and the legacy invite socket route was removed
- legacy `src/pages/api/socket/messages/*` and `src/pages/api/socket/direct-messages/*` routes were removed after repeated code search showed no active callers, and obsolete SDK socket-path normalization was removed
- `src/app/api/channels/*` and `src/app/api/members/[memberId]` app-router proxy routes were removed after code search confirmed active flows use backend-aware SDK mutations and `apps/api` owns `/api/channels` + `/api/members/:memberId`
- `src/app/api/utils.ts` was removed after the channel/member proxy cleanup left no callers
- `src/app/api/servers/*` app-router proxy routes were removed after code search confirmed active server flows use backend-aware SDK queries/mutations and `apps/api` owns `/api/servers`, `/api/servers/:serverId`, `/api/servers/:serverId/invite-code`, and `/api/servers/:serverId/leave`
- `src/app/api/messages`, `src/app/api/direct-messages`, and `src/app/api/livekit` app-router proxy routes were removed after code search confirmed active chat/media flows use backend-aware SDK paths and `apps/api` owns `/api/messages`, `/api/direct-messages`, and `/api/media/livekit-token`
- `src/app/api/auth/*` login/register/logout and `src/app/api/user` app-router proxy routes were removed after code search confirmed active auth/profile flows use backend-aware SDK paths and `apps/api` owns `/api/auth/login/password`, `/api/auth/register/password`, `/api/auth/session/logout`, and `/api/auth/session`
- `src/app/api/server-upload` app-router proxy route was removed after code search confirmed storage upload/delete flows use backend-aware SDK paths and `apps/api` owns `/api/storage/upload` and `/api/storage/file`
- `src/app/api/storage/access` app-router proxy route was removed after storage read URLs moved to direct backend `/api/storage/access` URLs while preserving backend-redirect and legacy URL compatibility
- the `src/app/api/*` route-cleanup part of `Wave 26` is closed; no remaining `src/app/api` route files are expected after Segment 053
- Stage 5A runtime closeout sweep confirmed that `src/app/api/*` and `src/pages/api/socket/*` route files remain absent
- Stage 5A runtime closeout sweep found no active dependency on removed `Next` product API/proxy routes across auth login/register/logout/session refresh/protected entry, storage upload/delete/access URLs, chat reads/writes and realtime separation, media token/leave behavior, server switch prefetch/routing, or socket URL construction
- auth runtime note is documented for the future `React + Vite` decision: current `Next` shell auth remains heavier because of middleware/server-side route checks, while the future React/Vite shape can simplify to direct backend requests, SDK refresh-on-401, and client protected-route guards

Completed side cleanup:
- `Wave 22 / CLERK_REPO_CLEANUP` is done and should stay repo hygiene only

Completed cleanup:
- `Wave 27 / VENDOR_REPO_CLEANUP` removed remaining dead repo-level vendor leftovers without changing the stable `Stage 5A` runtime path
- the narrow Prisma auth-provider enum cleanup removed the legacy `CLERK` provider value after backend-owned password auth became the only active identity provider
