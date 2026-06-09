# Segment Brief 181: Staging TURN Relay Diagnostics Deploy And Rerun

Branch: `wave/stage9-staging-turn-relay-diagnostics-rerun`
Segment: `staging-turn-relay-diagnostics-deploy-and-rerun`
Date: 2026-06-09

## Goal

Deploy Segment 180 non-secret TURN relay diagnostics to the separate staging VPS and rerun only the smoke harness Direct + TURN + cleanup path.

This segment did not run broad manual private/channel/video smoke, did not touch production VPS/env/defaults, did not remove LiveKit, and did not touch Stage 6/Postgres production migration.

## Deploy Evidence

- Staging repo path: `/var/www/ax-connect-staging`.
- Deployed commit: `e08b8f4a9b90dfa3810e61d5f172b19f6a2fedb1`.
- Deployed commit summary: `fix(auth): correct login input contrast`.
- Segment 180 diagnostic code was present on staging:
  - `getTransportDiagnostics`
  - `send transport config`
  - `connectEvent`
- Staging gates remained scoped correctly:
  - API env: `MEDIA_ENABLE_STAGING_SFU=present_1`
  - web env: `NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE=present_1`
  - server-only API gate absent from web env
  - public web smoke gate absent from API env
- `bun x prisma generate`: pass.
- `bun run build:api`: pass.
- `bun run build:web`: pass.
- PM2 restart:
  - `ax-connect-staging-api`: online.
  - `ax-connect-staging-web`: online.
- HTTPS API health: pass.
- Schema migration: not run.

## Preflight Evidence

Fresh staging-only authenticated session:

- register: HTTP `201`
- auth session: HTTP `200`
- session authenticated: `true`
- `/media/sfu-smoke`: HTTP `200`

Authenticated mediasoup health before smoke:

- HTTP `200`
- status: `ready`
- enabled: `true`
- worker pid present: `true`
- router id present: `true`
- active rooms/transports/producers/consumers: `0/0/0/0`
- staging SFU gate enabled: `true`
- TURN URLs configured: `true`
- TURN URL count: `2`
- TURN secret configured: `true`
- SFU announced address configured: `true`
- SFU RTC range status: `ready`

Coturn:

- container running.
- not restarting.
- published listener and relay ports present in Docker output.

LiveKit rollback token path:

- HTTP `200`
- token presence: `true`
- token value was not printed.

## Direct Harness Result

Direct mode passed.

Sanitized harness diagnostics:

- send transport config:
  - policy: `all`
  - TURN servers: `0`
  - TURN URLs: `0`
  - server candidates: `2`
  - server protocols: `tcp|udp`
  - server types: `host`
- send transport connected:
  - state: `connected`
  - connect event: `yes`
  - backend connect accepted: `yes`
  - local candidates: `host|prflx`
  - local protocols: `tcp|udp`
  - candidate pair state: `succeeded`
  - selected local: `prflx`
  - selected remote: `host`
- receive transport connected:
  - state: `connected`
  - connect event: `yes`
  - backend connect accepted: `yes`
  - local candidates: `host|prflx`
  - local protocols: `udp`
  - candidate pair state: `succeeded`
  - selected local: `prflx`
  - selected remote: `host`
- consume remote track: `pass`
- remote track state: `live`

Direct cleanup:

- harness cleanup: `pass`
- UI cleanup detail: `rooms=0 transports=0 producers=0 consumers=0`
- server health after cleanup: `0/0/0/0`

Raw transport/producer/consumer identifiers were visible in the UI but are not recorded here.

## TURN Harness Result

TURN mode failed before consume, at send transport connection.

Sanitized harness diagnostics:

- send transport config:
  - policy: `relay`
  - TURN servers: `1`
  - TURN URLs: `2`
  - TURN schemes: `turn`
  - TURN transports: `tcp|udp`
  - server candidates: `2`
  - server protocols: `tcp|udp`
  - server types: `host`
