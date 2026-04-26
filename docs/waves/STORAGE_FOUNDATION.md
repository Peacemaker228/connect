# Wave 17. Storage Foundation

## Goal

This wave starts `Stage 5` after the active `Stage 4` auth-provider replacement work is complete.

Wave task:
- establish backend-owned storage foundation
- move the project toward a backend-owned `S3-compatible` storage model
- prefer a managed cloud provider first, not self-hosted infra first
- keep `Redis` out of this wave unless a concrete storage need appears
- leave `MinIO` as a later conscious self-hosted option, not the immediate first move

## Position in the Main Plan

Mapping:
- `Wave 14 / AUTH_CLERK_REMOVAL` = removal of `Clerk` from the active runtime auth path
- `Wave 15 / AUTH_RESIDUAL_CLERK_CLEANUP` = cleanup of remaining non-primary `Clerk` imports
- `Wave 16 / AUTH_STAGE4_COMPATIBILITY_CLEANUP` = final compatibility cleanup for provider replacement
- `Wave 17 / STORAGE_FOUNDATION` = start of `Stage 5` storage abstraction

Late deferred note:
- `email verification`
- `password reset`
- similar auth-product completeness work

These are intentionally deferred to the very end of the roadmap, before the final `Next.js -> React` decision.

## In Scope

- backend-owned storage foundation
- storage boundary cleanup
- choosing the near-term provider direction for storage
- keeping current upload flows stable while reducing storage lock-in

## Current Progress

Completed in the first storage step:
- `apps/api` now owns the active server-upload path through a backend storage module
- a backend storage provider token and service shape now exist
- the old `Next` upload route is reduced to a thin proxy
- multipart upload proxying to backend is handled centrally
- the project now has a documented cloud-first `S3-compatible` direction with no early `Redis`

Still not done in this wave family:
- the active provider is still `UploadThing`
- a real `S3-compatible` provider is not implemented yet
- storage metadata ownership is still compatibility-oriented, not fully normalized

## Current Decision for This Wave

For the current stage, the project should move toward:
- managed cloud `S3-compatible` object storage first
- no `Redis` as part of the initial storage foundation
- separate dev/prod buckets or prefixes

This means:
- do not introduce self-hosted `MinIO` yet
- do not introduce `Redis` just because storage work has started
- do not widen this wave into background jobs, image processing, or virus scanning pipelines

Current recommended direction:
- implement the storage boundary in `apps/api`
- make provider replacement possible
- prefer a provider such as `Cloudflare R2` first
- keep a later path open for `MinIO` if the project chooses stronger self-hosted independence later

## Out of Scope

- broad storage-platform rollout with self-hosted infra
- introducing `Redis` without a concrete storage-driven need
- immediate full replacement of `UploadThing` in the same large step if it widens the scope too much
- `Postgres` migration
- `LiveKit` replacement
- deferred late-roadmap auth-product completeness work
- broad unrelated refactors

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)

## Next Logical Step

After this foundation step, the next correct move is:
- implement the real managed-cloud `S3-compatible` provider in `apps/api`
- keep the runtime upload contract stable
- leave `MinIO` and `Redis` out of the next implementation step
