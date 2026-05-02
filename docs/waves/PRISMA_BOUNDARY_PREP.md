# Wave 28. Prisma Boundary Prep

## Goal

This wave starts `Stage 6 / MySQL -> Postgres` without changing the database provider yet.

Wave task:
- prepare Prisma and data-contract boundaries for a later controlled `MySQL -> Postgres` migration
- remove generated Prisma type leakage from `packages/sdk` and browser/shared UI contracts
- inventory and then reduce the remaining `Next` server-side direct Prisma reads one route-family slice at a time
- keep current runtime behavior stable while the project becomes less coupled to the generated MySQL-backed Prisma client

## Position in the Main Plan

Mapping:
- `Wave 26 / WEB_RUNTIME_API_EXTRACTION` closed the direct-backend runtime/API cleanup
- `Wave 27 / VENDOR_REPO_CLEANUP` closed dead vendor repo cleanup after `Stage 5A`
- `Wave 28 / PRISMA_BOUNDARY_PREP` is the first wave of `Stage 6`
- this wave is preparation for `MySQL -> Postgres`, not the provider switch itself

## Current Runtime Decision

- `apps/api` remains the backend owner for active domain/runtime data access
- `PrismaService` in `apps/api` can continue owning backend Prisma access
- direct `src/app/*` Prisma reads have been removed from the web shell
- the old web-shell Prisma helper `src/lib/shared/utils/db.ts` has been removed after a clean caller sweep
- `packages/sdk` and browser/shared UI should not keep depending on generated Prisma model types as long-term contracts
- no segment in this wave should change `DATABASE_URL`, Prisma datasource provider, schema provider, production DB, or migration cutover behavior

## Current Inventory

Known Prisma boundary findings are documented in:

- [SEGMENT_BRIEF_055_PRISMA_BOUNDARY_INVENTORY.md](../delegation/briefs/SEGMENT_BRIEF_055_PRISMA_BOUNDARY_INVENTORY.md)

Main findings:
- backend-owned Prisma usage is already concentrated in `apps/api` services through `PrismaService`
- the former web-shell Prisma helper `src/lib/shared/utils/db.ts` has been removed
- the previously direct `src/app/*` server component reads now use backend-owned API contracts/helpers
- `packages/sdk` and client/shared UI no longer import generated Prisma model/enum types from `@prisma/client`

## Current Progress

Done:
- `packages/sdk` no longer imports generated Prisma model/enum types from `@prisma/client`
- browser/shared UI no longer imports generated Prisma model/enum types from `@prisma/client`
- the setup route no longer reads Prisma directly from the web shell and now uses the backend-owned servers API for initial routing
- server routing guards under `src/app/(main)/(routes)/servers/[serverId]` no longer read Prisma directly from the web shell
- conversation bootstrap under `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]` no longer reads Prisma directly from the web shell
- invite validation under `src/app/(invite)/(routes)/invite/[inviteCode]` no longer reads Prisma directly from the web shell
- final caller sweep found no remaining `src/lib/shared/utils/db.ts` callers, and the unused helper was removed

Remaining route-family candidates:
- none currently known in `src/app`
- none currently known in web/shared runtime code

## In Scope

- introducing stable app-core/API DTOs and enums for SDK/UI-facing contracts
- removing `@prisma/client` imports from `packages/sdk`
- removing `@prisma/client` imports from browser/shared UI in narrow follow-up slices
- documenting temporary Next server-side direct Prisma reads and reducing them route-family by route-family when backend/SDK replacements exist
- small backend-only Prisma service hardening if separately scoped and verified

## Out of Scope

- changing Prisma datasource provider from `mysql` to `postgresql`
- changing `DATABASE_URL`
- writing cross-database data migration scripts
- running production/staging database cutover
- removing all `src/app/*` server-side reads in one broad rewrite
- changing auth/storage/media runtime behavior
- starting media rewrite or `React + Vite`

## Constraints

- keep the first slices boundary-only and runtime-stable
- do not mix provider switch with SDK/UI type-contract cleanup
- do not reintroduce `Next` API/proxy ownership
- preserve direct-backend runtime assumptions from `Stage 5A`
- keep backend Prisma ownership in `apps/api`

## Closeout Result

`Wave 28 / PRISMA_BOUNDARY_PREP` is complete as a boundary-prep wave:

- `packages/sdk` is free of generated Prisma client imports
- browser/shared UI is free of generated Prisma client imports
- `src/app/*` no longer performs direct Prisma reads through the web-shell helper
- `src/lib/shared/utils/db.ts` has been removed
- backend-owned Prisma usage remains in `apps/api`

The next Stage 6 work should be a separate provider-switch/data-migration plan. This wave does not change Prisma schema, migrations, datasource provider, or `DATABASE_URL`.

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
