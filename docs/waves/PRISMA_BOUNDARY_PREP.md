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
- `src/lib/shared/utils/db.ts` and direct `src/app/*` Prisma reads are temporary web-shell server-side reads
- `packages/sdk` and browser/shared UI should not keep depending on generated Prisma model types as long-term contracts
- no segment in this wave should change `DATABASE_URL`, Prisma datasource provider, schema provider, production DB, or migration cutover behavior

## Current Inventory

Known Prisma boundary findings are documented in:

- [SEGMENT_BRIEF_055_PRISMA_BOUNDARY_INVENTORY.md](../delegation/briefs/SEGMENT_BRIEF_055_PRISMA_BOUNDARY_INVENTORY.md)

Main findings:
- backend-owned Prisma usage is already concentrated in `apps/api` services through `PrismaService`
- `src/lib/shared/utils/db.ts` still creates a second Prisma runtime for the `Next` web shell
- several `src/app/*` server components still read directly from Prisma for setup, invite validation, server routing, channel/member validation, and conversation bootstrap
- `packages/sdk` and client/shared UI still import generated Prisma model/enum types from `@prisma/client`

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

## First Correct Slice

The first implementation slice should be:

- remove generated Prisma type leakage from `packages/sdk`
- add or reuse stable DTOs/enums in `packages/app-core`
- keep backend services, Prisma schema, migrations, datasource provider, and runtime behavior unchanged

This should be done before moving Next server-side reads or changing any database provider configuration.

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
