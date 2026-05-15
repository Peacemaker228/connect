# SEGMENT BRIEF 108. Private SFU Network Interruption Reconnect QA

Branch:
- `wave/stage8-private-sfu-network-interruption-reconnect-qa`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `private-sfu-network-interruption-reconnect-qa`

## Goal

Verify and document gated private SFU behavior when one authenticated browser participant loses and restores network connectivity before any small-room/channel replacement.

## Scope Boundary

Preserved:
- ordinary private `?video=true` remains LiveKit.
- channel `AUDIO` and `VIDEO` remain LiveKit.
- private SFU remains explicit-gated to non-production conversation routes only.
- no broad small-room/channel replacement was started.
- no LiveKit fallback was removed or weakened.
- no production infra/env/nginx/firewall/deploy changes were made.
- no Stage 6 production Postgres work was touched.

## Change Summary

Private SFU reconnect/status handling:
- transient media signaling `EventSource.onerror` after the initial snapshot now moves the UI to `reconnecting` instead of terminal `failed`.
- when the browser restores the SSE stream and receives a fresh producer snapshot, the UI returns to `connected` if the remote producer is already consumed.
- initial SSE failure before any snapshot still fails the call, because the client has no trusted room/producer baseline yet.

Browser smoke coverage:
- `tests/browser/private-sfu-two-user-smoke.spec.ts` now supports `PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1`.
- the guarded smoke uses `BrowserContext.setOffline(true)` for one authenticated participant, waits 6 seconds, restores online mode, then expects:
  - status returns to `connected`.
  - remote producer count remains stable.
  - the existing Restart SFU private call recovery still reaches `connected`.

## QA Result

Network interruption result:
- `pass / browser offline-restore smoke`
- command used:
  - `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1 bun.cmd run test:browser:private-sfu`
- result:
  - passed with two authenticated private SFU users.
  - `sfuCapture=real` ran under Chromium fake-device media.
  - one browser context was forced offline for 6 seconds and restored.
  - the interrupted participant returned to `connected`.
  - expected remote producer count remained stable.
  - manual Restart SFU private call still recovered to `connected`.

Restore result:
- `pass / status and producer count recovered after restore`

Restart recovery result:
- `pass / restart still recovers after restore`

Stale producer cleanup result:
- `pass / no inflated remote producer count observed`
- Segment 107 stale session cleanup remains in force.

No-camera fallback regression result:
- `pass`
- command used:
  - `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
- result:
  - passed with simulated missing-camera fallback.
  - audio-only fallback, microphone toggle, disabled camera control, and stable remote producer count remained covered by the existing guarded smoke.

Local environment note:
- first network smoke attempt was blocked by a stale `.next` dev cache error: missing `./vendor-chunks/@radix-ui.js`.
- the local web dev server was restarted on port `3001` after clearing `.next`; the rerun passed.
- this was a local dev-server cache issue, not a private SFU runtime failure.

## Handoff

LiveKit fallback/default:
- `pass / preserved`

Network interruption result:
- `pass / browser offline-restore smoke`

Restore result:
- `pass`

Restart recovery result:
- `pass`

Stale producer cleanup result:
- `pass`

Remaining blockers before small-room/channel replacement:
- physical camera QA on a machine with real camera hardware.
- optional physical-device TURN relay signoff if required for release confidence.
- SFU screen-share implementation or explicit MVP deferral decision.
- broader load/readiness for small-room/channel routes remains unstarted.

Recommended next segment:
- `private-sfu-physical-camera-turn-qa`

Reason:
- no-camera fallback and network interruption/restart behavior are now covered; the remaining device parity gap is camera-equipped physical hardware plus optional physical TURN signoff.

## Verification Performed

Commands:
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT=1 bun.cmd run test:browser:private-sfu`
- `PRIVATE_SFU_BROWSER_SMOKE=1 PRIVATE_SFU_SMOKE_HOST=localhost PRIVATE_SFU_SMOKE_API_PORT=4000 PRIVATE_SFU_SMOKE_WEB_PORT=3001 PRIVATE_SFU_SMOKE_CAPTURE=real-missing-camera bun.cmd run test:browser:private-sfu`
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`

Results:
- all required verification commands passed.
- `bun.cmd x next lint` and `bun.cmd run build:web` completed with the pre-existing `src/lib/shared/features/emoji-picker-custom.tsx` `no-explicit-any` warning.
- `bun.cmd run test:browser` and `bun.cmd run test:browser:private-sfu` skipped without `PRIVATE_SFU_BROWSER_SMOKE=1`, as intended.
