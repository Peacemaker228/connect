# Wave 27. Vendor Repo Cleanup

## Goal

This is the mandatory narrow repo cleanup after `Stage 5A` closeout, `Wave 22 / CLERK_REPO_CLEANUP`, and `Wave 20 / STORAGE_UPLOADTHING_COMPATIBILITY_CLEANUP`.

Wave task:
- remove remaining repo-level dead leftovers of `Clerk` and `UploadThing`
- clean docs/runbook/env wording that still presents them as active dependencies
- keep historical roadmap/wave references intact where they are needed as migration history
- remove the dead legacy `CLERK` auth-provider enum value after verifying the active auth runtime only uses `PASSWORD`

## Position in the Main Plan

Mapping:
- `Wave 26 / WEB_RUNTIME_API_EXTRACTION` completed the direct-backend runtime cleanup
- `Wave 27 / VENDOR_REPO_CLEANUP` is the completed post-`Stage 5A` vendor repo cleanup
- this wave must not reopen finished auth/storage architecture work

## Status

Status: `done`

Done:
- active code/package/config search found no remaining `Clerk` or `UploadThing` runtime dependency
- dead `UploadThing` wording was removed from the active storage provider error path
- legacy `CLERK` auth identity provider values were removed through a narrow Prisma migration
- current docs now describe this wave as mandatory post-`Stage 5A` cleanup instead of optional side cleanup

## In Scope

- dead package/env/doc leftovers
- dead naming/history leftovers in repo-level glue
- runbook/current-runtime text cleanup
- narrow data/schema cleanup for dead vendor enum values that are no longer active runtime providers

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
