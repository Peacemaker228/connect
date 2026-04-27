# Wave 27. Vendor Repo Cleanup

## Goal

This is an optional narrow side-cleanup after `Wave 22 / CLERK_REPO_CLEANUP` and `Wave 20 / STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP`.

Wave task:
- remove remaining repo-level dead leftovers of `Clerk` and `UploadThing`
- clean docs/runbook/env wording that still presents them as active dependencies
- keep historical roadmap/wave references intact where they are needed as migration history

## Position in the Main Plan

Mapping:
- `Wave 26 / WEB_RUNTIME_API_EXTRACTION` remains the main active path
- `Wave 27 / VENDOR_REPO_CLEANUP` is a tiny optional side cleanup
- this wave must not reopen finished auth/storage architecture work

## In Scope

- dead package/env/doc leftovers
- dead naming/history leftovers in repo-level glue
- runbook/current-runtime text cleanup

## Out of Scope

- auth redesign
- storage redesign
- rewriting historical wave docs just to remove migration-history mentions
- any work that changes active runtime behavior

## Constraints

- keep the cleanup tiny and reviewable
- do not touch historical references that are still useful as roadmap history
- prefer removing dead operational leftovers only

## References

- [PLATFORM_MIGRATION_PLAN.md](../roadmap/PLATFORM_MIGRATION_PLAN.md)
- [ARCHITECTURE.md](../roadmap/ARCHITECTURE.md)
- [BOUNDARIES.md](../roadmap/BOUNDARIES.md)
- [STAGE_STATUS.md](../roadmap/STAGE_STATUS.md)