- receive transport config:
  - policy: `relay`
  - TURN servers: `1`
  - TURN URLs: `2`
  - TURN schemes: `turn`
  - TURN transports: `tcp|udp`
  - server candidates: `2`
  - server protocols: `tcp|udp`
  - server types: `host`
- produce local track: `pass`
- send transport connected: `fail`
- failure detail:
  - connection state: `new`
  - policy: `relay`
  - connect event: `yes`
  - backend connect accepted: `yes`
  - local candidates: `relay`
  - local protocols: `udp`
  - candidate pair state: `none`

The consumer path was not reached in the TURN run.

## Cleanup And Candidate Classification

After UI cleanup and fresh authenticated health check:

- mediasoup status: `ready`
- enabled: `true`
- active rooms/transports/producers/consumers: `0/0/0/0`

Additional authenticated diagnostic transport classification:

- transport create: HTTP `201`
- transport status: `ready`
- transport enabled: `true`
- transport id present: `true`
- server candidate count: `2`
- server candidate address class: `fqdn_or_hostname`
- server protocols: `tcp|udp`
- server types: `host`
- server candidate ports in `40000-40100`: `true`
- TURN credentials enabled: `true`
- TURN URL count: `2`
- diagnostic transport close: HTTP `201`
- final counters after diagnostic close: `0/0/0/0`

Server-local config classification without values:

- `MEDIA_SFU_LISTEN_IP` class: `private`
- `MEDIA_SFU_ANNOUNCED_ADDRESS` class: `fqdn_or_hostname`
- `MEDIA_SFU_ANNOUNCED_ADDRESS` equals staging hostname: `true`
- `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT`: expected `40000-40100`
- coturn `external-ip`: not configured
- coturn `relay-ip`: not configured
- coturn `listening-ip`: configured
- UFW rules present for:
  - `3478/tcp+udp`
  - `49160:49240/tcp+udp`
  - `40000:40100/udp`

Coturn redacted logs:

- showed allocation count increments/decrements from previous and current relay activity.
- old invalid/no-auth lines remained present in log tail.
- the collected tail did not provide a successful selected browser candidate-pair; browser diagnostics remain the primary evidence for this segment.

## Diagnostic Answers

- Did browser receive TURN iceServers? `yes`
- Did send transport receive TURN iceServers? `yes`
- Was relay mode requested? `yes`
- Did browser gather relay candidates? `yes`
- Did transport connect event fire? `yes`
- Did backend DTLS connect endpoint accept the request? `yes`
- Was any candidate pair selected? `no`
- Was selected candidate relay/direct/unknown? `none`
- Did mediasoup candidates use expected staging RTC range? `yes`
- Did mediasoup candidate address match expected staging announced hostname class? `yes / fqdn_or_hostname`
- Did coturn logs show relay allocation activity? `yes`
- Did final cleanup converge to zero? `yes`

## Classification

Final classification: `review / TURN relay ICE pair selection blocker`.

Direct path and cleanup are passing. The TURN failure is no longer an unclear missing-credential or app-code path:

- TURN credentials are delivered.
- relay policy is applied.
- browser gathers relay candidates.
- mediasoup-client connect callback fires.
- backend DTLS connect accepts the request.
- no ICE candidate pair is selected.

The next focused fix should inspect staging relay/SFU reachability config, especially coturn external/public address behavior and peer permission path when coturn relays to mediasoup candidates announced as the staging hostname on the `40000-40100` RTC range. Do not proceed to production rollout, LiveKit removal, Stage 6/Postgres, or broad manual private/channel smoke.

## Guardrails

- Production VPS touched: `no`
- Production env/defaults changed: `no`
- LiveKit fallback removed: `no`
- Full manual private/channel/video smoke run: `no`
- Secrets/cookies/auth headers/generated TURN credentials printed: `no`

## Recommended Next

Recommended next segment: `staging-turn-relay-candidate-pair-fix`.

That segment should stay focused on the verified relay ICE candidate-pair blocker and should not widen into product smoke or production rollout.
