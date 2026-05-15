# SEGMENT BRIEF 102. Private SFU Browser Smoke Env Stabilization

Branch:
- `wave/stage8-private-sfu-browser-smoke-env-stabilization`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-browser-smoke-env-stabilization`

## Goal

Stabilize the repeatable local browser smoke environment after the private SFU SSE signaling lifecycle change and get clean direct plus TURN private SFU browser smoke results without expanding the replacement scope.

## What Changed

Browser smoke environment:
- `tests/browser/private-sfu-two-user-smoke.spec.ts` now defaults to one hostname profile: `localhost`.
- added `PRIVATE_SFU_SMOKE_HOST`, `PRIVATE_SFU_SMOKE_API_PORT`, `PRIVATE_SFU_SMOKE_WEB_PORT`, and `PRIVATE_SFU_SMOKE_SCHEME` profile knobs.
- explicit `PRIVATE_SFU_SMOKE_API_URL` and `PRIVATE_SFU_SMOKE_WEB_URL` remain supported.
- the smoke now fails early when API and web URLs use different hostnames, because API-issued auth cookies must be visible to the Next route guard.
- API base URLs ending in `/api` are normalized so test calls do not produce duplicate `/api/api/...` paths.

Playwright ownership:
- added `bun run test:browser:private-sfu` as the dedicated repo-owned entrypoint for the guarded private SFU browser smoke.
- `bun run test:browser` remains safe without local services because the smoke is skipped unless `PRIVATE_SFU_BROWSER_SMOKE=1`.
- Playwright remains the root project dependency; no ad hoc temporary Playwright install is required.

Preserved:
- private SFU path is still explicit-gated to non-production conversation routes by `?video=true&mediaProvider=sfu` or `?video=true&sfu=true`.
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- SSE producer lifecycle and explicit producer/consumer cleanup remain unchanged.
- leave redirect remains `/servers/:serverId/conversations/:memberId`.
- no production infra/env/nginx/firewall/deploy changes were made.

## Exact Smoke Env Used

Direct local profile:
- API: `bun.cmd run dev:api`
- API env:
  - `API_PORT=4000`
  - `API_CORS_ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005`
  - `LOCAL_MEDIASOUP_LISTEN_IP=127.0.0.1`
- Web: `bun.cmd run dev:front`
- Web env:
  - `PORT=3001`
  - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
  - `API_INTERNAL_URL=http://localhost:4000`
- Smoke env:
  - `PRIVATE_SFU_BROWSER_SMOKE=1`
  - `PRIVATE_SFU_SMOKE_HOST=localhost`
  - `PRIVATE_SFU_SMOKE_API_PORT=4000`
  - `PRIVATE_SFU_SMOKE_WEB_PORT=3001`
- Command:
  - `bun.cmd run test:browser:private-sfu`

TURN local profile:
- coturn: `docker compose -f infra/coturn/docker-compose.local.yml up -d`
- local-only coturn env:
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-stage8-turn-secret`
  - `LOCAL_TURN_EXTERNAL_IP=127.0.0.1`
  - `LOCAL_TURN_RELAY_MIN_PORT=49160`
  - `LOCAL_TURN_RELAY_MAX_PORT=49170`
- API env additionally:
  - `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
  - `LOCAL_TURN_STATIC_AUTH_SECRET=local-stage8-turn-secret`
  - `LOCAL_TURN_TTL_SECONDS=600`
  - `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
  - `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- Smoke env additionally:
  - `PRIVATE_SFU_SMOKE_TRANSPORT=turn`
- Command:
  - `bun.cmd run test:browser:private-sfu`

## Browser Smoke Result

Direct private two-user smoke:
- status: `pass`
- result: `1 passed`
- both authenticated participants reached `connected`.
- each participant observed exactly one remote producer.
- ordinary private URL without SFU query did not render `private-sfu-provider`.
- leave redirect stayed `/servers/:serverId/conversations/:memberId`.

TURN private relay smoke:
- status: `pass`
- result: `1 passed`
- local Docker coturn was used with relay-only browser mode via `sfuTransport=turn`.
- both authenticated participants reached `connected`.
- each participant observed exactly one remote producer.
- ordinary private URL without SFU query remained LiveKit/fallback.
- leave redirect stayed `/servers/:serverId/conversations/:memberId`.

## Acceptance Result

Pass:
- `bun.cmd run test:browser` is safe without the smoke env flag.
- `PRIVATE_SFU_BROWSER_SMOKE=1` direct path passes cleanly.
- `PRIVATE_SFU_BROWSER_SMOKE=1` plus TURN env and `PRIVATE_SFU_SMOKE_TRANSPORT=turn` passes cleanly.
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU SSE lifecycle remains intact.

Blocked:
- none for local direct/TURN private SFU browser smoke.

Review:
- real device capture parity remains separate from this synthetic-track smoke.
- mediasoup registry/signaling state remains process-local prototype state.

## Handoff

What changed:
- stabilized the local browser smoke host/API/cookie profile.
- added a dedicated private SFU Playwright smoke script.
- documented the direct and TURN env profiles that produced clean passes.

Direct smoke result:
- `pass`

TURN smoke result:
- `pass`

Remaining blockers before small-room/channel replacement:
- small-room/channel replacement still needs explicit scoped planning and parity acceptance.
- real microphone/camera capture parity and user controls remain separate work.
- process-local mediasoup signaling/registry is still acceptable for local MVP smoke only, not production rollout.

Recommended next segment:
- `final-media-mvp-parity-load-smoke`

Reason:
- local private SFU direct and TURN smoke gates are now clean after SSE lifecycle stabilization; the next step should compare MVP behavior against LiveKit and decide whether any broader replacement work can start.

## Verification Performed

Commands:
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_TRANSPORT=turn bun.cmd run test:browser:private-sfu`
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`

Notes:
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` skipped the guarded smoke without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
