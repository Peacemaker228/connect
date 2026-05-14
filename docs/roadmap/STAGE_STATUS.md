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
- `Wave 30` = `LOCAL_POSTGRES_DEV_SWITCH`
- `Wave 31` = `PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN`
- `Wave 32` = `MEDIA_STACK_TECHNOLOGY_DECISION`
- `Wave 33` = `MEDIA_MVP_IMPLEMENTATION_PLAN`

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

Status: `local complete / production deferred`

Current wave:
- none active for production

Current intent:
- create the separate Stage 6 provider-switch/data-migration plan after `Wave 28`
- define future implementation segments for schema/provider diff audit, local Postgres env, migration strategy, data export/import, staging validation, rollback, and cutover
- keep production migration separate from the local disposable-data Postgres dev switch
- keep staging/production untouched during local dev switch work

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
- `mysql-data-audit-query-pack` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_059_MYSQL_DATA_AUDIT_QUERY_PACK.md`
- the query pack covers orphan rows, enum parity, case/collation duplicates, DateTime sanity, row counts, and aggregate parity
- `mysql-data-audit-run-and-report` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_060_MYSQL_DATA_AUDIT_RUN_REPORT.md`
- the local MySQL data-audit run found no blocking data-audit findings
- `direct-message-self-conversation-policy` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_061_DIRECT_MESSAGE_SELF_CONVERSATION_POLICY.md`
- new direct-message self-conversation bootstrap is blocked in backend/web guards; the two existing local self-conversation rows remain review/data-cleanup candidates
- `postgres-validation-schema-baseline` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_062_POSTGRES_VALIDATION_SCHEMA_BASELINE.md`
- isolated validation-only Prisma artifacts exist under `prisma/postgres-validation`, with a generated clean Postgres baseline reviewed but not applied
- `postgres-validation-baseline-apply-and-drift-check` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_063_POSTGRES_VALIDATION_BASELINE_APPLY_DRIFT_CHECK.md`
- baseline apply/drift is blocked because the disposable local Postgres validation database is not reachable in the current shell and required local Postgres tooling is unavailable
- `postgres-validation-runtime-unblock-and-apply-drift-rerun` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_064_POSTGRES_VALIDATION_RUNTIME_UNBLOCK_APPLY_DRIFT.md`
- the isolated clean baseline was applied to disposable local Postgres validation and Prisma reported no empty-database schema drift
- `mysql-to-postgres-local-import-rehearsal-plan` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_065_MYSQL_POSTGRES_LOCAL_IMPORT_REHEARSAL_PLAN.md`
- the local-only import rehearsal plan defines table order, transform rules, reset/retry strategy, verification queries, parity checks, pass/review/fail criteria, and no-production guardrails
- `mysql-to-postgres-local-import-rehearsal-tooling` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_066_MYSQL_POSTGRES_LOCAL_IMPORT_REHEARSAL_TOOLING.md`
- local-only tooling now exists for guarded preflight, dry-run checks, reset-to-baseline, table-order import, and parity reporting; actual import was not executed
- `mysql-to-postgres-local-import-rehearsal-dry-run-report` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_067_MYSQL_POSTGRES_LOCAL_IMPORT_REHEARSAL_DRY_RUN_REPORT.md`
- the local-only preflight/dry-run report passed with `actualImportExecuted=false`, source row counts captured, source orphan/enum/DateTime checks clean, target counts empty, and Prisma drift reporting no difference
- `mysql-to-postgres-local-import-rehearsal-run-report` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_068_MYSQL_POSTGRES_LOCAL_IMPORT_REHEARSAL_RUN_REPORT.md`
- the first actual local-only import rehearsal imported all 98 local MySQL rows into disposable Postgres validation with explicit reset/execute/confirm flags; post-import row counts and aggregate parity passed, orphan/enum/DateTime checks stayed clean, and the two self-conversation rows remain review-only parity data
- `local-postgres-dev-switch-plan` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_069_LOCAL_POSTGRES_DEV_SWITCH_PLAN.md`
- local development is allowed to switch to Postgres without preserving local MySQL data; production remains a separate controlled migration path that requires a self-contained runbook usable outside this chat context
- `Wave 30 / LOCAL_POSTGRES_DEV_SWITCH` exists in `docs/waves/LOCAL_POSTGRES_DEV_SWITCH.md`
- `local-postgres-dev-switch-implementation` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_070_LOCAL_POSTGRES_DEV_SWITCH_IMPLEMENTATION.md`
- active local Prisma provider is now `postgresql`; local Postgres env examples/docs exist, the clean local schema was applied to disposable Postgres, and Prisma client generation completed
- `local-postgres-dev-smoke` is passed by user report for the migration/runtime path
- `prisma-7-local-upgrade` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_071_LOCAL_POSTGRES_DEV_SMOKE_PRISMA7.md`
- Prisma CLI/client packages are now `7.8.0`; datasource URL resolution moved to `prisma.config.ts`, and backend Prisma runtime uses the Postgres driver adapter
- `local-mysql-retirement` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_072_LOCAL_MYSQL_RETIREMENT.md`
- active local development now uses Postgres; MySQL remains only as an explicit legacy/rehearsal/production-migration source, and rehearsal tooling requires `MYSQL_REHEARSAL_SOURCE_DATABASE_URL` instead of active `DATABASE_URL`
- `production-postgres-migration-runbook-plan` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_073_PRODUCTION_POSTGRES_MIGRATION_RUNBOOK_PLAN.md`
- `docs/runbooks/PRODUCTION_POSTGRES_MIGRATION_RUNBOOK.md` now exists as a self-contained operator-facing plan covering environment inventory, backups, restore verification, staging rehearsal, maintenance/write-freeze, export/import, parity checks, deploy order, secret updates, smoke tests, rollback, monitoring, and incident/output capture
- `production-current-state-inventory-env-gap-audit` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_074_PRODUCTION_CURRENT_STATE_ENV_GAP_AUDIT.md`
- the production runbook now documents known VPS/PM2/Nginx/current deploy/server `.env` facts, current reborn/runtime env requirements, obsolete Clerk/UploadThing env handling, required secret rotation, and the future order: maintenance -> deploy reborn -> maintenance/process smoke -> DB migration/cutover -> full DB-backed smoke

