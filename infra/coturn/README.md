# Coturn

Local-only coturn artifacts live here.

## Local TURN Credential Prototype

`local-turn.env.example` documents local-only app env names for backend-issued TURN REST credentials:

- `LOCAL_TURN_URLS`
- `LOCAL_TURN_STATIC_AUTH_SECRET`
- `LOCAL_TURN_TTL_SECONDS`

The values are placeholders for local relay-path testing only. The production TURN deployment, listener ports, relay ranges, firewall rules, and secret rotation remain out of scope for this segment.

## Local Docker Coturn Smoke Runtime

`docker-compose.local.yml` starts a local-only coturn container for browser relay smoke. It binds only to `127.0.0.1` and uses TURN REST shared-secret auth through `LOCAL_TURN_STATIC_AUTH_SECRET`.

Example:

```powershell
$env:LOCAL_TURN_STATIC_AUTH_SECRET = 'replace-with-random-local-secret'
docker compose -f infra/coturn/docker-compose.local.yml up -d
```

The backend smoke env must use the same secret:

```powershell
$env:LOCAL_TURN_URLS = 'turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp'
$env:LOCAL_TURN_STATIC_AUTH_SECRET = 'replace-with-the-same-local-secret'
$env:LOCAL_TURN_TTL_SECONDS = '600'
```

Stop the local container with:

```powershell
docker compose -f infra/coturn/docker-compose.local.yml down
```
