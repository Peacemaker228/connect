# Wave 22. Clerk Repo Cleanup

## Goal

This is an optional side-cleanup wave after the active auth replacement work is already complete.

Wave task:
- remove leftover repo/package/electron naming traces of `Clerk`
- keep the current backend-owned auth runtime untouched
- avoid reopening `Stage 4` architecture work

## Position in the Main Plan

Mapping:
- `Stage 4` auth replacement path is already functionally complete
- `Wave 22 / CLERK_REPO_CLEANUP` is repo hygiene, not a new auth migration wave

## In Scope

- dead or legacy `Clerk` package references
- stale `Clerk` naming in desktop bridge/electron glue
- docs/runbook cleanup where it no longer reflects the real auth architecture

## Out of Scope

- new auth redesign
- reopening middleware/runtime/session architecture
- storage/media/database work

## Constraints

- do not change the active backend-owned auth flow
- keep this as a narrow cleanup
- if a `Clerk` reference is still functionally needed, do not delete it blindly

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