Remaining:
- production provider switch has not been performed yet
- staging rehearsal has not been performed yet
- production-safe migration tooling or command path still needs separate review/implementation
- maintenance/write-freeze mechanism is not defined yet
- production server env inventory, PM2 topology, Nginx routing, and secret rotation order still need operator review before server deploy
- Postgres target installation/hosting strategy is still undecided
- production maintenance/deploy/cutover planning is intentionally deferred until the final production migration window

## Next Correct Step

The active next track is `Stage 8 / Media MVP`.

The next Stage 8 segment should be `browser-sfu-adapter`.

The next correct Stage 6 production step remains deferred by operator decision and is not the active next track.

When production migration work resumes at the end of the local/reborn migration path:

1. start `production-reborn-maintenance-deploy-plan`
2. define the exact maintenance/write-freeze mechanism, reviewed server `.env` inventory template, PM2 web/API topology, Nginx routing plan, and secret rotation order
3. document maintenance/process smoke that can run before DB cutover, and keep full DB-backed smoke after Postgres import/`DATABASE_URL` cutover
4. keep the planned order: maintenance -> merge/deploy reborn to main/prod -> DB migration/cutover -> full DB-backed smoke
5. track the reported microphone/media issue separately from Stage 6 database migration work

### Stage 7. Media Preparation

Status: `planning complete / implementation queued`

Current wave:
- `Wave 32 / MEDIA_STACK_TECHNOLOGY_DECISION`

Intent:
- prepare the architecture for the future media rewrite
- replace the managed/LiveKit-shaped media runtime with a project-owned media boundary
- keep current LiveKit runtime in place until a later scoped implementation wave

Current rule:
- do not patch isolated LiveKit/microphone symptoms unless explicitly requested
- do not add media dependencies or deploy media infra without a scoped implementation wave
- keep production Stage 6 cutover deferred until the end

