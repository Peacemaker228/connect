# Segment 169. Production Staging VPS Bootstrap Brief

Branch: `wave/stage9-production-staging-vps-bootstrap`

## Goal

Prepare an operator-facing bootstrap plan for the new separate staging/preprod VPS for Stage 9 production media infrastructure rehearsal.

This segment does not connect to the VPS, does not run production rollout, does not change real env files, does not enable SFU/TURN defaults, and does not add production infrastructure configs. It gives the operator exact commands to harden and inventory the staging VPS before a later staging env setup or smoke segment.

## Required Reading

- `docs/delegation/briefs/SEGMENT_BRIEF_168_PRODUCTION_MEDIA_STAGING_VPS_OPERATOR_INPUTS.md`
- `docs/runbooks/PRODUCTION_MEDIA_INFRA_RUNBOOK.md`
- `docs/runbooks/PRODUCTION_MEDIA_ENV_INVENTORY_TEMPLATE.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/ax-connect_runbook.md`

## Scope

Allowed:
- document staging VPS bootstrap commands
- document DNS checks for `staging.ax-connect.ru`
- document first SSH login, deploy user creation, SSH key setup, root credential rotation, and password-login hardening
- document base packages, Docker readiness for staging coturn, PM2/Bun/Node readiness for app/API, Nginx readiness, UFW/provider firewall discovery, status/log commands, and redaction rules
- update Stage 9 production media runbook/status docs

Forbidden:
- record root password, private keys, generated TURN credentials, cookies, auth headers, secret env values, or real staging public IPv4
- change `.env`, `.env.local`, `.env.production`, or server env files
- connect to the production VPS or apply production firewall/Nginx/PM2/Docker changes
- enable production SFU/TURN/default gates or add SFU defaults
- remove or weaken LiveKit fallback
- change Stage 6/Postgres production migration path
- run staging smoke before bootstrap and env setup are complete

## Operator Bootstrap Plan

Use placeholders only in shared output:
- `<STAGING_HOST>` can be `staging.ax-connect.ru` after DNS is correct, or the private operator-owned staging IP during first access.
- `<DEPLOY_USER>` should be the non-root staging deploy/operator user.
- `<LOCAL_PUBLIC_KEY>` is the operator public SSH key only. Never paste a private key.

### 1. DNS A-record check

Run from the operator workstation before SSH:

```bash
nslookup staging.ax-connect.ru
dig +short A staging.ax-connect.ru
```

On Windows PowerShell:

```powershell
Resolve-DnsName staging.ax-connect.ru -Type A
```

Pass condition:
- `staging.ax-connect.ru` resolves to the staging VPS address known in the private operator inventory.

Do not commit or paste the real staging public IPv4 into repo docs.

### 2. First SSH login

Use the hosting console as fallback while hardening SSH. Start with the staging host/IP only, never the production host:

```bash
ssh root@<STAGING_HOST>
```

Immediately capture non-secret host facts:

```bash
hostnamectl
lsb_release -a
whoami
pwd
ip -brief addr
```

Redact public IPs before sharing output.

### 3. Rotate exposed root password

The initial root password was exposed in chat. Rotate it before any serious staging work:

```bash
passwd
```

Do not paste the new password into chat, docs, shell history notes, screenshots, or repo files.

### 4. Create non-root deploy user

```bash
adduser <DEPLOY_USER>
usermod -aG sudo <DEPLOY_USER>
id <DEPLOY_USER>
```

### 5. SSH key setup for deploy user

If the operator needs a new local key, generate it on the workstation, not on the server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ax_connect_staging_ed25519 -C "ax-connect-staging"
cat ~/.ssh/ax_connect_staging_ed25519.pub
```

On the VPS, install the public key only:

```bash
install -d -m 700 -o <DEPLOY_USER> -g <DEPLOY_USER> /home/<DEPLOY_USER>/.ssh
printf '%s\n' '<LOCAL_PUBLIC_KEY>' > /home/<DEPLOY_USER>/.ssh/authorized_keys
chown <DEPLOY_USER>:<DEPLOY_USER> /home/<DEPLOY_USER>/.ssh/authorized_keys
chmod 600 /home/<DEPLOY_USER>/.ssh/authorized_keys
```

From a second terminal on the operator workstation, verify login before changing SSH password policy:

```bash
ssh -i ~/.ssh/ax_connect_staging_ed25519 <DEPLOY_USER>@<STAGING_HOST>
sudo -v
```

### 6. SSH hardening after key login is verified

Keep the original root SSH session and hosting console available until the non-root key login is confirmed.

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.pre-bootstrap.$(date +%Y%m%d%H%M%S)
sudo sshd -T | egrep 'permitrootlogin|passwordauthentication|pubkeyauthentication'
sudoedit /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl reload ssh
sudo sshd -T | egrep 'permitrootlogin|passwordauthentication|pubkeyauthentication'
```

Target settings after the key login test passes:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Then test a new SSH session again:

```bash
ssh -i ~/.ssh/ax_connect_staging_ed25519 <DEPLOY_USER>@<STAGING_HOST>
```

### 7. Base package baseline

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl unzip build-essential ca-certificates gnupg lsb-release ufw nginx
git --version
curl --version
unzip -v
gcc --version
sudo nginx -v
```

### 8. Docker readiness for staging coturn

Docker is preferred for staging coturn packaging. This is readiness/bootstrap only; do not start coturn until the later staging env/coturn segment provides non-secret config shape and secret source.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker <DEPLOY_USER>
docker --version
sudo docker compose version
sudo systemctl status docker --no-pager
```

