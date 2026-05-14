# SEGMENT BRIEF 092. Local Coturn TURN Credential

Branch:
- `wave/stage8-local-coturn-turn-credential`

Segment:
- `local-coturn-turn-credential`

## Goal

Add local-only TURN credential support for future relay-path testing without production rollout, UI runtime switching, LiveKit removal, or production TURN service rollout/config changes.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_091_LOCAL_MEDIASOUP_DEPENDENCY_PROTOTYPE.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `apps/api/src/modules/media/*`

Official coturn docs checked:
- coturn `README.turnserver`: https://github.com/coturn/coturn/blob/master/README.turnserver
- coturn `turnserver.conf` example: https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf

Official docs findings:
- coturn supports TURN REST API style time-limited credentials through `--use-auth-secret`.
- coturn temporary username format is `timestamp:username` when accounting for a user id.
- temporary password is `base64(hmac-sha1(shared-secret, temporary-username))`.
- the shared secret is configured server-side through `static-auth-secret` or a database secret table.
- static user accounts are a separate long-term credential mode and should not be mixed into the local REST credential prototype.

## Files Changed

Added:
- `apps/api/src/modules/media/turn-credential.service.ts`
- `infra/coturn/local-turn.env.example`
- `docs/delegation/briefs/SEGMENT_BRIEF_092_LOCAL_COTURN_TURN_CREDENTIAL.md`

Changed:
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/media.module.ts`
- `infra/coturn/README.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/waves/MEDIA_STACK_TECHNOLOGY_DECISION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_081_SFU_TURN_ARCHITECTURE_DESIGN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_083_MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_091_LOCAL_MEDIASOUP_DEPENDENCY_PROTOTYPE.md`

## Implementation Summary

Backend service:
- added `TurnCredentialService`
- reads local-only env names:
  - `LOCAL_TURN_URLS`
  - `LOCAL_TURN_STATIC_AUTH_SECRET`
  - `LOCAL_TURN_TTL_SECONDS`
- filters URLs to `turn:` and `turns:`
- clamps TTL to `60..3600` seconds, defaulting to `600`
- creates username as `expiresAtUnixSeconds:profileId`
- creates credential as `base64(hmac-sha1(secret, username))`
- returns `urls`, `username`, `credential`, `ttlSeconds`, `expiresAt`, and `expiresAtUnixSeconds`

Guarding:
- added authenticated `GET /api/media/prototype/turn/credentials`
- endpoint uses `RequireAuthGuard` and `CurrentProfileId`
- service returns disabled status in production runtime
- service returns disabled status when local TURN URLs or local shared secret are absent
- real secret values are not committed to docs or client code

Local env docs:
- added `infra/coturn/local-turn.env.example`
- values are placeholders for local relay-path testing only
- no Docker, firewall, Nginx, PM2, production env, or production rollout config was added

Compatibility:
- current LiveKit token/provider/client path is unchanged
- no UI runtime switch was made
- no browser SFU client package was added
- microphone/media behavior was not changed

## Acceptance Result

Pass:
- API can return a local TURN credential shape when local env is configured.
- endpoint is auth-guarded.
- credentials are short-lived and backend-issued.
- production runtime and missing local env are disabled safely.
- local env example does not include a real secret.
- LiveKit/current media path remains unchanged.

Review:
- authenticated HTTP endpoint smoke was not executed in this segment.
- no coturn process is started by this segment; it only issues compatible credentials for a future local TURN process.

Fail:
- none found.

## Recommended Next Segment

Recommended next segment:
- `backend-mediasoup-transport-prototype`

Reason:
- local server-side SFU prototype and local TURN credential issuance now exist behind backend boundaries, but a browser provider adapter still needs backend mediasoup WebRTC transport metadata. The next planned step is a narrow backend transport prototype, still without removing LiveKit fallback.

## Verification Performed

Verification performed:
- `bun.cmd run typecheck:api` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- required forbidden-string scan returned no matches after docs wording cleanup.
- `git diff --check` passed.
- `bun.cmd run build:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
