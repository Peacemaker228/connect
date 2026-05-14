# SEGMENT BRIEF 098. Local Coturn TURN Relay Unblock

Branch:
- `wave/stage8-local-coturn-turn-relay-unblock`

Segment:
- `local-coturn-turn-relay-unblock`

## Goal

Unblock and run local TURN relay smoke before `mvp-private-small-room-replacement`, without production infra/env/deploy changes, without opening unauthenticated relay, and without switching default media routes away from LiveKit.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`

Docs read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_097_LOCAL_SFU_BROWSER_TURN_SMOKE_RERUN.md`
- `infra/coturn/local-turn.env.example`

Local runtime checked:
- Docker availability
- existing local API/web listeners
- local port `3478`
- host IPv4 address for mediasoup announced address

## Files Changed

Added:
- `infra/coturn/docker-compose.local.yml`
- `docs/delegation/briefs/SEGMENT_BRIEF_098_LOCAL_COTURN_TURN_RELAY_UNBLOCK.md`

Changed:
- `infra/coturn/local-turn.env.example`
- `infra/coturn/README.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Local Coturn Runtime

How local coturn was raised:
- added `infra/coturn/docker-compose.local.yml`
- used Docker image `coturn/coturn:latest`
- bound TURN listener to `127.0.0.1:3478` for TCP/UDP
- bound local relay UDP range to `127.0.0.1:49160-49170`
- enabled TURN REST shared-secret auth with `--use-auth-secret`
- used a shell-only throwaway `LOCAL_TURN_STATIC_AUTH_SECRET`; no real secret was committed
- disabled TLS/DTLS for this local-only smoke runtime
- no production firewall, nginx, systemd, PM2, deploy, or production env changes were made

Local command shape:

```powershell
$env:LOCAL_TURN_STATIC_AUTH_SECRET = '<local-only-random-secret>'
docker compose -f infra/coturn/docker-compose.local.yml up -d
```

## Local Smoke Env

Local-only backend env used for the successful relay smoke:
- `LOCAL_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp`
- `LOCAL_TURN_STATIC_AUTH_SECRET=<same local-only random secret as coturn>`
- `LOCAL_TURN_TTL_SECONDS=600`
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=192.168.0.16`
- `API_CORS_ALLOWED_ORIGINS=http://localhost:3002,http://127.0.0.1:3002`

Local-only web env used for the smoke:
- `API_PORT=4002`
- `NEXT_PUBLIC_API_PORT=4002`
- `NEXT_PUBLIC_API_URL=http://localhost:4002`

Reason for the separate ports:
- existing local API/web processes were already listening on `4000` and `3001`
- the relay smoke needed a restarted API process with TURN env and mediasoup announced-address env

## TURN Relay Smoke Result

Status:
- `pass`

Observed before browser smoke:
- API health on `localhost:4002`: `ok`
- backend TURN credentials: `ready`
- backend transport `turnCredentials`: `ready`
- mediasoup ICE candidate IPs: `192.168.0.16`
- coturn TCP listener on `127.0.0.1:3478`: reachable

Observed in authenticated Chromium:
- route: `http://localhost:3002/media/sfu-smoke`
- browser: `Chrome/141.0.7390.37`
- TURN smoke status: `pass`
- producer id observed: `3950e702-a289-4024-9d0b-d5d5073fd10b`
- consumer id observed: `354245a9-ff37-4f55-a8c5-a5cf41763942`
- consumed remote track state: `live`
- smoke harness reported all TURN steps as `pass`

Observed in coturn logs:
- authenticated `ALLOCATE` succeeded
- `CREATE_PERMISSION` succeeded
- peer address was `192.168.0.16`
- no unauthenticated relay succeeded; unauthenticated probe packets were rejected with `401 Unauthorized`

TURN path covered:
- authenticated backend TURN credential issuance
- browser relay-only transport creation through `iceTransportPolicy: "relay"`
- coturn REST shared-secret auth
- relay allocation and peer permission
- mediasoup produce/consumer metadata path
- browser consume with remote track state `live`

## Acceptance Result

Pass:
- local coturn runtime is now available through local-only Docker compose.
- TURN relay smoke passed in authenticated browser mode.
- Direct browser smoke was already passed in Segment 097.
- current `MediaRoom` and default routes remain on LiveKit.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no real secrets were committed.

Review:
- local relay smoke used synthetic audio from the existing harness, not camera or microphone capture.
- local Docker coturn uses `coturn/coturn:latest`; pinning can be considered later if this becomes repeated CI/dev tooling.

Fail:
- none found in local TURN relay smoke.

Blocked:
- none for the local SFU direct/TURN smoke gate.

## Handoff

How local coturn was raised:
- `docker compose -f infra/coturn/docker-compose.local.yml up -d`
- should be started with a shell/env-provided `LOCAL_TURN_STATIC_AUTH_SECRET` that matches the backend smoke env

Local-only env needed:
- `LOCAL_TURN_URLS`
- `LOCAL_TURN_STATIC_AUTH_SECRET`
- `LOCAL_TURN_TTL_SECONDS`
- `LOCAL_MEDIASOUP_LISTEN_IP=0.0.0.0`
- `LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS=<host IPv4 reachable by coturn>`

TURN relay smoke result:
- `pass`

Blockers before `mvp-private-small-room-replacement`:
- none from the local direct/TURN smoke gate

Recommended next segment:
- `mvp-private-small-room-replacement`

Reason:
- direct browser SFU smoke passed in Segment 097, and TURN relay smoke passed in this segment.

## Verification Performed

Verification performed during implementation:
- `docker compose -f infra/coturn/docker-compose.local.yml config` passed
- local coturn Docker container started successfully
- authenticated backend TURN credential issue returned `ready`
- authenticated backend transport response included ready TURN credentials
- authenticated browser `/media/sfu-smoke` TURN run passed
- coturn logs showed authenticated allocation and permission success
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
- `bun.cmd run build:api` passed
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`
- `bun.cmd run build:web` passed with the same existing warning
