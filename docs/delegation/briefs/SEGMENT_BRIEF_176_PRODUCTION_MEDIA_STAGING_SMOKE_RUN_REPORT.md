# Segment Brief 176: Production Media Staging Smoke Run Report

Branch: `wave/stage9-production-media-staging-smoke-run-report`
Segment: `production-media-staging-smoke-run-report`
Date: 2026-06-06

## Goal

Run the first staging-only media smoke on the separate staging VPS and record redacted evidence for direct SFU, channel SFU, TURN relay, cleanup convergence, and LiveKit rollback readiness.

## Scope Guardrails

- Production VPS was not touched.
- Production env was not changed.
- No production SFU/default gate was enabled.
- LiveKit fallback was not removed.
- No real secrets, private keys, passwords, database URLs, generated TURN credentials, cookies, auth headers, or env values are recorded here.
- Storage upload smoke remained out of scope because staging storage env is explicitly deferred.
- Stage 6/Postgres production migration path was not changed.

## Preflight Evidence

Operator-guided staging preflight passed before any media smoke was started:

- Deployed commit: `40dab370279a3d963c6e589201536bcfb65c09a9`
- Commit summary: `40dab37 Merge pull request #130 from Peacemaker228/wave/stage9-staging-safe-media-sfu-enable-gate`
- PM2 web/API processes were online.
- HTTPS API health returned `status: ok`.
- Nginx config test passed.
- Docker Postgres was healthy.
- Docker coturn was running.
- Coturn logs showed config loaded and private peer ranges blacklisted; log metadata was treated as operational and redacted for repo documentation.
- The mediasoup worker binary was present and executable.
- `MEDIA_ENABLE_STAGING_SFU=1` was present only in the staging API env.
- `MEDIA_ENABLE_STAGING_SFU` was confirmed absent from the staging web env.
- Storage remained explicitly deferred for media-only smoke scope.
- Fresh authenticated session creation passed.
- Authenticated mediasoup health returned:
  - HTTP `200`
  - status: `ready`
  - enabled: `true`
  - worker pid present
  - router id present
  - router closed: `false`
  - router codec count: `3`
  - active room count: `0`
  - active transport count: `0`
  - active producer count: `0`
  - active consumer count: `0`
  - runtime staging SFU enabled: `true`
  - TURN URLs configured
  - TURN secret configured
  - SFU announced address configured
  - SFU RTC range status: `ready`
- LiveKit token path returned HTTP `200` and token presence was confirmed without printing the token.

## Blocker Found Before Smoke

Full browser media smoke was not started.

Code inspection found that staging API SFU readiness is open through the server-only gate, but the production-built staging web still keeps browser SFU entrypoints behind client/page production guards:

- `/media/sfu-smoke` redirects when the web bundle is built with `NODE_ENV=production`.
- Explicit browser SFU query paths such as `?mediaProvider=sfu` and `?sfu=true` do not enter SFU in `MediaRoom` unless the client-side non-production guard is open.
- Ordinary private/channel routes would therefore produce a false LiveKit/fallback result instead of exercising the SFU browser path.

Because of this, running the direct/channel/TURN smoke matrix in this segment would not provide valid SFU evidence.

## Final Classification

- staging preflight: `pass`
- authenticated app/session: `pass`
- authenticated mediasoup API health: `pass / ready`
- coturn readiness: `pass / running`
- LiveKit token path: `pass`
- full direct/TURN media smoke: `not run`
- blocker: `staging web SFU entrypoints remain production-guarded`
- final classification: `blocked before media smoke`

## Required Follow-Up

Add a scoped staging-safe web/client SFU smoke gate before retrying the smoke run:

- public build-time gate: `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE`
- default: off
- accepted truthy values: `1`, `true`, `yes`
- allow `/media/sfu-smoke` only when non-production or the explicit staging smoke gate is enabled
- allow explicit SFU browser query paths under this gate without enabling default production SFU behavior
- preserve LiveKit rollback queries: `?mediaProvider=livekit`, `?livekit=true`, and `?sfu=false`

## Recommended Next Segment

Recommended next: `staging-safe-web-sfu-smoke-gate`.

After that gate is deployed only to staging web env and the web bundle is rebuilt, rerun the staging smoke as `production-media-staging-smoke-run-report-rerun`.
