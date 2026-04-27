# Wave 24. Storage Access Policy Foundation

## Goal

This wave continues `Stage 5` after runtime reads already have a backend-owned access path.

Wave task:
- define and narrow the next storage read/access policy step
- decide how far the project should move beyond public redirect-based file access
- keep the current managed-cloud path stable while preparing stronger long-term ownership

## Position in the Main Plan

Mapping:
- `Wave 21 / STORAGE_METADATA_OWNERSHIP_FOUNDATION` = first move toward backend-owned file metadata/key ownership
- `Wave 22 / CLERK_REPO_CLEANUP` = optional repo-hygiene side cleanup
- `Wave 23 / STORAGE_RUNTIME_READ_RESOLUTION` = backend-owned runtime read/file-access path
- `Wave 24 / STORAGE_ACCESS_POLICY_FOUNDATION` = next policy step for public-vs-signed/private backend-issued access

## In Scope

- storage access policy foundation
- public redirect vs stronger backend-issued access direction
- narrowing historical compatibility without breaking the active path

## Out of Scope

- full private-file platform redesign
- broad storage schema migration
- self-hosted `MinIO`
- `Redis`
- unrelated auth/media/database work

## Constraints

- keep the active managed-cloud path stable
- keep the change reviewable and policy-focused
- do not turn this into a general storage-platform rewrite

## Expected Direction

- decide whether current public redirect resolution stays only transitional
- prepare a stronger backend-owned read/access contract
- keep legacy compatibility narrow and explicit

## Current Result

- new stored upload values can now carry an explicit backend-owned access contract marker (`access=backend-redirect`) instead of relying on implicit public-URL assumptions
- backend storage access resolution now returns explicit access policy metadata (`kind`, `upstream`, `legacy compatibility`) instead of exposing public redirect behavior only as an implementation detail
- the active managed-cloud path stays stable: runtime reads still go through backend-owned `/api/storage/access`, while the underlying provider continues to resolve to public object URLs for now
- legacy public URL compatibility remains narrow and explicit, and is surfaced as compatibility metadata instead of staying silent fallback behavior
- current working decision is fixed for this stage: files stay `public`, active reads stay on `backend-redirect`, and legacy URLs are not mass-migrated
- if a sweeper is introduced later, the preferred direction is a narrow staged/temp-upload sweeper rather than a full orphan scanner over the whole bucket

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_RUNTIME_READ_RESOLUTION.md](./STORAGE_RUNTIME_READ_RESOLUTION.md)
