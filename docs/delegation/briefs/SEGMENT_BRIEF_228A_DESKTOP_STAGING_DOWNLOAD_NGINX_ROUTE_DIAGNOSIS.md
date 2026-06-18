# Segment 228A. Desktop Staging Download Nginx Route Diagnosis

## Classification

- segment: `desktop-staging-download-nginx-route-diagnosis`
- type: `desktop release / staging nginx route diagnosis`
- status: `pass / route fixed and download verified`
- target branch: `feature/desktop-staging-download-nginx-route-diagnosis`
- source branch: latest `origin/core/reborn` after Segment 228 is merged

## Repository State

- `origin/core/reborn` was fetched on `2026-06-18`;
- latest `origin/core/reborn` includes Segment 228 via `15afcd4 Merge pull request #173 from Peacemaker228/feature/desktop-staging-download-apply-verification`;
- this branch was created from `origin/core/reborn` at `15afcd47fe4708882c7781e876a67f8e21939033`;
- no upstream tracking is required for the feature branch.

## Goal

Diagnose why staging desktop download URLs still route through web auth before making any Nginx change.

Current public symptom reproduced from outside the VPS:

```text
GET/HEAD https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe
HTTP/1.1 307 Temporary Redirect
location: /sign-in?redirect_url=%2Fdownloads%2Fdesktop%2Fstaging%2Fwin%2FAxConnect-Staging-Setup-latest.exe
```

```text
GET/HEAD https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256
HTTP/1.1 307 Temporary Redirect
location: /sign-in?redirect_url=%2Fdownloads%2Fdesktop%2Fstaging%2Fwin%2FAxConnect-Staging-Setup-0.0.2.sha256
```

The initial symptom above was closed after operator diagnosis and minimal Nginx/static-file publication.

## Required Reading

- `rules/rules.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`
- `rules/architecture-docs.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_228_DESKTOP_STAGING_DOWNLOAD_APPLY_VERIFICATION.md`
- `docs/runbooks/DESKTOP_RELEASE_RUNBOOK.md`
- `docs/ax-connect_runbook.md`
- `docs/waves/DESKTOP_RELEASE_ROADMAP.md`
- `docs/roadmap/STAGE_STATUS.md`

## Scope

In scope:

- collect redacted staging VPS evidence;
- verify files, ownership, permissions, active Nginx config, enabled server block, and route matching;
- propose a minimal Nginx patch only after diagnosis evidence identifies the failure class;
- rerun public curl/hash verification after an operator-approved fix.

Out of scope:

- no production changes;
- no packaged desktop runtime smoke;
- no app code changes;
- no DB migrations;
- no auth/storage/media runtime changes;
- no auto-update or native notifications;
- no secret, cookie, private key, database URL, storage key, or full unredacted Nginx dump in docs.

## Operator Diagnosis Commands

Run on the staging VPS as an operator. These commands only inspect files/config and write a redacted diagnosis report to `/tmp/ax-connect-desktop-download-nginx-diagnosis.txt`.

