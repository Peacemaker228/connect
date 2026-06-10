# Segment Brief 186: Customer Staging Storage Write Permission Fix

## Metadata

- Branch: `feature/customer-staging-storage-write-permission-fix`
- Segment: `customer-staging-storage-write-permission-fix`
- Type: staging storage diagnostic / display follow-up
- Status: `partial pass / storage write restored externally; backend-redirect image display fixed locally`

## Context

Segment 184 isolated the local upload failure to Object Storage write authorization: local storage env was present, `ListObjectsV2` passed, and app-like `PutObject` failed with `AccessDenied`.

This segment initially checked the real staging runtime path and found that staging had an additional blocker before an app upload smoke could pass: the `ax-connect-staging-api` PM2 runtime did not expose `STORAGE_*` variables at that time.

After the operator cancelled accidental Yandex Cloud deletion, local S3 writes recovered and staging `POST /api/storage/upload` returned `200 OK` by user report. The remaining staging issue was display-only: uploaded image links opened directly, but `next/image` requested them through `/_next/image?.../api/storage/access...` and received `400 Bad Request` because the optimizer was not a reliable path for backend-redirect storage reads on the staging Next server.

No storage provider architecture, env value, DB schema, production configuration, bucket public write setting, or secret value was changed.

## Required Reading Completed

- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_184_CUSTOMER_PRIORITY_LOW_RISK_UX_FIXES.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_171_PRODUCTION_MEDIA_STAGING_ENV_SETUP_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_172_PRODUCTION_MEDIA_STAGING_ENV_SETUP_RUN_REPORT.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_173_PRODUCTION_MEDIA_STAGING_PRE_SMOKE_READINESS_RUN_REPORT.md`
- `apps/api/src/modules/storage/storage.controller.ts`
- `apps/api/src/modules/storage/storage.service.ts`
- `apps/api/src/modules/storage/s3-compatible-storage.provider.ts`
- `apps/api/src/common/config/storage.config.ts`
- Yandex Object Storage official documentation for static keys, roles, bucket policies, upload, ACL, and encryption.

## App Upload Path Confirmed

Server avatar upload:

- frontend endpoint: `serverImage`
- backend route: `POST /api/storage/upload`
- controller: `apps/api/src/modules/storage/storage.controller.ts`
- service policy folder: `server-images`
- provider: `S3CompatibleStorageProvider`
- write operation: `PutObjectCommand`
- finalize operation after domain save: `HeadObjectCommand` plus `CopyObjectCommand` with metadata replacement
- delete/cleanup operation: `DeleteObjectCommand`

Message file upload:

- frontend endpoint: `messageFile`
- backend route: `POST /api/storage/upload`
- service policy folder: `message-files`
- provider write operation: `PutObjectCommand`

The exact app-side failing operation for upload is `PutObject`.

## Redacted Staging Runtime Check

Checked on the separate staging VPS as `deploy` using the existing operator SSH key.

Redacted result:

```text
/etc/ax-connect-staging/api.env readable: true
storage names in /etc/ax-connect-staging/api.env: none
ax-connect-staging-api PM2 runtime STORAGE_* names: none
ax-connect-staging-api PM2 status: online
yc CLI on staging: not installed
```

Classification:

- staging storage env presence: `fail / missing from API runtime`
- staging app upload smoke: `blocked before S3 write test`
- staging server-local env source: `/etc/ax-connect-staging/api.env`

Because `STORAGE_*` is absent from the running staging API process, a staging avatar upload cannot be accepted as fixed yet, even if the cloud-side bucket permissions are corrected.

## Redacted Local Candidate Credential Diagnostic

Local `.env.local` still has the expected S3-compatible env names. Values were not printed.

Redacted result:

```text
source: .env.local
endpoint present: true
bucket present: true
region present: true
public base URL present: true
access key present: true
secret key present: true
key prefix present: false
ListObjectsV2: pass
PutObject under server-images/__diagnostics__: fail / AccessDenied / HTTP 403
DeleteObject cleanup: skipped because PutObject failed
```

Additional redacted metadata checks with the same local candidate credentials:

```text
GetBucketPolicy: AccessDenied / HTTP 403
GetBucketEncryption: ServerSideEncryptionConfigurationNotFoundError / HTTP 404
GetObjectLockConfiguration: AccessDenied / HTTP 403
GetBucketAcl: readable; grant count recorded without values
```

Classification:

- candidate env shape: `pass`
- candidate read/list access: `pass`
- candidate write access: `fail / PutObject AccessDenied`
- diagnostic object left behind: `no`

## Staging Upload Display Follow-up

After accidental Yandex Cloud deletion was cancelled by the operator:

- local S3 writes recovered by operator report;
- staging `POST /api/storage/upload` for `messageFile` returned `200 OK` by browser evidence;
- direct click/open of the uploaded image worked;
- inline chat display still failed because `next/image` requested `/_next/image?url=/api/storage/access?...` and received `400 Bad Request`.

Fix:

- storage images that are already mediated by backend-owned `/api/storage/access` now render with `next/image` `unoptimized`;
- this keeps layout/lazy behavior from `next/image`, but skips the server-side optimizer fetch path that was failing on staging;
- the browser now requests `/api/storage/access` directly, which is the same path that already works when clicked;
- image attachment `alt` no longer uses serialized `storage://v1?...` message content, so broken-image fallback text is not the raw storage value.

