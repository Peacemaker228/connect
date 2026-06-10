# Segment Brief 182: Staging TURN Relay Network Config Fix

Branch: `wave/stage9-staging-turn-relay-network-config-fix`
Segment: `staging-turn-relay-network-config-fix`
Date: 2026-06-09

## Goal

Fix or precisely isolate the staging TURN relay network/config blocker that prevented relay ICE candidate-pair selection after Segment 181.

This segment stayed on the separate staging VPS only. It did not touch production VPS/env/defaults, did not enable production SFU defaults, did not remove LiveKit, did not run broad manual private/channel smoke, and did not touch Stage 6/Postgres production migration.

## Starting State

Segment 181 had already proved:

- Direct SFU harness: `pass`.
- Cleanup after Direct: `pass`.
- TURN harness: `fail` before consume.
- TURN failure detail: browser had TURN credentials, relay-only policy, relay candidates, mediasoup-client connect event, and accepted backend DTLS connect, but selected ICE candidate pair was `none`.
- Coturn had allocation activity and allocations returned to zero.
- Staging config classification showed mediasoup candidates on the expected RTC range, UFW media rules present, and coturn without explicit `external-ip` / `relay-ip`.

## Redacted Pre-change Evidence

Public address and DNS:

- staging public IPv4 present: `yes`
- staging public IPv4 matched the expected operator-known value: `yes`
- DNS A record present: `yes`
- DNS A matched the expected operator-known value: `yes`
- DNS A matched observed public IPv4: `yes`

Network/firewall:

- UFW active with allow rules for:
  - `3478/tcp`
  - `3478/udp`
  - `49160:49240/tcp`
  - `49160:49240/udp`
  - `40000:40100/udp`
- Docker-published coturn listener and relay ports were present before the host-network change.
- Postgres remained healthy.
- PM2 API/web remained online.

Server-local media config before the fix:

- `MEDIA_SFU_ANNOUNCED_ADDRESS`: present but classified as `fqdn_or_hostname`.
- `MEDIA_SFU_ANNOUNCED_ADDRESS` matched expected public IPv4: `no`.
- `MEDIA_SFU_RTC_MIN_PORT` / `MEDIA_SFU_RTC_MAX_PORT`: `40000-40100`.
- `MEDIA_TURN_URLS`: present.
- `MEDIA_TURN_STATIC_AUTH_SECRET`: present.
- `MEDIA_ENABLE_STAGING_SFU`: present with staging gate enabled.
- web smoke gate present only in web env.
- server-only SFU gate absent from web env.

Coturn config before the fix:

- `external-ip`: absent.
- `relay-ip`: absent.
- `listening-ip`: present.
- `listening-port`: `3478`.
- `min-port` / `max-port`: `49160-49240`.
- static auth secret present, value not printed.
- realm present, value not printed.
- denied peer rules present.
- unsupported `no-loopback-peers`: absent.

## Config Changes Applied On Staging

Only staging server-local config changed.

API env:

- `/etc/ax-connect-staging/api.env`
- `MEDIA_SFU_ANNOUNCED_ADDRESS` was updated to the staging public IPv4.
- The value was verified by match checks only and was not recorded.

Coturn config:

- `/opt/ax-connect-staging/coturn/turnserver.conf`
- `external-ip` was set to the staging public IPv4.
- `relay-ip` was set to the staging public IPv4.
- Values were verified by match checks only and were not recorded.

Coturn Docker compose:

- `/opt/ax-connect-staging/coturn/docker-compose.yml`
- coturn was moved from Docker port publishing to `network_mode: host`.
- The same listener and relay ranges remained in coturn config.
- No relay range widening was performed.

Restarts:

- coturn was restarted after config changes.
- API was restarted after the `MEDIA_SFU_ANNOUNCED_ADDRESS` update.
- web was not rebuilt or restarted.
- schema migration was not run.

## Post-change Config Evidence

After public-address and `external-ip` update:

- API health: pass.
- `MEDIA_SFU_ANNOUNCED_ADDRESS` matched expected public IPv4: `yes`.
- coturn `external-ip` matched expected public IPv4: `yes`.
- coturn status: running.
- coturn bad config format warning: absent.

After host-network coturn change:

- coturn status: running.
- coturn restarting: `false`.
- coturn exit code: `0`.
- Docker network mode: `host`.
- `turnserver` listened directly on `3478`.
- coturn bad config format warning: absent.
- API/web were not restarted for the host-network coturn change.

Authenticated diagnostic transport after the API/coturn public-address change:

