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

The next Stage 8 segment should be `channel-audio-sfu-stale-session-cleanup-soak-rerun`.

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
- continue Stage 8 with `channel-audio-sfu-stale-session-cleanup-soak-rerun`, not Stage 6 production-track work and not a one-shot media rewrite

### Stage 8. Media MVP

Status: `in progress / channel audio SFU pilot soak review`

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
- the current LiveKit token / provider / client runtime remains unchanged, and no coturn, browser SFU client package, UI switch, or production infra was added
- `local-coturn-turn-credential` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_092_LOCAL_COTURN_TURN_CREDENTIAL.md`
- `TurnCredentialService` can issue short-lived local TURN REST credentials from server-side local env
- authenticated `GET /api/media/prototype/turn/credentials` returns `urls`, `username`, `credential`, `ttlSeconds`, and expiry metadata when local env is configured
- TURN credential issuance is disabled in production runtime and when local TURN env is absent
- `backend-mediasoup-transport-prototype` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_093_BACKEND_MEDIASOUP_TRANSPORT_PROTOTYPE.md`
- `MediasoupPrototypeService` can create local send/receive WebRTC transport metadata from the existing worker/router
- authenticated `POST /api/media/prototype/mediasoup/transports` returns `transportId`, ICE parameters, ICE candidates, DTLS parameters, and optional local TURN credential metadata
- authenticated `POST /api/media/prototype/mediasoup/transports/:transportId/connect` provides the connect skeleton for future browser DTLS parameters
- mediasoup transport prototype creation and connect remain disabled in production runtime
- `browser-sfu-adapter` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_094_BROWSER_SFU_ADAPTER.md`
- `mediasoup-client@3.20.0` is installed as the browser SFU client dependency
- mediasoup prototype health now exposes router RTP capabilities for browser `Device` loading
- SDK prototype actions now exist for mediasoup prototype health, transport creation, and transport connect
- `SfuClientAdapter` can load a mediasoup browser `Device`, create send/receive transports from backend metadata, wire DTLS connect through the backend skeleton, and pass local TURN credential metadata into `iceServers`
- `LiveKitClientAdapter` remains the default rendered media provider, and no current route is switched to SFU by default
- end-to-end media replacement is still not complete because producer/consumer server endpoints and client publish/consume/render wiring are not implemented
- `mediasoup-produce-consume-prototype` is complete in `docs/delegation/briefs/SEGMENT_BRIEF_095_MEDIASOUP_PRODUCE_CONSUME_PROTOTYPE.md`
- `MediasoupPrototypeService` now has local in-memory producer and consumer registries
- authenticated prototype endpoints exist for creating producers from RTP parameters and creating consumer metadata from compatible receive transports
- SDK prototype calls exist for produce and consume
- `SfuClientAdapter.produce(track)` can publish a browser track through an existing send transport
- `SfuClientAdapter.createConsumerMetadata(...)` and `SfuClientAdapter.consume(metadata)` can request and consume backend consumer metadata through an existing receive transport
- prototype consumers default to unpaused because no consumer resume command exists yet
- current `MediaRoom` still renders `LiveKitClientAdapter` by default, and no current route is switched to SFU
- `local-sfu-direct-turn-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_096_LOCAL_SFU_DIRECT_TURN_SMOKE.md`
- `MediaModule` imports `AuthModule` so authenticated media prototype endpoints can resolve `RequireAuthGuard` at Nest runtime
- a dev-only authenticated `/media/sfu-smoke` route can manually exercise `SfuClientAdapter` through health, send/recv transport creation, synthetic local audio produce, consumer metadata creation, and remote track consume
- `SfuClientAdapter.createTransport(...)` can accept `iceTransportPolicy`, allowing the smoke harness to force relay-only TURN review
- authenticated backend health and direct send/receive transport metadata creation passed locally
- full browser direct remote-track observation remains review-only in the current environment
- TURN smoke is blocked locally because local TURN env/coturn availability is not configured
- `local-sfu-browser-turn-smoke-rerun` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_097_LOCAL_SFU_BROWSER_TURN_SMOKE_RERUN.md`
- authenticated browser `/media/sfu-smoke` Direct run passed in Chromium
- direct smoke observed producer and consumer creation plus consumed remote track state `live`
- TURN relay smoke remains blocked because local `LOCAL_TURN_*` env is absent, `turnserver` / `coturn` is unavailable, and `127.0.0.1:3478` is not reachable
- `local-coturn-turn-relay-unblock` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_098_LOCAL_COTURN_TURN_RELAY_UNBLOCK.md`
- local-only Docker coturn runtime exists under `infra/coturn/docker-compose.local.yml`
- authenticated browser `/media/sfu-smoke` TURN relay run passed in Chromium using backend-issued REST credentials and relay policy
- TURN relay smoke observed producer and consumer creation plus consumed remote track state `live`
- coturn logs showed authenticated allocation and permission success against the host mediasoup announced-address peer
- `mvp-private-small-room-replacement` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_099_MVP_PRIVATE_SMALL_ROOM_REPLACEMENT.md`
- private conversation SFU path is now explicit-gated by `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`, limited to `conversation` entries, and disabled in production runtime
- normal private calls without the SFU query and all channel audio/video routes remain on `LiveKitClientAdapter`
- mediasoup prototype transport create/connect, producers, consumers, and producer discovery can now bind to backend-resolved `roomId` and `participantSessionId`
- authenticated private-route SFU smoke reached `review` with scoped local produce/consume loopback and leave redirect preserved
- `private-sfu-remote-producer-discovery-and-two-user-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_100_PRIVATE_SFU_REMOTE_PRODUCER_DISCOVERY_TWO_USER_SMOKE.md`
- gated private SFU now discovers and consumes remote producers from other participant sessions while excluding self producers
- backend producer close and latest-per-participant discovery prevent stale dev-remount producers from being subscribed
- authenticated two-user private browser smoke passed with both participants reaching `connected` and each observing one remote producer
- private TURN relay smoke passed locally through `sfuTransport=turn`, relay-only ICE policy, backend-issued TURN credentials, and coturn authenticated allocation/permission
- `private-sfu-signaling-lifecycle-and-controls` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_101_PRIVATE_SFU_SIGNALING_LIFECYCLE_CONTROLS.md`
- private SFU producer discovery in the gated adapter now uses authenticated project-owned SSE events instead of polling
- backend media prototype lifecycle events now cover producer snapshot, producer published, producer closed, and consumer closed
- explicit producer and consumer cleanup paths exist, and `SfuClientAdapter.close()` requests backend consumer cleanup before producer cleanup
- ordinary private calls and channel audio/video routes remain LiveKit, with SFU still explicit-gated to non-production conversation routes
- guarded Playwright browser smoke exists for repeatable two-user private SFU direct/TURN runs, but the latest local rerun remains review because host/API URL cookie mismatch and route-guard instability need a stabilized smoke env
- `private-sfu-browser-smoke-env-stabilization` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_102_PRIVATE_SFU_BROWSER_SMOKE_ENV_STABILIZATION.md`
- private SFU browser smoke now has a stable single-host local profile so API auth cookies and Next route guards do not diverge between `localhost` and `127.0.0.1`
- direct two-user private SFU browser smoke passed through the SSE lifecycle with both participants connected and one remote producer observed per participant
- TURN relay private SFU browser smoke passed locally through Docker coturn and relay-only query mode
- ordinary private calls and channel audio/video routes remain LiveKit, with SFU still explicit-gated to non-production conversation routes
- `final-media-mvp-parity-load-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_103_FINAL_MEDIA_MVP_PARITY_LOAD_SMOKE.md`
- final parity smoke confirms ordinary private `?video=true` remains LiveKit and channel `AUDIO`/`VIDEO` remain LiveKit
- gated private SFU direct and TURN browser smoke both passed again from the stabilized local profile
- private SFU leave redirect remained `/servers/:serverId/conversations/:memberId`
- screen-share is deferred for SFU, reconnect remains review, and real device controls/capture parity remain deferred
- broader small-room/channel replacement is on hold pending a narrower parity-hardening segment
- `private-sfu-device-controls-reconnect-parity` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_104_PRIVATE_SFU_DEVICE_CONTROLS_RECONNECT_PARITY.md`
- gated private SFU now supports explicit `sfuCapture=real` for non-production conversation routes while synthetic capture remains the repeatable smoke default
- basic private SFU microphone and camera controls now toggle captured local track enablement
- private SFU browser smoke now covers restart recovery
- direct synthetic private SFU smoke, direct real-capture fake-device smoke, and TURN synthetic private SFU smoke passed locally
- device controls/capture are `pass / review`: automated fake-device path passes, physical hardware/permission UX remains manual review
- reconnect/restart is `pass / review`: user-triggered restart passes, network interruption reconnect/resume remains review
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-manual-device-reconnect-qa` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_105_PRIVATE_SFU_MANUAL_DEVICE_RECONNECT_QA.md`
- operator manual synthetic private SFU smoke passed: two authenticated users joined the gated private SFU path without `sfuCapture=real`, both reached `connected`, both had producer/consumer ids, and both observed `Remote producers: 1`
- manual real-capture QA is `blocked / missing physical camera`; `sfuCapture=real` failed with `Requested device not found` on the operator machine
- permission/device UX is `review / camera-missing fallback needed`; the current real-capture path fails the whole call when camera capture is unavailable instead of degrading to audio-only where possible
- network interruption reconnect/resume remains `review / not manually executed`; Segment 104 only proved user-triggered restart recovery
- manual TURN relay with physical devices remains `review / not manually executed`; automated local coturn relay smoke remains pass from Segment 104
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-real-capture-device-fallback` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_106_PRIVATE_SFU_REAL_CAPTURE_DEVICE_FALLBACK.md`
- gated private SFU real capture now retries audio-only when requested audio+video capture fails because the camera is missing
- no-camera fallback UI reports `Camera not found; continuing audio-only` and disables the camera control when no video track exists
- direct synthetic private SFU smoke, direct real audio+video fake-device smoke, and direct simulated no-camera fallback smoke passed locally
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-operator-no-camera-fallback-rerun` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_107_PRIVATE_SFU_OPERATOR_NO_CAMERA_FALLBACK_RERUN.md`
- physical no-camera fallback rerun is `pass / operator confirmed`: two authenticated private SFU clients using `?video=true&mediaProvider=sfu&sfuCapture=real` reached audio-only real-capture behavior on the no-camera machine and real voice audio was heard in both directions
- the earlier one-sided hum was explained by one client still using synthetic capture; physical mic QA requires both clients to use `sfuCapture=real`
- Segment 106 remains the automated baseline for simulated missing-camera controls, including microphone toggle behavior and disabled camera control
- operator-observed inflated `Remote producers` counts and random stale audio were traced to stale SFU producers from older sessions in the same conversation room
- media join now supersedes older joined sessions for the same room identity, producer discovery cleans non-joined session producers, and leave closes scoped mediasoup resources
- stale producer lifecycle verification passed with two consecutive private SFU browser smokes plus a simulated no-camera fallback smoke on the same API process
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-network-interruption-reconnect-qa` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_108_PRIVATE_SFU_NETWORK_INTERRUPTION_RECONNECT_QA.md`
- gated private SFU now reports transient post-snapshot media signaling interruption as `reconnecting` instead of terminal `failed`
- browser offline-restore smoke passed with `PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1`, `PRIVATE_SFU_SMOKE_CAPTURE=real`, two authenticated users, stable remote producer count, restored `connected` status, and Restart SFU private call recovery
- simulated no-camera fallback smoke passed again after the reconnect/status change
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-physical-camera-turn-qa` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_109_PRIVATE_SFU_PHYSICAL_CAMERA_TURN_QA.md`
- physical camera QA is `deferred / no camera hardware available`; local Windows device checks did not find an active camera, so physical camera pass is not marked
- local TURN relay audio-only smoke passed through Docker coturn with `PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera` and `PRIVATE_SFU_SMOKE_TRANSPORT=turn`
- TURN physical/audio-only status remains `review`, because this segment did not include a human listening check over TURN with real microphone capture
- no-camera audio-only fallback remains `pass / preserved`
- ordinary private calls and channel audio/video routes remain LiveKit, with no broad replacement started
- `private-sfu-screen-share-mvp-decision` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_110_PRIVATE_SFU_SCREEN_SHARE_MVP_DECISION.md`
- SFU screen-share decision is `defer-for-MVP`; gated private SFU remains audio/video only for the current MVP readiness decision
- ordinary private calls and channel audio/video routes remain LiveKit, preserving current LiveKit `VideoConference` screen-share behavior outside the explicit non-production SFU gate
- future SFU screen-share implementation is split into a later narrow segment covering display capture, source-aware producer metadata, single active share policy, remote rendering, cleanup, and direct/TURN smoke
- `small-room-channel-sfu-readiness-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_111_SMALL_ROOM_CHANNEL_SFU_READINESS_PLAN.md`
- readiness decision is `ready-to-implement-gated-channel`, limited to a controlled non-production explicit channel SFU pilot
- first implementation should be channel `AUDIO` only; channel `VIDEO` follows after remote video layout/rendering and video smoke expectations are defined
- proposed channel gate is explicit query only, such as `?mediaProvider=sfu&sfuChannel=true` or `?sfu=true&sfuChannel=true`; default channel `AUDIO`/`VIDEO` remain LiveKit
- smoke/load matrix is defined for direct/TURN, two- and three-participant channel audio, leave/rejoin cleanup, restart recovery, offline/restore, no-camera fallback, and later channel video layout/load
- risks remain process-local mediasoup/signaling state, multi-user rendering, persistent-room stale sessions, permissions, deferred screen-share, deferred physical camera QA, and review-only physical TURN signoff
- `gated-channel-audio-sfu-pilot` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_112_GATED_CHANNEL_AUDIO_SFU_PILOT.md`
- channel `AUDIO` SFU now opens only with the non-production explicit channel gate `?mediaProvider=sfu&sfuChannel=true` or `?sfu=true&sfuChannel=true`
- direct two-user channel `AUDIO` browser smoke passed with both authenticated users connected, one remote producer observed per participant, audio-only requested media, restart recovery, and channel leave redirect preserved
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit even with `sfuChannel=true`, and ordinary private `?video=true` remains LiveKit
- guarded private SFU direct smoke passed again as a regression check
- channel `AUDIO` TURN and three-participant smoke remain deferred to the next narrow segment
- `gated-channel-audio-sfu-3user-turn-rejoin-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_113_GATED_CHANNEL_AUDIO_SFU_3USER_TURN_REJOIN_SMOKE.md`
- guarded channel `AUDIO` smoke now defaults to three authenticated participants and can run direct or TURN relay through env flags
- three-user direct channel `AUDIO` smoke passed with all users connected, two remote producers per participant, restart recovery, leave/rejoin cleanup, and no stale producer inflation
- three-user TURN relay channel `AUDIO` smoke passed through local Docker coturn and backend-issued local TURN credentials
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit, and private SFU direct smoke passed again as a regression check
- `gated-channel-audio-sfu-5user-load-offline-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_114_GATED_CHANNEL_AUDIO_SFU_5USER_LOAD_OFFLINE_SMOKE.md`
- five-user direct channel `AUDIO` smoke passed with all participants connected and four remote producers per participant
- explicit offline/restore passed in the five-user channel `AUDIO` smoke
- restart recovery and leave/rejoin cleanup passed again without stale producer inflation
- ordinary channel `AUDIO` without the gate remains LiveKit, channel `VIDEO` remains LiveKit, and private SFU direct smoke passed again as a regression check
- `channel-video-sfu-layout-readiness-plan` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_115_CHANNEL_VIDEO_SFU_LAYOUT_READINESS_PLAN.md`
- channel `VIDEO` SFU readiness decision is `ready-to-implement-gated-channel-video`, limited to a non-production explicit pilot and not a default switch
- proposed channel `VIDEO` gate requires channel scope, non-production runtime, explicit SFU provider, `sfuChannel=true`, and `sfuVideo=true`; ordinary channel `VIDEO` remains LiveKit without that full gate
- layout requirements are defined for 2, 3, and 5 participants, including participant-keyed remote media, one remote video tile per participant, audio-only placeholders, stable grid sizing, restart recovery, leave/rejoin cleanup, and no stale producer inflation
- capture/no-camera behavior is defined for channel `VIDEO`: real audio+video first, audio-only continuation when camera is missing and microphone capture succeeds, disabled camera control without a video track, and clear failure if no media can be captured
- direct/TURN channel `VIDEO` smoke matrix is defined, while LiveKit fallback/default, channel `AUDIO` SFU pilot behavior, and private SFU behavior remain preserved
- `gated-channel-video-sfu-layout-prototype` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_116_GATED_CHANNEL_VIDEO_SFU_LAYOUT_PROTOTYPE.md`
- channel `VIDEO` SFU now has a non-production full explicit gate requiring `mediaProvider=sfu` or `sfu=true`, `sfuChannel=true`, `sfuVideo=true`, and `sfuCapture=real`
- the SFU adapter now has a participant-grid remote video layout for channel `VIDEO`, with remote media keyed by `participantSessionId` and one remote video tile or audio-only placeholder per remote participant
- two-user channel `VIDEO` direct smoke passed with both users connected, `Remote producers: 2` per participant, visible local previews, one remote video tile per participant, no-camera audio-only fallback preserved, and channel leave redirect preserved
- channel `AUDIO` SFU regression passed, private SFU regression passed, ordinary channel `AUDIO` without the gate remained LiveKit, and ordinary channel `VIDEO` without the full gate remained LiveKit
- `gated-channel-video-sfu-3user-turn-rejoin-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_117_GATED_CHANNEL_VIDEO_SFU_3USER_TURN_REJOIN_SMOKE.md`
- guarded channel `VIDEO` smoke now supports configurable participant count, restart recovery, leave/rejoin cleanup, and TURN relay mode
- three-user direct channel `VIDEO` smoke passed with all users connected, `Remote producers: 4` per participant, two remote video tiles per participant, restart recovery, leave/rejoin cleanup, and no stale tile or producer inflation
- three-user TURN relay channel `VIDEO` smoke passed through local Docker coturn with the same producer count, video tile, restart, and leave/rejoin assertions
- channel `AUDIO` SFU regression passed, private SFU regression passed, ordinary channel `AUDIO` without the gate remained LiveKit, and ordinary channel `VIDEO` without the full gate remained LiveKit
- `gated-channel-video-sfu-5user-load-offline-smoke` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_118_GATED_CHANNEL_VIDEO_SFU_5USER_LOAD_OFFLINE_SMOKE.md`
- guarded channel `VIDEO` smoke now supports explicit `CHANNEL_VIDEO_SFU_SMOKE_OFFLINE_RESTORE=1`
- Playwright media device mode now supports explicit `PLAYWRIGHT_REAL_MEDIA=1`; default browser tests still use fake media devices for repeatability
- five-user direct channel `VIDEO` smoke passed with all users connected, `Remote producers: 8` per participant, four remote video tiles per participant, visible local fake-camera previews, restart recovery, leave/rejoin cleanup, and no stale tile or producer inflation
- explicit offline/restore passed in the five-user channel `VIDEO` smoke after one browser context was forced offline for 6 seconds and restored
- two-user headed physical camera rerun passed with an Android 13 phone exposed as Windows Virtual Camera and `PLAYWRIGHT_REAL_MEDIA=1`
- five-user TURN was not rerun because it is optional in this segment; Segment 117 three-user TURN channel `VIDEO` remains the current relay proof
- channel `AUDIO` SFU regression passed, private SFU regression passed, ordinary channel `AUDIO` without the gate remained LiveKit, and ordinary channel `VIDEO` without the full gate remained LiveKit
- `channel-video-sfu-physical-camera-turn-signoff` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_119_CHANNEL_VIDEO_SFU_PHYSICAL_CAMERA_TURN_SIGNOFF.md`
- two-user headed channel `VIDEO` SFU physical camera smoke passed with an Android 13 phone exposed through Phone Link / Windows Virtual Camera and `PLAYWRIGHT_REAL_MEDIA=1`
- two-user headed channel `VIDEO` SFU physical camera TURN smoke passed with `CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT=turn`; local coturn logs showed authenticated relay allocation, permission, channel bind, relay usage, and cleanup
- headed private SFU real-camera regression passed with `PRIVATE_SFU_SMOKE_CAPTURE=real`, preserving connected state, real audio+video producer count, controls, and leave redirect
- ordinary channel `VIDEO` without the full gate remained LiveKit, ordinary channel `AUDIO` without the gate remained LiveKit, and ordinary private `?video=true` remained LiveKit
- `channel-sfu-default-switch-readiness-decision` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_120_CHANNEL_SFU_DEFAULT_SWITCH_READINESS_DECISION.md`
- readiness decision is `review`: proceed only to a controlled non-production channel SFU default-candidate gate, not a broad product-facing or production default switch
- private SFU, channel `AUDIO` SFU, and channel `VIDEO` SFU have enough local/dev evidence across direct, TURN, offline/restore, restart, leave/rejoin, stale cleanup, physical camera where relevant, and LiveKit fallback preservation to justify the next reversible default-candidate segment
- product-facing default readiness remains `review` because SFU screen-share is deferred and subjective audio/video quality signoff may still be required before rollout
- production readiness remains `blocked` because mediasoup/signaling state is process-local and production TURN/SFU infra, firewall, process management, monitoring, runbook, and rollback procedure are intentionally not implemented
- ordinary channel `VIDEO`, ordinary channel `AUDIO`, and ordinary private `?video=true` remain LiveKit by default
- `channel-sfu-nonproduction-default-candidate-gate` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_121_CHANNEL_SFU_NONPRODUCTION_DEFAULT_CANDIDATE_GATE.md`
- non-production channel SFU default-candidate flags now exist for local/dev review: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE=1` and `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- explicit LiveKit rollback overrides are supported with `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`
- guarded channel `AUDIO` candidate smoke passed with 3 authenticated users, no per-URL SFU query, and real microphone capture mode
- guarded channel `VIDEO` candidate smoke passed with 2 authenticated users and no per-URL SFU query
- candidate flags remain off by default, the SFU render path remains production-blocked, and private default remains LiveKit
- `channel-sfu-nonproduction-candidate-soak-and-turn-rerun` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_122_CHANNEL_SFU_NONPRODUCTION_CANDIDATE_SOAK_TURN_RERUN.md`
- channel `AUDIO` candidate direct passed with 5 users, offline/restore, restart, leave/rejoin, real-capture mode, and rollback assertion
- channel `AUDIO` candidate TURN passed with 3 users through local Docker coturn and backend-issued TURN credentials
- channel `VIDEO` candidate direct passed with 3 users, remote video tiles, restart, leave/rejoin, no-camera fallback, and rollback assertion
- channel `VIDEO` candidate TURN passed with 3 users through local Docker coturn and backend-issued TURN credentials
- private SFU regression passed while ordinary private `?video=true` remained LiveKit by default
- `channel-sfu-product-default-readiness-decision` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_123_CHANNEL_SFU_PRODUCT_DEFAULT_READINESS_DECISION.md`
- channel `AUDIO` product default readiness is `pass for a limited non-production product-default pilot`
- channel `VIDEO` product default readiness is `review/hold` because SFU screen-share remains deferred
- private default readiness is `review/hold`; ordinary private `?video=true` remains LiveKit pending a separate parity/default decision
- production readiness is `blocked` by process-local mediasoup/signaling state and missing production media infra/runbook/monitoring/rollback
- `channel-audio-sfu-limited-nonproduction-default-pilot` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_124_CHANNEL_AUDIO_SFU_LIMITED_NONPRODUCTION_DEFAULT_PILOT.md`
- channel `AUDIO` now has a separate non-production product-default pilot gate: `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT=1`
- the pilot gate is channel `AUDIO` only, off by default, production-blocked, and keeps explicit LiveKit rollback through `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`
- guarded channel `AUDIO` pilot direct smoke passed with 5 users, no per-URL SFU query, real capture mode, offline/restore, restart, leave/rejoin, and rollback assertion
- guarded channel `AUDIO` pilot TURN smoke passed with 3 users through local Docker coturn and backend-issued TURN credentials
- private SFU regression passed with the audio pilot env enabled; ordinary private `?video=true` remains LiveKit by default
- channel `VIDEO` remains LiveKit by default unless the existing full explicit/candidate channel `VIDEO` SFU gate is used
- `channel-audio-sfu-limited-pilot-soak-observability` is documented in `docs/delegation/briefs/SEGMENT_BRIEF_125_CHANNEL_AUDIO_SFU_LIMITED_PILOT_SOAK_OBSERVABILITY.md`
- channel `AUDIO` pilot observability now has authenticated health counters for active mediasoup transports/producers/consumers/rooms
- channel `AUDIO` pilot observability now has non-production structured lifecycle logs for transport, producer, consumer, and session close events with active counts
- the SFU client status UI now shows `Transport: direct` or `Transport: turn`, and guarded channel `AUDIO` smoke asserts that value
- channel `AUDIO` pilot direct and TURN smokes passed again after the observability changes
- long-soak readiness remains `review` because raw process-local mediasoup counts can persist across dev smoke rooms/restarts/browser-context cleanup even though per-room user-facing producer discovery does not inflate remote producer counts

Remaining:
- add bounded stale-session cleanup/TTL/heartbeat and rerun soak before treating the limited channel `AUDIO` pilot as long-soak clean
- keep physical camera QA scoped as two-user headed Windows Virtual Camera pass; five-user load remains fake-device based
- optionally run human subjective audio/video quality signoff if required for release confidence
- process-local mediasoup/signaling state remains a production/multi-process blocker
- implement SFU screen-share later only if MVP parity or a later default-switch decision requires it
- production media infra/runbook remains separate and required before production default switch

Next likely work:
- run `channel-audio-sfu-stale-session-cleanup-soak-rerun`

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
