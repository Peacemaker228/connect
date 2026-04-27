# Wave 19. Storage Managed Cloud Validation

## Goal

This wave continues `Stage 5` after the real `S3-compatible` provider already exists in code.

Wave task:
- validate the new storage provider against a real managed-cloud bucket
- confirm the required dev/prod env contract
- verify that the current runtime upload contract still works end-to-end

## Result

Completed by this wave:
- live managed-cloud validation passed
- the current backend-owned upload flow works end-to-end against a real `S3-compatible` managed provider
- dev bucket/credentials/env contract were proven in practice
- runtime image host handling was aligned for the managed-cloud storage host
- the main staged-upload orphan cleanup flows were tightened without broad redesign

Observed limitation:
- if the app or tab is killed during an in-flight upload, a later background sweeper would still be the only fully reliable cleanup answer

## Position in the Main Plan

Mapping:
- `Wave 17 / STORAGE_FOUNDATION` = backend storage boundary and foundation
- `Wave 18 / STORAGE_S3_PROVIDER_IMPLEMENTATION` = real `S3-compatible` provider implementation
- `Wave 19 / STORAGE_MANAGED_CLOUD_VALIDATION` = live bucket validation and env confirmation

## In Scope

- real managed-cloud bucket validation
- env wiring for local/dev and future prod shape
- smoke testing the current upload flow through the new provider

## Out of Scope

- broad storage redesign
- self-hosted `MinIO`
- `Redis`
- metadata normalization
- UploadThing removal if validation is still incomplete
- unrelated auth/media/database work

## Constraints

- keep the current upload/runtime contract stable
- do not widen this step into a new storage architecture phase
- use managed cloud first

## Next Logical Step

After this validation wave, the next correct move is:
- narrow the remaining `UploadThing` compatibility layer
- keep the active storage path on the real managed-cloud `S3-compatible` provider
- avoid jumping early into metadata redesign or self-hosted infra

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](./STORAGE_FOUNDATION.md)
- [STORAGE_S3_PROVIDER_IMPLEMENTATION.md](./STORAGE_S3_PROVIDER_IMPLEMENTATION.md)