- transport create: HTTP `201`.
- transport status: `ready`.
- transport enabled: `true`.
- transport id present: `true`.
- server candidate count: `2`.
- server candidate address class: `public`.
- server candidate address matched expected public IPv4: `true`.
- server protocols: `tcp|udp`.
- server types: `host`.
- server candidate ports in `40000-40100`: `true`.
- TURN credentials enabled: `true`.
- TURN URL count: `2`.
- diagnostic transport close: HTTP `201`.
- final health after diagnostic close: `0/0/0/0`.

## Harness Results

Direct harness after the public-address config change:

- result: `pass`.
- policy: `all`.
- send transport connected.
- receive transport connected.
- selected candidate pair state: `succeeded`.
- selected local candidate: `prflx`.
- selected remote candidate: `host`.
- consume remote track: `pass`.
- remote track: `live`.
- UI cleanup: `pass`, `rooms=0 transports=0 producers=0 consumers=0`.

TURN harness after public-address config but before host-network coturn:

- result: `fail`.
- failure moved from `state=new` to `state=failed`.
- policy: `relay`.
- connect event fired: `yes`.
- backend DTLS connect accepted: `yes`.
- local candidates: `relay`.
- candidate pair state: `none`.
- coturn allocation activity was observed and allocations returned to zero.

TURN harness after host-network coturn:

- result before cleanup: `pass`.
- policy: `relay`.
- TURN servers: `1`.
- TURN URLs: `2`.
- server candidates: `2`.
- server protocols: `tcp|udp`.
- server types: `host`.
- send transport connected: `pass`.
- receive transport connected: `pass`.
- candidate pair state: `succeeded`.
- selected local candidate: `relay`.
- selected local relay protocol: `udp`.
- selected remote candidate: `host`.
- consume remote track: `pass`.
- remote track: `live`.
- coturn allocation count returned to zero.

TURN cleanup after host-network coturn:

- first UI cleanup: `fail`.
- failure detail: `rooms=0 transports=2 producers=1 consumers=1`.
- second UI cleanup plus bounded `20s` server health recheck: `fail`.
- repeated health counts remained `rooms=0 transports=2 producers=1 consumers=1`.

## Root Cause

The TURN relay network blocker was not missing TURN credentials, missing relay policy, or missing backend DTLS connect.

The verified network/config causes were:

- staging mediasoup announced address was not configured as the staging public IPv4;
- coturn lacked explicit `external-ip`;
- coturn relay traffic was still behind Docker bridge/port publishing, which prevented relay ICE candidate-pair selection for this single-host staging topology.

The scoped staging fix was:

- set `MEDIA_SFU_ANNOUNCED_ADDRESS` to the staging public IPv4;
- set coturn `external-ip` and `relay-ip` to the staging public IPv4;
- run coturn with host networking so relay sockets are owned directly by `turnserver` on the host.

After that change, TURN relay selected a candidate pair and consumed a live remote track.

## Classification

Final classification: `review / TURN relay network fixed, cleanup blocker remains`.

Pass evidence:

- Direct harness passed.
- TURN relay harness media path passed after host-network coturn.
- Selected TURN relay ICE candidate pair appeared.
- Remote track consumed as `live`.
- Coturn allocations returned to zero.
- Production VPS/env/defaults remained untouched.
- No secrets, cookies, auth headers, generated TURN credentials, DB URLs, private keys, or real IP values were recorded.

Remaining blocker:

- mediasoup cleanup after successful TURN relay did not converge to zero.
- Final bounded counts stayed `rooms=0 transports=2 producers=1 consumers=1`.

Because cleanup convergence is required before full staging smoke or canary readiness, this segment is not a full pass.

## Guardrails

- Production VPS touched: `no`.
- Production env/defaults changed: `no`.
- LiveKit fallback removed: `no`.
- Full manual private/channel/video smoke run: `no`.
- Stage 6/Postgres production migration touched: `no`.
- Storage upload smoke run: `no`.
- Secrets/cookies/auth headers/generated TURN credentials printed: `no`.
- Real public IP value recorded in docs: `no`.

## Recommended Next

Recommended next segment: `staging-turn-relay-cleanup-convergence-fix`.

That segment should stay focused on the now-isolated cleanup leak after successful TURN relay harness:

- reproduce with harness TURN only;
- determine whether Stop/Reset fails to close the TURN send/recv transports, producer, or consumer;
- avoid broad private/channel UI rewrite;
- keep the host-network coturn staging config in place;
- rerun Direct + TURN + cleanup after the fix.

Do not proceed to production rollout, LiveKit removal, broad manual private/channel smoke, or Stage 6/Postgres work until TURN cleanup convergence passes.
