# Wave 23. Storage Runtime Read Resolution

## Goal

This wave continues `Stage 5` after write/delete ownership has already moved toward backend-controlled metadata.

Wave task:
- reduce active runtime dependence on stored public URLs as the only read mechanism
- prepare backend-issued file access / runtime read resolution
- keep the current managed-cloud storage path stable while narrowing legacy read compatibility

## Position in the Main Plan

Mapping:
- `Wave 17 / STORAGE_FOUNDATION` = backend storage boundary and foundation
- `Wave 18 / STORAGE_S3_PROVIDER_IMPLEMENTATION` = real `S3-compatible` provider implementation
- `Wave 19 / STORAGE_MANAGED_CLOUD_VALIDATION` = live bucket validation and env confirmation
- `Wave 20 / STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP` = compatibility narrowing after successful validation
- `Wave 21 / STORAGE_METADATA_OWNERSHIP_FOUNDATION` = first move toward backend-owned file metadata/key ownership
- `Wave 22 / CLERK_REPO_CLEANUP` = optional repo-hygiene side cleanup outside the main storage track
- `Wave 23 / STORAGE_RUNTIME_READ_RESOLUTION` = first move toward backend-owned runtime read/file-access resolution

## In Scope

- runtime read/file-access ownership foundation
- reducing active dependence on stored public URLs as the long-term read source of truth
- keeping current managed-cloud behavior stable while introducing a stronger backend read model

## Out of Scope

- full private-file redesign in one step
- broad storage schema redesign
- self-hosted `MinIO`
- `Redis`
- unrelated auth/media/database work

## Constraints

- keep the active managed-cloud path stable
- keep historical compatibility narrow and reviewable
- do not turn this into a general file-platform rewrite

## Expected Direction

- active runtime reads should start moving toward backend-issued file access resolution
- old public URLs may remain as transitional compatibility, but should stop being the only long-term read contract
- the storage boundary should own more of the read story, not only upload/delete

## Current Result

- active runtime consumers can move to a backend-owned storage access path instead of reading stored public URLs directly
- current managed-cloud `S3-compatible` storage still resolves to public object URLs under the hood, but the preferred active path can now be file-key-based resolution
- legacy public URLs may still be accepted as narrow compatibility input where key-based metadata is missing

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](./STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [STORAGE_MANAGED_CLOUD_VALIDATION.md](./STORAGE_MANAGED_CLOUD_VALIDATION.md)
- [STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md](./STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md)
- [STORAGE_METADATA_OWNERSHIP_FOUNDATION.md](./STORAGE_METADATA_OWNERSHIP_FOUNDATION.md)
