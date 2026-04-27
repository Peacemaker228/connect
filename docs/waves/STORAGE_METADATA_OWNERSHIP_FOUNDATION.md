# Wave 21. Storage Metadata Ownership Foundation

## Goal

This wave continues `Stage 5` after the active managed-cloud provider path is stable and `UploadThing` is no longer part of the active runtime path.

Wave task:
- begin moving storage ownership away from raw vendor URLs
- introduce stronger file metadata / file-key ownership direction
- keep the current runtime behavior stable while preparing later normalization
- allow a tiny dead-dependency cleanup for the remaining `Clerk` package/env leftovers only if it does not reopen auth work

## Position in the Main Plan

Mapping:
- `Wave 17 / STORAGE_FOUNDATION` = backend storage boundary and foundation
- `Wave 18 / STORAGE_S3_PROVIDER_IMPLEMENTATION` = real `S3-compatible` provider implementation
- `Wave 19 / STORAGE_MANAGED_CLOUD_VALIDATION` = live bucket validation and env confirmation
- `Wave 20 / STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP` = compatibility narrowing after successful validation
- `Wave 21 / STORAGE_METADATA_OWNERSHIP_FOUNDATION` = first move toward backend-owned file metadata/key ownership

## In Scope

- storage metadata/file-key ownership foundation
- reducing reliance on raw vendor URLs as the long-term source of truth
- keeping the current runtime contract stable during the first normalization step

## Out of Scope

- full storage schema redesign in one step
- self-hosted `MinIO`
- `Redis`
- broad abandoned-upload job architecture
- unrelated auth/media/database work

## Constraints

- keep the active managed-cloud path stable
- prefer reviewable foundation work over big-bang storage rewrite
- do not widen this into a general database migration
- if `Clerk` cleanup is touched here, it must stay a dead-dependency cleanup only, not a return to `Stage 4`

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](./STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [STORAGE_MANAGED_CLOUD_VALIDATION.md](./STORAGE_MANAGED_CLOUD_VALIDATION.md)
- [STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md](./STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP.md)