Done:
- target stack is fixed as `mediasoup + coturn`
- `mediasoup` is the target SFU/media routing layer
- `coturn` is the target TURN/STUN/NAT traversal layer
- `apps/api` is the target signaling/control-plane owner
- target product model is Discord-like persistent channels plus private calls and future Zoom-like meetings/conferences
- all interaction modes should share one media engine/control-plane; differences belong in room scope and permissions
- self-hosted LiveKit is not the target architecture; it is only a possible temporary bridge
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md` documents the decision
- `docs/delegation/briefs/SEGMENT_BRIEF_075_MEDIA_STACK_TECHNOLOGY_DECISION.md` documents the segment result
- `media-runtime-inventory` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_076_MEDIA_RUNTIME_INVENTORY.md`
- current LiveKit runtime flow, channel/private-call differences, token inputs, join/leave behavior, device startup/error handling, reconnect/disconnect behavior, and coupling points are documented
- current runtime risks are documented: direct transitive `livekit-client` import, display-name token identity, caller-provided room/username, no explicit auth/domain guard in the media controller file, broad publish/subscribe grants, and no project-owned reconnect/screen-share/participant lifecycle
- `media-contract-boundary-inventory` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_077_MEDIA_CONTRACT_BOUNDARY_INVENTORY.md`
- missing vendor-neutral media contract areas are documented: room scope/mode, stable participant/session identity, granular permissions, room and participant lifecycle, desired vs published media state, track model, reconnect model, screen-share policy, error taxonomy, client commands, and server events
- contract boundary rule is fixed: private calls, channel calls, future meetings, and large-room/stage modes must share one media engine/control-plane and differ by room scope and permissions
- `media-contract-shape-design` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`
- concrete docs-only contract shapes are documented for room scope/mode, participant/session identity, permissions, desired vs published state, track model, lifecycle commands/events, reconnect/resume, screen-share policy, error taxonomy, client commands, and server event names
- `media-control-plane-design` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_079_MEDIA_CONTROL_PLANE_DESIGN.md`
- future `apps/api` media ownership is documented for `MediaAccessService`, `MediaRoomService`, `MediaParticipantSessionService`, `MediaPermissionService`, `MediaSignalingGateway`, and a provider adapter boundary
- REST command ownership, WebSocket/signaling event ownership, auth/domain checks, backend-resolved room scope, stable participant/session identity, lifecycle flow, permission evaluation, reconnect/resume, screen-share policy, and transitional LiveKit bridge direction are documented
- `media-client-boundary-design` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_080_MEDIA_CLIENT_BOUNDARY_DESIGN.md`
- future web/desktop media client ownership is documented for the app UI shell, media entry mapper, media feature controller/hook, SDK commands, realtime event subscription, provider adapter, and browser capture/renderer layer
- project media state, browser device state, and provider adapter state are separated, while current channel/private-call entry behavior, leave redirects, preferred-device fallback, user-visible device errors, and transitional LiveKit containment are preserved
- `sfu-turn-architecture-design` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`
- future topology is documented for `apps/api` control-plane traffic, mediasoup WebRTC media traffic, coturn STUN/TURN relay traffic, local dev assumptions, single-server VPS production MVP, security, scaling, and observability
- SFU/TURN guardrail is fixed: no media dependencies, infra, env, firewall, Docker, systemd, Nginx, or production deploy changes before a separate implementation segment
- `livekit-adapter-containment` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_082_LIVEKIT_ADAPTER_CONTAINMENT.md`
- current LiveKit coupling is documented across backend token signing, SDK token action, `MediaRoom` LiveKit components/runtime/styles/device handling, `NEXT_PUBLIC_LIVEKIT_URL`, and `.lk-disconnect-button` leave detection
- staged backend/client containment is documented for `LiveKitMediaProviderAdapter`, `LiveKitClientAdapter`, future app-core contracts, SDK commands, backend adapter, client adapter, and parity smoke
- `media-mvp-implementation-plan` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_083_MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md` defines the ordered MVP implementation roadmap, dependencies, guardrails, acceptance criteria, rollback/fallback rules, production rollout boundary, and first code segment recommendation

Remaining:
- none for Stage 7 planning

Next likely work:
- continue Stage 8 with `browser-sfu-adapter`, not Stage 6 production-track work and not a one-shot media rewrite

### Stage 8. Media MVP

Status: `in progress / backend mediasoup transport prototype ready`

Current wave:
- `Wave 33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Intent:
- deliver the first working project-owned media path without LiveKit for private/small-room flow
- keep current LiveKit runtime as fallback/bridge until parity passes
- implement in small scoped PRs, not one rewrite

Current rule:
- do not remove LiveKit before parity
- do not add production media infra/deploy/env changes in MVP code segments
- do not mix media MVP work with Stage 6 production database cutover