After re-login as `<DEPLOY_USER>`:

```bash
docker ps
docker compose version
```

### 9. Bun, Node, and PM2 readiness for app/API

Check current runtime first:

```bash
node --version || true
npm --version || true
bun --version || true
pm2 --version || true
```

Install Bun if missing:

```bash
curl -fsSL https://bun.sh/install | bash
~/.bun/bin/bun --version
```

PM2 readiness, only after Node/npm are present:

```bash
npm --version
sudo npm install -g pm2
pm2 --version
pm2 status
```

Do not clone/deploy the app, fill env, or start app/API processes in this bootstrap brief unless a later staging env setup segment explicitly instructs it.

### 10. Nginx readiness

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo ss -lntup
```

Nginx should be installed and testable. Do not add the staging site config or issue certificates until DNS and staging app/API env setup are ready.

### 11. UFW and provider firewall discovery

Discover host firewall state:

```bash
sudo ufw status verbose
sudo iptables -S
sudo nft list ruleset
sudo ss -lntup
sudo ss -lnup
```

Operator must also check the hosting provider firewall/security-group UI and confirm it matches the staging candidate ports.

Candidate staging ports:
- `443/tcp` for HTTPS/WSS through Nginx
- `3478/udp` and `3478/tcp` for coturn listener
- `49160-49240` for coturn relay candidate range
- `40000-40100/udp` for mediasoup RTC candidate range

Host UFW candidate commands after console fallback and SSH key login are verified:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49160:49240/tcp
sudo ufw allow 49160:49240/udp
sudo ufw allow 40000:40100/udp
sudo ufw status numbered
sudo ufw enable
sudo ufw status verbose
```

If the provider firewall is enabled, mirror the same candidate ports there before relying on host UFW alone.

### 12. Status and log commands to preserve for later run reports

App/API PM2:

```bash
pm2 status
pm2 logs --lines 100
pm2 describe <PROCESS_NAME>
```

Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

Docker/coturn:

```bash
docker ps
docker compose ps
docker logs <COTURN_CONTAINER_NAME> --tail 100
sudo systemctl status docker --no-pager
```

Firewall/listeners:

```bash
sudo ufw status verbose
sudo ss -lntup
sudo ss -lnup
```

## Redaction Rules For Operator Output

Before sending command output back, redact:
- root password and any password prompt output
- private keys and private-key paths if sensitive
- real staging public IPv4
- real production IPs or production hostnames beyond the public canonical domain
- generated TURN usernames/passwords, TURN shared secrets, and coturn static auth secret
- LiveKit API key/secret values
- `.env` values, database URLs, storage keys, cookies, JWTs, auth headers, and session identifiers
- full coturn usernames/session metadata from logs

Allowed to send:
- command names
- package versions
- service status as `active/inactive/failed`
- non-secret port ranges
- redacted listener summaries
- DNS pass/fail with IP redacted
- placeholder env names without values

## Rollback / No-Production-Impact Guardrails

- Run these commands only on the separate staging VPS.
- Keep the current production VPS untouched.
- Keep LiveKit fallback available; do not remove `GET /api/media/livekit-token` or LiveKit env.
- Do not enable production SFU/TURN/default gates.
- Do not create or edit `.env`, `.env.local`, `.env.production`, or real server env values in repo.
- Do not start staging smoke until DNS, SSH hardening, deploy user, base packages, Docker/Bun/PM2/Nginx readiness, firewall baseline, and staging env setup are complete.
- If SSH hardening locks out the operator, use hosting console to restore `/etc/ssh/sshd_config` from the timestamped backup and reload SSH.
- If UFW blocks expected staging traffic, use hosting console to inspect `sudo ufw status numbered`, delete only the incorrect staging rule, and restore the candidate allowlist. Do not change production firewall rules.

## Acceptance Criteria

- bootstrap commands are documented with placeholders only
- DNS, SSH hardening, deploy user, root password rotation, package baseline, Docker, PM2/Bun/Node, Nginx, firewall discovery, and log/status commands are covered
- candidate ports are documented: `443/tcp`, `3478/udp+tcp`, `49160-49240`, `40000-40100/udp`
- redaction rules are explicit for outputs the operator sends back
- staging smoke remains blocked until bootstrap and env setup are complete
- production rollout/default remains blocked
- LiveKit fallback remains required/preserved
- Stage 6/Postgres production migration remains deferred/untouched

## Verification

Expected verification for this docs-only segment:

- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd x next lint`

## Handoff Format

Report:
- exact files changed
- bootstrap readiness classification
- what the operator must do manually
- what remains blocked before staging smoke
- recommended next segment: `production-staging-vps-bootstrap-run-report` or `production-media-staging-env-setup-plan`

## Classification

- staging VPS bootstrap plan: `pass / documented`
- staging VPS bootstrap execution: `blocked until operator runs commands on staging VPS`
- staging env setup: `blocked until bootstrap run report`
- staging smoke run: `blocked until bootstrap/env exists`
- production rollout/default: `blocked`
- LiveKit fallback: `required / preserved`
- Stage 6/Postgres production migration: `deferred / untouched`
