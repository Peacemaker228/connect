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
- `Wave 27` = `VENDOR_REPO_CLEANUP` (optional side cleanup)

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

Remaining:
- deferred late-roadmap auth product work only:
  - `email verification`
  - `password reset`
  - similar non-blocking auth-product completeness work
- these items are intentionally moved to the very end of the roadmap, before the final `Next.js -> React` decision

### Stage 5. Storage Foundation

Status: `done`

Done:
- backend-owned storage module exists in `apps/api`
- storage provider token and provider shape exist behind the backend boundary
- the current server-upload route is reduced to a thin proxy to backend storage ownership
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

## Next Correct Step

The next correct step by plan is:

1. start `Stage 5A` with web runtime API extraction
2. reduce remaining `Next` `app/api` and `pages/api` compatibility/proxy layers
3. move web runtime closer to direct backend access through `packages/sdk`
4. keep the now-stable auth/storage boundaries intact during the extraction
5. do not mix this with `Postgres` migration or media rewrite

Current `Wave 26` progress:
- backend-aware API base URL/client foundation exists
- backend CORS/origin foundation exists for direct browser calls
- first shared SDK extraction slices are already done for `server`, `profile`, and `invite`
- the first shared feature mutation extraction slices are already done for server CRUD and invite-code refresh
- the next narrow step should continue with channel-focused shared mutations before broad UI rewrites

Completed side cleanup:
- `Wave 22 / CLERK_REPO_CLEANUP` is done and should stay repo hygiene only

Optional side cleanup:
- `Wave 27 / VENDOR_REPO_CLEANUP` may be run to remove dead repo-level `Clerk` and `UploadThing` leftovers without changing the main `Stage 5A` path