```bash
set -euo pipefail

REPORT="/tmp/ax-connect-desktop-download-nginx-diagnosis.txt"
DOWNLOAD_DIR="/var/www/ax-connect-desktop-downloads/desktop/staging/win"
VERSIONED_EXE="$DOWNLOAD_DIR/AxConnect-Staging-Setup-0.0.2.exe"
LATEST_EXE="$DOWNLOAD_DIR/AxConnect-Staging-Setup-latest.exe"
SHA_FILE="$DOWNLOAD_DIR/AxConnect-Staging-Setup-0.0.2.sha256"
EXPECTED_SHA="794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164"
LATEST_URL="https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe"
SHA_URL="https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256"

: > "$REPORT"
chmod 0600 "$REPORT"

{
  echo "## Public HTTP symptom from VPS"
  curl -sS -D - -o /tmp/ax-connect-download-head.body "$LATEST_URL" | sed -n '1,20p'
  echo
  curl -sS -D - -o /tmp/ax-connect-download-sha-head.body "$SHA_URL" | sed -n '1,20p'

  echo
  echo "## Filesystem existence, ownership, permissions"
  for path in "$DOWNLOAD_DIR" "$VERSIONED_EXE" "$LATEST_EXE" "$SHA_FILE"; do
    if [ -e "$path" ]; then
      stat -c '%A %U:%G %s %n' "$path"
    else
      echo "MISSING $path"
    fi
  done

  echo
  echo "## Parent directory traversal permissions"
  namei -l "$DOWNLOAD_DIR" "$VERSIONED_EXE" "$LATEST_EXE" "$SHA_FILE" 2>&1

  echo
  echo "## www-data read checks"
  for path in "$VERSIONED_EXE" "$LATEST_EXE" "$SHA_FILE"; do
    if sudo -u www-data test -r "$path"; then
      echo "www-data can read $path"
    else
      echo "www-data CANNOT read $path"
    fi
  done

  echo
  echo "## Local file SHA checks"
  if [ -f "$VERSIONED_EXE" ]; then
    sha256sum "$VERSIONED_EXE"
  fi
  if [ -f "$LATEST_EXE" ]; then
    sha256sum "$LATEST_EXE"
  fi
  if [ -f "$SHA_FILE" ]; then
    sed -n '1,3p' "$SHA_FILE"
  fi
  echo "expected SHA: $EXPECTED_SHA"

  echo
  echo "## Enabled Nginx site files"
  ls -la /etc/nginx/sites-enabled 2>&1
  echo
  echo "## Available Nginx site files"
  ls -la /etc/nginx/sites-available 2>&1

  echo
  echo "## Grep active config filenames for staging/download markers"
  sudo grep -RInE 'server_name[[:space:]].*staging\.ax-connect\.ru|downloads/desktop|ax-connect-desktop-downloads|proxy_pass|auth_request|return[[:space:]]+30[1278]|rewrite' \
    /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null \
    | sed -E 's#(ssl_certificate_key[[:space:]]+)[^;]+;#\1[REDACTED];#g; s#(auth_basic_user_file[[:space:]]+)[^;]+;#\1[REDACTED];#g; s#(Authorization[[:space:]]+)[^;]+#\1[REDACTED]#g'
} >> "$REPORT" 2>&1
```

Then extract the relevant redacted `nginx -T` view. This avoids pasting a full config dump while preserving the server block and download locations needed for diagnosis.

```bash
set -euo pipefail

REPORT="/tmp/ax-connect-desktop-download-nginx-diagnosis.txt"
NGINX_T="/tmp/ax-connect-nginx-T-redacted.txt"

sudo nginx -T 2>&1 \
  | sed -E \
      -e 's#(ssl_certificate_key[[:space:]]+)[^;]+;#\1[REDACTED];#g' \
      -e 's#(ssl_password_file[[:space:]]+)[^;]+;#\1[REDACTED];#g' \
      -e 's#(auth_basic_user_file[[:space:]]+)[^;]+;#\1[REDACTED];#g' \
      -e 's#(proxy_set_header[[:space:]]+Authorization[[:space:]]+).*;#\1[REDACTED];#g' \
      -e 's#(proxy_set_header[[:space:]]+Cookie[[:space:]]+).*;#\1[REDACTED];#g' \
      -e 's#(add_header[[:space:]]+Set-Cookie[[:space:]]+).*;#\1[REDACTED];#g' \
  > "$NGINX_T"
chmod 0600 "$NGINX_T"

{
  echo
  echo "## nginx -t"
  sudo nginx -t

  echo
  echo "## Redacted staging.ax-connect.ru server block(s) from nginx -T"
  awk '
    /server[[:space:]]*\{/ {
      in_server=1
      depth=1
      block=$0 ORS
      next
    }
    in_server {
      block=block $0 ORS
      line=$0
      opens=gsub(/\{/, "{", line)
      line=$0
      closes=gsub(/\}/, "}", line)
      depth += opens - closes
      if (depth == 0) {
        if (block ~ /server_name[[:space:]][^;]*staging\.ax-connect\.ru/) {
          print block
        }
        in_server=0
        block=""
      }
    }
  ' "$NGINX_T"

  echo
  echo "## Redacted download-related locations from full nginx -T"
  grep -nE 'server_name[[:space:]].*staging\.ax-connect\.ru|location[[:space:]]+(\^~[[:space:]]+)?/downloads|downloads/desktop|ax-connect-desktop-downloads|proxy_pass|auth_request|return[[:space:]]+30[1278]|rewrite|try_files|alias|root' "$NGINX_T" || true
} >> "$REPORT" 2>&1
```

Before sharing the report, verify it does not contain obvious secrets:

```bash
set -euo pipefail

REPORT="/tmp/ax-connect-desktop-download-nginx-diagnosis.txt"

if grep -Eiq 'password|secret|token|private_key|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|DATABASE_URL|STORAGE_.*KEY|Authorization:|Cookie:' "$REPORT"; then
  echo "Potential secret-like text found. Redact the report before sharing:"
  grep -Ein 'password|secret|token|private_key|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|DATABASE_URL|STORAGE_.*KEY|Authorization:|Cookie:' "$REPORT"
else
  echo "No obvious secret-like text found in $REPORT"
fi
```

Share only the redacted report output, not `/tmp/ax-connect-nginx-T-redacted.txt` in full.

## Diagnosis Decision Matrix

Classify the result only after operator evidence:

- `files/path/permissions are wrong` if any expected file is missing, has wrong size/hash, parent directories lack execute permission, or `sudo -u www-data test -r` fails.
- `Nginx config is missing/wrong` if the files are readable but no `location ^~ /downloads/desktop/` exists inside the active HTTPS `server_name staging.ax-connect.ru` block.
- `Nginx config is in the wrong server block` if the download location exists only in another server block, only in HTTP, or only in a disabled file.
- `download route is correct but another layer redirects` if a valid `location ^~ /downloads/desktop/` exists inside the active HTTPS staging server block, files are readable by `www-data`, `nginx -T` confirms the block is loaded, but public curl still returns `307`.

## Minimal Patch Template

Use this only if the diagnosis proves that the active HTTPS staging server block is missing the static download location or has it in the wrong place.

```nginx
location ^~ /downloads/desktop/ {
    alias /var/www/ax-connect-desktop-downloads/desktop/;
    default_type application/octet-stream;
    add_header X-Content-Type-Options nosniff always;
    autoindex off;
}
```

Placement rule:

- put the block inside the `server { ... }` that has `listen 443 ... ssl` and `server_name staging.ax-connect.ru`;
- keep it before the generic `location /` proxy to Next;
- do not edit production `server_name ax-connect.ru`;
- do not reload Nginx until `sudo nginx -t` passes.

## Verification After Operator-Approved Fix

Run on the staging VPS after the minimal fix:

```bash
set -euo pipefail

EXPECTED_SHA="794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164"
LATEST_URL="https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe"
SHA_URL="https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-0.0.2.sha256"

sudo nginx -t
sudo systemctl reload nginx

curl -I "$LATEST_URL"
curl -fsS "$SHA_URL"

curl -fsS -o /tmp/AxConnect-Staging-Setup-latest.exe "$LATEST_URL"
echo "$EXPECTED_SHA  /tmp/AxConnect-Staging-Setup-latest.exe" | sha256sum -c -
```

Expected pass evidence:

- latest installer URL returns `200`;
- `.sha256` URL returns the expected hash text, not HTML;
- downloaded latest installer SHA256 matches `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- no packaged desktop runtime smoke is claimed.

## Implementation Result

Operator evidence from 2026-06-18:

- initial diagnosis showed missing files under `/var/www/ax-connect-desktop-downloads/desktop/staging/win/`;
- `AxConnect-Staging-Setup-0.0.2.exe` was uploaded to the staging VPS;
- `AxConnect-Staging-Setup-latest.exe` was created as the stable download target;
- `AxConnect-Staging-Setup-0.0.2.sha256` was generated on the VPS;
- permissions were set so `www-data` can read the installer;
- active Nginx config includes `location ^~ /downloads/desktop/` in the `staging.ax-connect.ru` HTTPS server block before the generic web proxy;
- `GET` and `HEAD` for `https://staging.ax-connect.ru/downloads/desktop/staging/win/AxConnect-Staging-Setup-latest.exe` returned `200 OK`;
- response includes `Content-Type: application/octet-stream`, `Content-Length: 175306350`, `X-Content-Type-Options: nosniff`, and `Accept-Ranges: bytes`;
- downloaded latest installer SHA256 matched `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- browser download and Windows installation were confirmed by the operator.

Classification:

- staging desktop download route: `pass`;
- staging installer browser download: `pass`;
- staging installer Windows installation: `pass / operator-confirmed`;
- packaged desktop runtime smoke: `pending / next segment`;
- auto-update/native notifications/signing/CI release: `not implemented`.