Files changed for this follow-up:

- `src/lib/chat/features/chat-item.tsx`
- `src/lib/shared/features/file-upload.tsx`
- `src/lib/navigation/features/navigation-item.tsx`

## Root Cause

There are two separate blockers:

1. Staging runtime blocker:
   - `ax-connect-staging-api` does not currently have `STORAGE_*` env in PM2 runtime.
   - App upload on staging cannot work until staging-specific storage env is added to `/etc/ax-connect-staging/api.env` and the API process is restarted.

2. Object Storage permission blocker:
   - The available local candidate static key can list the bucket but cannot upload an app-like object.
   - This points to Yandex Object Storage IAM role, bucket policy, ACL/ownership, prefix restriction, object-lock, or KMS/key permissions.

## Required Operator Fix

Use staging-specific values only. Do not reuse production storage and do not commit values.

1. Add or correct these values in `/etc/ax-connect-staging/api.env`:

```env
STORAGE_BUCKET=<present>
STORAGE_S3_ENDPOINT=<present>
STORAGE_S3_ACCESS_KEY_ID=<present>
STORAGE_S3_SECRET_ACCESS_KEY=<present>
STORAGE_PUBLIC_BASE_URL=<present>
STORAGE_S3_REGION=<present-if-required>
STORAGE_S3_FORCE_PATH_STYLE=<present-if-required>
STORAGE_KEY_PREFIX=<optional-staging-prefix>
```

2. In Yandex Cloud, verify the static access key belongs to the intended staging service account.

3. Grant the service account enough write permissions for the staging bucket or staging prefix:

- at minimum for upload/finalize/read: list bucket, head/get object, put object, copy/overwrite object metadata;
- for avatar replacement, delete, and staged upload cleanup: delete object is also required;
- if using Yandex IAM roles, `storage.uploader` can cover upload/read but not delete; app cleanup/delete paths need a role or bucket policy that allows delete, commonly `storage.editor` or a narrower equivalent policy;
- if using bucket policy, include both the bucket resource and object resources, and include the active prefixes:
  - `server-images/*`
  - `message-files/*`
  - or `<STORAGE_KEY_PREFIX>/server-images/*` and `<STORAGE_KEY_PREFIX>/message-files/*` if a prefix is configured.

4. Check bucket policy deny rules:

- an empty applied bucket policy denies access;
- explicit deny rules override public access and IAM allow rules;
- do not enable bucket-wide public write.

5. If bucket encryption is enabled:

- give the service account KMS key permissions for upload/download, such as `kms.keys.encrypterDecrypter` or the narrower upload/download pair required by the actual use.

6. If Object Lock or retention is enabled:

- verify it does not block app overwrites/deletes for staged upload finalize and cleanup.

7. Restart only the staging API after env changes:

```bash
pm2 restart ax-connect-staging-api --update-env
pm2 save
```

## Safe After-Fix Diagnostics

Run with output redacted:

```text
env presence from /etc/ax-connect-staging/api.env
ListObjectsV2 against the app prefix
PutObject of a tiny temporary image under server-images/__diagnostics__
DeleteObject cleanup if PutObject passes
```

Then smoke through the app:

```text
change server avatar on staging
confirm the displayed avatar resolves through the backend storage access route/public URL
confirm no secret appears in logs/docs
```

## Verification

Passed locally:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

Not passed / blocked:

- staging `PutObject` diagnostic after operator cloud recovery: not rerun from this shell;
- staging image display smoke after the local `unoptimized` fix: pending deploy/browser confirmation;
- Yandex Object Storage permission fix: fixed externally by operator report; this shell still has no configured `yc` CLI or cloud-console/admin access.

## Intentionally Not Touched

- production storage, env, bucket, IAM, or data;
- staging DB data or schema;
- storage architecture/provider;
- upload API contract;
- unread notifications;
- mentions;
- media/WebRTC/coturn/mediasoup/LiveKit;
- bucket-wide public write;
- secret values in docs or commits.

## Rollback Note

If staging storage env is added and upload behavior worsens, remove or restore only the staging storage lines in `/etc/ax-connect-staging/api.env`, restart `ax-connect-staging-api` with `--update-env`, and keep production untouched. If a Yandex bucket policy or IAM role is changed, revert only that staging bucket/service-account binding to the previous operator-known state.

## Result

- root cause: accidental Yandex Cloud deletion caused the original write failure by operator report; after cancellation, write recovered, and the remaining app bug was `next/image` optimizer usage against backend-redirect storage access URLs;
- exact storage-side setting fixed: `fixed externally by operator / cloud deletion cancelled`;
- diagnostics before: staging API runtime has no `STORAGE_*`; local candidate `ListObjectsV2` passes and `PutObject` fails with `AccessDenied`;
- diagnostics after: local S3 writes pass by operator report; staging upload returns `200 OK` by operator/browser report;
- staging smoke: upload passes by operator report; image display fix is local and pending deploy/browser confirmation;
- production: `untouched`;
- secret handling: no secret values printed or committed.

## Recommended Next Segment

`customer-staging-storage-env-and-yandex-permission-operator-run`

Keep this as the next segment until staging `PutObject` and server avatar upload pass. After storage is green, return to `customer-unread-message-badges-and-sound-plan`.
