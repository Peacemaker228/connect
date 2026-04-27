# Wave 20. Storage UploadThing Compatibility Cleanup

## Goal

This wave continues `Stage 5` after the real managed-cloud `S3-compatible` provider is already validated in practice.

Wave task:
- narrow the remaining `UploadThing` compatibility layer
- keep the active storage path on the managed-cloud `S3-compatible` provider
- reduce storage-vendor overlap without broad metadata redesign
- remove or harden compatibility paths that do not have the same ownership guarantees as the managed-cloud provider

## Position in the Main Plan

Mapping:
- `Wave 17 / STORAGE_FOUNDATION` = backend storage boundary and foundation
- `Wave 18 / STORAGE_S3_PROVIDER_IMPLEMENTATION` = real `S3-compatible` provider implementation
- `Wave 19 / STORAGE_MANAGED_CLOUD_VALIDATION` = live bucket validation and env confirmation
- `Wave 20 / STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP` = compatibility narrowing after successful validation

## In Scope

- active-path cleanup around `UploadThing`
- narrowing fallback/compatibility usage
- keeping the runtime upload contract stable

## Out of Scope

- broad metadata redesign
- self-hosted `MinIO`
- `Redis`
- abandoned-upload sweeper architecture
- unrelated auth/media/database work

## Constraints

- keep the real managed-cloud `S3-compatible` provider as the active path
- do not break existing runtime upload behavior
- prefer narrow cleanup over large storage refactor

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](./STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
- [STORAGE_MANAGED_CLOUD_VALIDATION.md](./STORAGE_MANAGED_CLOUD_VALIDATION.md)
