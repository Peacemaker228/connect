# Coturn

Здесь будут располагаться артефакты, связанные с `coturn`.

## Local TURN Credential Prototype

`local-turn.env.example` documents local-only app env names for backend-issued TURN REST credentials:

- `LOCAL_TURN_URLS`
- `LOCAL_TURN_STATIC_AUTH_SECRET`
- `LOCAL_TURN_TTL_SECONDS`

The values are placeholders for local relay-path testing only. The production TURN deployment, listener ports, relay ranges, firewall rules, and secret rotation remain out of scope for this segment.
