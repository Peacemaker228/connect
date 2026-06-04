# Segment 170. Production Staging VPS Bootstrap Run Report

Branch: `wave/stage9-production-staging-vps-bootstrap`

## Scope

Operator-executed staging VPS bootstrap report for the separate Stage 9 staging/preprod VPS.

This report records redacted evidence only. It does not include real public IPs, passwords, private keys, server env values, TURN credentials, cookies, auth headers, or production secrets. It did not connect to or change the production VPS, did not deploy app/API, did not start coturn, did not run media smoke, did not enable SFU/TURN/default gates, did not remove LiveKit, and did not touch the Stage 6/Postgres production migration path.

## Source Brief

- `docs/delegation/briefs/SEGMENT_BRIEF_169_PRODUCTION_STAGING_VPS_BOOTSTRAP_BRIEF.md`

## Operator Evidence Summary

Server identity:
- provider: `nuxt.cloud`
- role: separate staging/preprod VPS
- OS: `Ubuntu 22.04.5 LTS`
- virtualization: `kvm`
- public IPv4: present / redacted
- hostname: staging VPS provider hostname recorded in operator evidence
- provider firewall/security group: `not found by operator`

DNS:
- authoritative domain DNS remains on REG.RU name servers.
- `staging.ax-connect.ru` A-record was added for the staging VPS.
- public DNS-over-HTTPS checks observed the staging A-record after update.
- local resolver had a short-lived NXDOMAIN/cache delay during propagation.
- real staging public IPv4 is not recorded in repo docs.

Credential and SSH hardening:
- exposed initial root credential was rotated by the operator.
- non-root deploy user was created.
- deploy user is in `sudo`.
- SSH public-key login for deploy user passed.
- password login was disabled after deploy SSH-key login was verified.
- root SSH login was disabled.
- post-hardening new deploy SSH session passed.

Final SSH settings:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Base packages and runtime readiness:
- apt update/upgrade completed by operator report.
- base packages installed: `git`, `curl`, `unzip`, `build-essential`, `ca-certificates`, `gnupg`, `lsb-release`, `ufw`, `nginx`.
- Bun: `1.3.14`
- Node.js: `v22.22.2`
- npm: `10.9.7`
- PM2: `7.0.1`
- PM2 status: installed, no app/API processes configured.

Docker readiness:
- Docker: `29.5.2`
- Docker Compose: `v5.1.4`
- `docker.service`: active after install and after reboot.
- deploy user is in the `docker` group.
- `docker ps` without sudo passed.
- no containers are running.
- coturn was not started.

Nginx readiness:
- `nginx -t`: pass.
- `nginx.service`: active after install and after reboot.
- default Nginx listener exists on `80/tcp`.
- `443/tcp` is allowed by UFW but no Nginx TLS site is configured yet.
- no staging site config or certificate was added.

Firewall baseline:
- UFW enabled after deploy SSH-key login was verified.
- UFW default incoming: deny.
- UFW default outgoing: allow.
- UFW routed: deny.
- UFW logging: low.
- new SSH session after UFW enablement passed.

Allowed UFW entries:

```text
22/tcp OpenSSH
443/tcp
3478/tcp
3478/udp
49160:49240/tcp
49160:49240/udp
40000:40100/udp
```

IPv6 versions of the same rules were also present.

Post-reboot verification:
- reboot was required after kernel package update.
- reboot was completed.
- post-reboot SSH login as deploy passed.
- post-reboot kernel: `Linux 5.15.0-179-generic`
- `ssh.service`: active.
- `nginx.service`: active.
- `docker.service`: active.
- PM2 remains installed with no processes.
- Docker remains active with no containers.
- reboot-required flag cleared.

Observed security note:
- external root SSH attempts were visible in SSH service logs after boot.
- root login is disabled and password authentication is disabled.
- future handoffs must redact any client IPs or hostile source IPs from service logs.

## Current Bootstrap Classification

- staging DNS A-record: `pass / observed`
- first SSH access: `pass`
- root credential rotation: `pass / operator reported`
- deploy user creation: `pass`
- deploy SSH-key login: `pass`
- SSH hardening: `pass`
- apt/base packages: `pass / operator reported`
- Docker readiness: `pass`
- Bun/Node/PM2 readiness: `pass`
- Nginx readiness: `pass`
- UFW baseline: `pass`
- provider firewall: `not found by operator`
- reboot after kernel update: `pass`
- staging app/API deploy: `not started`
- staging coturn deploy: `not started`
- staging media smoke: `blocked`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`

## What Remains Blocked Before Staging Smoke

- staging app/API repository checkout and deploy path are not prepared.
- staging env source is not filled.
- no `.env`, `.env.local`, `.env.production`, or server env values are recorded in repo docs.
- Nginx staging site config and TLS certificate are not prepared.
- PM2 process names and ecosystem config for staging are not prepared.
- coturn Docker config/secret source is not prepared.
- `MEDIA_TURN_*` values and secret source are not filled.
- `MEDIA_SFU_*` values and announced address mapping are not filled.
- app/API media health/log commands are not tied to staging process names.
- LiveKit rollback query checks have not been run on staging.
- direct/TURN media smoke has not been run.

## Recommended Next Segment

Recommended next:
- `production-media-staging-env-setup-plan`

Do not proceed directly to:
- staging smoke run
- production rollout/default switch
- LiveKit removal
- Stage 6 production Postgres cutover

## Verification

Expected verification for this docs-only run report:

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`
