# Segment Brief 177: Staging Safe Web SFU Smoke Gate

Branch: `wave/stage9-staging-safe-web-sfu-smoke-gate`
Segment: `staging-safe-web-sfu-smoke-gate`
Date: 2026-06-06

## Goal

Add a staging-safe web/client SFU smoke gate so the production-built staging web can run explicit browser SFU smoke paths without enabling production defaults or weakening LiveKit fallback.

## Problem

Segment 176 preflight passed on staging, but full browser smoke was blocked before start:

- staging API SFU readiness works through the server-only `MEDIA_ENABLE_STAGING_SFU=1` gate;
- staging web is built with `NODE_ENV=production`;
- `/media/sfu-smoke` redirected under the production web build;
- explicit browser SFU query paths such as `?mediaProvider=sfu` and `?sfu=true` could not enter SFU because the client gate required non-production runtime.

Running smoke without a web/client gate would have produced false LiveKit/fallback evidence.

## Scope Guardrails

- No full direct/TURN media smoke was run.
- No production VPS or production env was touched.
- No real secrets, private keys, passwords, database URLs, generated TURN credentials, cookies, auth headers, or env values are recorded here.
- No production SFU/default gate was enabled.
- Existing `NEXT_PUBLIC_MEDIA_*_DEFAULT_*` and pilot gates remain default-off and non-production guarded.
- LiveKit fallback and rollback query behavior remain preserved.
- Stage 6/Postgres production migration path was not changed.

## Implementation

Added public build-time smoke gate:

- `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE`
- public, non-secret, browser-visible, build-time
- staging/preprod smoke only
- default: disabled
- accepted truthy values: `1`, `true`, `yes`

Code changes:

- Added `src/lib/shared/features/media/staging-sfu-smoke-gate.ts`.
- `/media/sfu-smoke` now allows access when:
  - `NODE_ENV !== production`, or
  - `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE` is truthy.
- `MediaRoom` explicit SFU paths now open when:
  - the existing explicit SFU request rules match, and
  - either `NODE_ENV !== production` or the staging smoke gate is truthy.

## Preserved Behavior

Default SFU behavior remains unchanged:

- ordinary private `?video=true` remains LiveKit unless its own approved gate is enabled;
- channel `AUDIO` default remains LiveKit unless its existing default/pilot gates are enabled in non-production;
- channel `VIDEO` default remains LiveKit unless its existing default/pilot gates are enabled in non-production;
- this smoke gate does not turn on `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE`;
- this smoke gate does not turn on `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT`;
- this smoke gate does not turn on `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE`;
- this smoke gate does not turn on `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_PRODUCT_DEFAULT_PILOT`;
- this smoke gate does not turn on `NEXT_PUBLIC_MEDIA_PRIVATE_SFU_DEFAULT_CANDIDATE`.

Explicit LiveKit rollback remains first-class:

- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

Those queries still prevent the SFU provider request path.

## Staging Operator Instructions

After merging/deploying this segment to the separate staging VPS only:

1. Fetch and checkout the approved merged commit in `/var/www/ax-connect-staging`.
2. Add `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE=1` only to `/etc/ax-connect-staging/web.env`.
3. Keep `MEDIA_ENABLE_STAGING_SFU=1` only in `/etc/ax-connect-staging/api.env`.
4. Rebuild the web bundle with the staging web env loaded.
5. Restart `ax-connect-staging-web`.
6. Do not add this gate to production env.
7. Do not enable production SFU/default gates.

## Final Classification

- staging web/client smoke gate: `implemented`
- backend server-only gate: `unchanged / MEDIA_ENABLE_STAGING_SFU`
- production default SFU: `not enabled`
- default/pilot gates: `unchanged`
- LiveKit fallback: `preserved`
- full direct/TURN media smoke: `not run`
- production VPS/env/defaults: `untouched`

## Recommended Next Segment

Recommended next: `production-media-staging-smoke-run-report-rerun`.

Run it only after the merged commit is deployed to staging, `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE=1` is present in staging web env, the web bundle is rebuilt, and staging API/web health checks pass.
