# Segment Brief 174: Staging-Safe Media SFU Enable Gate

Branch: `wave/stage9-staging-safe-media-sfu-enable-gate`
Segment: `staging-safe-media-sfu-enable-gate`
Date: 2026-06-05

## Goal

Add a server-only staging/preprod gate that lets the operator verify mediasoup/SFU readiness on staging while keeping `NODE_ENV=production`, without enabling production defaults and without weakening the LiveKit fallback.

## Problem

The staging API runs with `NODE_ENV=production`. Before this segment, mediasoup prototype health and prototype transport/producer/consumer endpoints returned disabled responses in production runtime. Setting staging to `NODE_ENV=development` is not acceptable, and browser-visible `NEXT_PUBLIC_*` default gates must not become production enablement.

## Implementation

Added server-only env gate:

```text
MEDIA_ENABLE_STAGING_SFU
```

Accepted truthy values:
- `1`
- `true`
- `yes`

Default behavior:
- unset, empty, or any other value is false.
- non-production local/dev behavior is unchanged.
- production runtime remains disabled unless `MEDIA_ENABLE_STAGING_SFU` is truthy.

Runtime behavior:
- `MediaRuntimeConfigService.isLocalMediaPrototypeEnabled()` centralizes the production guard:
  - enabled when `NODE_ENV !== 'production'`
  - enabled when `MEDIA_ENABLE_STAGING_SFU` is truthy
  - disabled otherwise
- `MediasoupPrototypeService` now uses that central guard for health, transport create/connect, produce, consume, producer/consumer close/pause/resume, producer discovery, heartbeat, stale cleanup, counters, and lifecycle logs.
- `TurnCredentialService` uses the same gate so staging TURN transport checks can receive backend-issued short-lived TURN credentials only under the explicit staging SFU gate.
- `MediaRuntimeConfigSnapshot.sfu` exposes non-secret gate metadata:
  - `stagingSfuEnabled`
  - `stagingSfuGateSource`
- The snapshot does not expose env values, real IPs, TURN credentials, secrets, cookies, or auth headers.

## Guardrails

- No `NEXT_PUBLIC_*` default gate was added or changed.
- No production SFU default was enabled.
- LiveKit fallback and the LiveKit token path remain preserved.
- No production VPS, production env, real server env file, secret, cookie, auth header, TURN credential, or Stage 6/Postgres production migration was touched.
- No direct/TURN media smoke was run.

## Operator Follow-Up

After this branch is merged and deployed to the staging VPS, the operator should add the gate only to the staging server-local API env source, for example:

```text
MEDIA_ENABLE_STAGING_SFU=1
```

Then rebuild/restart the staging API process using the existing staging deploy/runbook path. Do not add this gate to browser env, `.env.production`, committed env examples containing real values, or production VPS env.

## Readiness Classification

- staging-safe SFU server gate: `pass / implemented`
- production default switch: `not changed / blocked`
- LiveKit fallback: `preserved / required`
- staging media smoke: `not run / still next segment`
- Stage 6/Postgres production migration: `untouched`

## Recommended Next Segment

Recommended next: `production-media-staging-pre-smoke-readiness-rerun`.

The rerun should deploy this code to staging, set `MEDIA_ENABLE_STAGING_SFU=1` only in the staging API server-local env, restart API, and verify authenticated mediasoup health before any direct/TURN media smoke.
