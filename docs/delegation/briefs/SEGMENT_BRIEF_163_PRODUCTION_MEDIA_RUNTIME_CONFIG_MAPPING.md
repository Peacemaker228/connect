# Segment Brief 163. Production Media Runtime Config Mapping

Branch:
- `wave/stage9-production-media-runtime-config-mapping`

Base/target:
- `core/reborn`

Wave:
- `34 / PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN`

Segment:
- `production-media-runtime-config-mapping`

## Goal

Add a production-safe backend runtime config boundary for media environment names so proposed `MEDIA_*` names are recognized before any production media rollout.

This is a config mapping foundation only. It does not enable production SFU/TURN, does not change real env files or secrets, does not remove LiveKit, and does not touch Stage 6/Postgres production migration work.

## Files Changed

Added:
- `apps/api/src/modules/media/media-runtime-config.service.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_163_PRODUCTION_MEDIA_RUNTIME_CONFIG_MAPPING.md`

Updated:
- `apps/api/src/modules/media/media.module.ts`
- `apps/api/src/modules/media/turn-credential.service.ts`
- `apps/api/src/modules/media/mediasoup-prototype.service.ts`
- `packages/sdk/src/actions/media.ts`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Runtime Mapping Implemented

`MEDIA_*` takes precedence when present; current local names remain compatibility fallbacks:

| Runtime config | Fallback | Behavior |
| --- | --- | --- |
| `MEDIA_TURN_URLS` | `LOCAL_TURN_URLS` | Trims comma-separated entries and returns only `turn:` / `turns:` URLs. |
| `MEDIA_TURN_STATIC_AUTH_SECRET` | `LOCAL_TURN_STATIC_AUTH_SECRET` | Used only server-side for TURN REST credential HMAC. Secret value is not exposed in health/debug output. |
| `MEDIA_TURN_TTL_SECONDS` | `LOCAL_TURN_TTL_SECONDS` | Clamped to the existing safe TTL range. |
| `MEDIA_SFU_LISTEN_IP` | `LOCAL_MEDIASOUP_LISTEN_IP` | Defaults to `127.0.0.1` when unset. |
| `MEDIA_SFU_ANNOUNCED_ADDRESS` | `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` | Empty values are treated as unset. |
| `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT` | n/a | Used as mediasoup WebRTC transport `portRange` when both values are valid. Invalid or reversed ranges fail transport creation with a non-secret reason. |
| `MEDIA_TURN_RELAY_MIN_PORT` / `MEDIA_TURN_RELAY_MAX_PORT` | `LOCAL_TURN_RELAY_MIN_PORT` / `LOCAL_TURN_RELAY_MAX_PORT` | Exposed as non-secret runtime metadata only; backend does not allocate coturn relay ports. |

## Behavior Compatibility

- Existing local/dev `LOCAL_*` TURN and mediasoup settings continue to work.
- Missing TURN config still returns disabled credential responses.
- Missing SFU listen config still defaults to local loopback as before.
- Existing response shapes remain compatible; mediasoup prototype health gained optional non-secret `runtimeConfig` metadata.
- `TurnCredentialService` no longer reads raw `process.env.LOCAL_TURN_*` directly.
- `MediasoupPrototypeService` no longer reads raw `LOCAL_MEDIASOUP_LISTEN_IP` or `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS` directly.

## Production Guard Status

- Existing `NODE_ENV === 'production'` guards remain in place.
- Production TURN credential issuance remains disabled.
- Production mediasoup prototype health/transport paths remain disabled.
- No production default/canary gate was enabled.
- LiveKit fallback and rollback controls remain unchanged.

## Direct Local Env Reads Left

- `LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS`
- `LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS`

These remain local prototype cleanup tuning knobs and are not part of the production media env mapping in this segment.

## Remaining Blockers

- production values, owners, and secret source are not filled
- process-local mediasoup/signaling state remains a production/multi-process blocker
- no production coturn deployment or readiness proof
- no production mediasoup process/runbook implementation
- no production-like soak
- no rollback drill
- no production monitoring/alerting
- LiveKit removal remains blocked
- Stage 6 production Postgres migration remains deferred and separate

## Verification

Run:

```powershell
git diff --check
rg -n "process\\.env\\.(LOCAL_TURN|LOCAL_MEDIASOUP)|MEDIA_TURN|MEDIA_SFU|LOCAL_TURN|LOCAL_MEDIASOUP" apps/api/src/modules/media docs/runbooks docs/waves docs/roadmap docs/delegation infra --glob "*.ts" --glob "*.md" --glob "*.example"
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
```

Optional if quick:

```powershell
bun.cmd run build:web
```

## Recommended Next Segment

Recommended next:
- `production-coturn-readiness-plan`

Do not proceed next to production default switch, LiveKit removal, firewall implementation, or Stage 6 production DB cutover.
