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

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_RUNTIME_READ_RESOLUTION.md](./STORAGE_RUNTIME_READ_RESOLUTION.md)
