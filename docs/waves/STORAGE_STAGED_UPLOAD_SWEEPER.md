# Wave 25. Storage Staged Upload Sweeper

## Goal

This wave is the planned final narrow storage-hygiene step after `Wave 24`, before calling `Stage 5` complete.

Wave task:
- add a simple staged/temp-upload sweeper
- clean abandoned uploads without turning storage into a heavy reconciliation project
- avoid a full bucket-vs-DB orphan scanner

## Position in the Main Plan

Mapping:
- `Wave 24 / STORAGE_ACCESS_POLICY_FOUNDATION` = current storage access-policy step
- `Wave 25 / STORAGE_STAGED_UPLOAD_SWEEPER` = planned narrow storage-hygiene follow-up before `Stage 5` closure

## In Scope

- staged/temp-upload cleanup only
- time-based cleanup of abandoned upload artifacts
- narrow backend-owned hygiene flow inside the storage boundary

## Out of Scope

- full bucket-vs-DB orphan reconciliation
- broad storage metadata redesign
- self-hosted `MinIO`
- `Redis`
- unrelated auth/media/database work

## Constraints

- keep the active managed-cloud path stable
- keep the job narrow, explicit, and operationally cheap
- prefer simple age/prefix-based cleanup over global object reconciliation

## Why This Timing

- before `Wave 24`, the storage read/access contract is still settling
- much later, the storage context will be colder and cleanup debt may already accumulate
- right after `Wave 24`, the storage model should be stable enough for a narrow sweeper without reopening bigger storage design questions

## Current Result

- new backend-owned uploads are marked as `staged` in storage object metadata
- domain success-paths finalize staged files before persistence so the sweeper only targets abandoned temp uploads, not all stored files
- a bounded backend sweeper can now delete only aged objects that still remain `staged`
- cleanup stays intentionally narrow:
  - age-based
  - batch-limited
  - folder-bounded
  - no bucket-vs-DB reconciliation

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
- [STORAGE_ACCESS_POLICY_FOUNDATION.md](./STORAGE_ACCESS_POLICY_FOUNDATION.md)
