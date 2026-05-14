# SEGMENT BRIEF 097. Local SFU Browser TURN Smoke Rerun

Branch:
- `wave/stage8-local-sfu-browser-turn-smoke-rerun`

Segment:
- `local-sfu-browser-turn-smoke-rerun`

## Goal

Finish the local SFU smoke gate before `mvp-private-small-room-replacement` by running the authenticated browser smoke route added in Segment 096 and confirming whether direct and TURN relay paths are ready.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`

Docs read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_096_LOCAL_SFU_DIRECT_TURN_SMOKE.md`

Local runtime checked:
- existing API listener on `localhost:4000`
- existing web listener on `localhost:3001`
- `GET http://localhost:4000/api/health`
- unauthenticated `GET http://localhost:3001/media/sfu-smoke` redirects to sign-in
- local TURN env keys under `.env*`
- local `turnserver` / `coturn` command availability
- TCP reachability of `127.0.0.1:3478`

## Files Changed

Added:
- `docs/delegation/briefs/SEGMENT_BRIEF_097_LOCAL_SFU_BROWSER_TURN_SMOKE_RERUN.md`

Changed:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

No runtime code changed in this rerun segment.

## Smoke Setup

Local services:
- API was already listening on `localhost:4000`
- web was already listening on `localhost:3001`
- API health returned `status: "ok"`

Authenticated browser:
- a local password auth profile was created/reused through the backend auth API
- Playwright Chromium was downloaded to the local tool cache only because no system Chrome/Edge/Chromium browser was available
- Chromium was launched directly through CDP; no Playwright dependency was added to the repo
- auth cookies were set in the browser context before opening `http://localhost:3001/media/sfu-smoke`

## Direct Browser Smoke Result

Status:
- `pass`

Observed in authenticated Chromium:
- route: `http://localhost:3001/media/sfu-smoke`
- browser: `Chrome/141.0.7390.37`
- direct smoke status: `pass`
- producer id observed: `b5127fad-9844-47c5-b050-7efebc1a92bf`
- consumer id observed: `95fd4e9d-d2a6-4c2d-9f8e-9dad1753153f`
- consumed remote track state: `live`
- smoke harness reported all direct steps as `pass`

Direct path covered:
- authenticated health
- create send transport
- create receive transport
- connect through mediasoup-client transport events
- produce local synthetic audio track
- create compatible consumer metadata
- consume remote track
- observe live remote track in the browser harness

## TURN Relay Smoke Result

Status:
- `blocked`

Observed:
- local `.env*` files do not define `LOCAL_TURN_URLS`, `LOCAL_TURN_STATIC_AUTH_SECRET`, or `LOCAL_TURN_TTL_SECONDS`
- `turnserver` / `coturn` command was not available in `PATH`
- TCP check to `127.0.0.1:3478` failed
- authenticated browser TURN run returned `blocked`
- harness reason: `LOCAL_TURN_STATIC_AUTH_SECRET is not configured`

TURN relay was not proven in this environment.

## Acceptance Result

Pass:
- authenticated browser direct SFU smoke passed end to end.
- a remote consumed track was observed as `live`.
- current `MediaRoom` and default routes remain on LiveKit.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.

Blocked:
- TURN relay smoke is blocked by missing local coturn runtime and missing local TURN env.

Review:
- direct smoke used the synthetic audio harness from Segment 096, not camera or microphone capture.
- local tool-cache Chromium was used for browser automation because no system browser was installed.

Fail:
- none found in the direct browser SFU path.

## Handoff

Direct browser smoke:
- `pass`

TURN relay smoke:
- `blocked`

Blockers before `mvp-private-small-room-replacement`:
- provide a local coturn runtime
- configure local-only `LOCAL_TURN_URLS`, `LOCAL_TURN_STATIC_AUTH_SECRET`, and optional `LOCAL_TURN_TTL_SECONDS`
- rerun `/media/sfu-smoke` TURN mode and record relay-mode result

Recommended next segment:
- `local-coturn-turn-relay-unblock`

Reason:
- the direct browser SFU path is now proven, but the roadmap still requires TURN relay validation before replacement.

## Verification Performed

Verification performed during implementation:
- authenticated browser `/media/sfu-smoke` Direct run passed
- authenticated browser `/media/sfu-smoke` TURN run returned blocked with backend reason
- `git diff --check` passed
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed
- `bun.cmd run typecheck:api` passed
- `bun.cmd run build:api` passed
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`
- `bun.cmd run build:web` passed with the same existing warning
