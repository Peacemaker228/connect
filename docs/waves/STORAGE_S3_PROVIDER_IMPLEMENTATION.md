# Wave 18. Storage S3 Provider Implementation

## Goal

This wave continues `Stage 5` after the backend storage foundation already exists.

Wave task:
- implement a real managed-cloud `S3-compatible` storage provider in `apps/api`
- keep the current upload/runtime contract stable
- move active storage ownership away from the temporary `UploadThing` backend adapter

## Result

Completed by this wave:
- a real managed-cloud `S3-compatible` provider now exists in `apps/api`
- the storage selector can route active ownership to it
- the runtime upload contract stays stable
- the earlier backend upload policy gap is tightened

Still not done:
- live validation against a real managed-cloud bucket
- final decision on how long `UploadThing` fallback should remain
- any broader metadata/public-vs-private redesign

## Position in the Main Plan

Mapping:
- `Wave 17 / STORAGE_FOUNDATION` = backend storage boundary and foundation
- `Wave 18 / STORAGE_S3_PROVIDER_IMPLEMENTATION` = real `S3-compatible` provider implementation

## In Scope

- real `S3-compatible` provider implementation in `apps/api`
- provider wiring through existing storage module/config
- keeping the current runtime upload shape stable
- managed cloud first
- tightening explicit backend upload policy where the new backend-owned path is still under-specified

## Out of Scope

- self-hosted `MinIO` rollout
- `Redis`
- `Postgres` migration
- media rewrite
- broad storage metadata redesign
- unrelated runtime refactors

## Constraints

- do not break the current `/api/server-upload` contract
- do not widen the scope into infra rollout
- do not mix this wave with file-processing or background-job architecture
- keep `UploadThing` removable, but do not reopen finished auth stages

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_FOUNDATION.md](./STORAGE_FOUNDATION.md)

## Next Logical Step

After this wave, the next correct step is a managed-cloud validation checkpoint:
- verify the new provider against a real bucket
- verify dev/prod env shape
- only then decide the next storage refactor