Done:
- ordered MVP implementation roadmap exists in `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `app-core-media-contracts-code` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_084_APP_CORE_MEDIA_CONTRACTS_CODE.md`
- vendor-neutral media contract types are exported from `packages/app-core/src/contracts/media-provider.ts` through the existing `packages/app-core/src/contracts/index.ts` barrel
- room scope/mode, participant session identity, permissions, desired/published state, track model, lifecycle, reconnect/resume, screen-share policy, error taxonomy, and command/event names now have app-core type shapes
- `sdk-media-command-surface` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_085_SDK_MEDIA_COMMAND_SURFACE.md`
- future SDK media commands are exported from `packages/sdk/src/actions/media.ts` while the current `getLiveKitToken` runtime path remains compatible
- `backend-livekit-adapter-containment` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_086_BACKEND_LIVEKIT_ADAPTER_CONTAINMENT.md`
- current backend token generation is delegated through `MediaProviderAdapter` / `LiveKitMediaProviderAdapter` while `GET /api/media/livekit-token` keeps the same request and response shape
- `client-livekit-adapter-containment` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_087_CLIENT_LIVEKIT_ADAPTER_CONTAINMENT.md`
- current client LiveKit components, styles, `Room`, media device failure handling, preferred-device fallback, and disconnect-button detection are contained in `LiveKitClientAdapter` while `MediaRoom` keeps the current token and route entry flow
- `livekit-parity-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_088_LIVEKIT_PARITY_SMOKE.md`
- static/build parity checks passed for the current LiveKit path; manual authenticated browser/device/LiveKit session smoke remains review-only
- `backend-media-control-plane-implementation` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_089_BACKEND_MEDIA_CONTROL_PLANE_IMPLEMENTATION.md`
- `apps/api` media now has `MediaAccessService`, `MediaRoomService`, `MediaParticipantSessionService`, and `MediaPermissionService` skeleton ownership
- authenticated control-plane endpoints now exist for room resolve, join, leave, and close while the compatibility `GET /api/media/livekit-token` path remains unchanged
- channel and conversation media scope access now resolves backend-owned profile/member/session identity before transitional LiveKit provider access
- `client-media-controller-boundary` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_090_CLIENT_MEDIA_CONTROLLER_BOUNDARY.md`
- channel and private media route entries now map to app-core media room scope/mode shapes before reaching the runtime feature
- `useMediaRoomController` can call backend `joinRoom`/`leaveRoom` while keeping `getLiveKitToken` as the active LiveKit fallback token path
- `LiveKitClientAdapter` remains the active provider UI and route leave redirects are unchanged
- `local-mediasoup-dependency-prototype` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_091_LOCAL_MEDIASOUP_DEPENDENCY_PROTOTYPE.md`
- server-side `mediasoup@3.19.22` is installed locally, with Bun trusting the mediasoup postinstall needed for the worker binary
- `MediasoupPrototypeService` can lazily create a local worker/router behind an authenticated debug health endpoint
- current LiveKit token/provider/client runtime remains unchanged and no coturn, browser SFU client package, UI switch, or production infra was added
- `local-coturn-turn-credential` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_092_LOCAL_COTURN_TURN_CREDENTIAL.md`
- `TurnCredentialService` can issue short-lived local TURN REST credentials from server-side local env
- authenticated `GET /api/media/prototype/turn/credentials` returns `urls`, `username`, `credential`, `ttlSeconds`, and expiry metadata when local env is configured
- TURN credential issuance is disabled in production runtime and when local TURN env is absent
- `backend-mediasoup-transport-prototype` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_093_BACKEND_MEDIASOUP_TRANSPORT_PROTOTYPE.md`
- `MediasoupPrototypeService` can create local send/receive WebRTC transport metadata from the existing worker/router
- authenticated `POST /api/media/prototype/mediasoup/transports` returns `transportId`, ICE parameters, ICE candidates, DTLS parameters, and optional local TURN credential metadata
- authenticated `POST /api/media/prototype/mediasoup/transports/:transportId/connect` provides the connect skeleton for future browser DTLS parameters
- mediasoup transport prototype creation and connect remain disabled in production runtime

Remaining:
- run `browser-sfu-adapter`
- run `mvp-private-small-room-replacement`
- run `final-media-mvp-parity-load-smoke`

Next likely work:
- start `browser-sfu-adapter`

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
