# SEGMENT BRIEF 121. Channel SFU Non-Production Default-Candidate Gate

Branch:
- `wave/stage8-channel-sfu-nonproduction-default-candidate-gate`

Wave:
- `33 / MEDIA_MVP_IMPLEMENTATION_PLAN`

Segment:
- `channel-sfu-nonproduction-default-candidate-gate`

## Goal

Add a reversible non-production default-candidate gate for channel SFU without enabling a production or product-facing default switch.

## Scope Boundary

Changed:
- added non-production channel `AUDIO` and channel `VIDEO` SFU default-candidate selection in `MediaRoom`.
- preserved existing explicit query SFU gates.
- added explicit LiveKit rollback query handling.
- updated guarded channel `AUDIO` and channel `VIDEO` browser smokes so they can exercise candidate mode without per-URL `mediaProvider=sfu`.
- updated Wave 33 and Stage 8 status.

Preserved:
- production does not open candidate SFU because the SFU render path remains guarded by `NODE_ENV !== 'production'`.
- candidate flags are off by default.
- ordinary private `?video=true` remains LiveKit by default.
- explicit private SFU gate remains query-controlled only.
- LiveKit fallback was not removed or weakened.
- channel `AUDIO` and channel `VIDEO` still have explicit LiveKit rollback.
- no screen-share implementation was added.
- no production infra/env/nginx/firewall/deploy changes were made.
- no process-local/multi-process state work was attempted.

## Gate Names

Runtime candidate env:
- `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE=1`
- `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`

Rollback query overrides:
- `?mediaProvider=livekit`
- `?livekit=true`
- `?sfu=false`

Smoke env:
- `CHANNEL_AUDIO_SFU_SMOKE_CANDIDATE_GATE=1`
- `CHANNEL_VIDEO_SFU_SMOKE_CANDIDATE_GATE=1`

Explicit query gates retained:
- channel `AUDIO`: `?mediaProvider=sfu&sfuChannel=true`
- channel `VIDEO`: `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real`
- relay mode: `sfuTransport=turn` or `sfuIce=relay`

## Results

Candidate gate result:
- `pass for local/dev guarded candidate mode`

Channel `AUDIO` candidate smoke:
- `pass`
- web started with `NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE=1`
- test used `CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 CHANNEL_AUDIO_SFU_SMOKE_CANDIDATE_GATE=1 CHANNEL_AUDIO_SFU_SMOKE_USERS=3`
- participants opened channel `AUDIO` without `mediaProvider=sfu` or `sfuChannel=true` in the URL.
- candidate mode selected real microphone capture behavior for channel `AUDIO`.
- all participants reached `connected`.
- expected remote producer count was observed.
- `Capture mode: real` was asserted for channel `AUDIO` candidate participants.
- restart and leave/rejoin passed.
- `?mediaProvider=livekit` rollback assertion passed.

Channel `VIDEO` candidate smoke:
- `pass`
- web started with `NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE=1`
- test used `CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 CHANNEL_VIDEO_SFU_SMOKE_CANDIDATE_GATE=1 CHANNEL_VIDEO_SFU_SMOKE_USERS=2`
- participants opened channel `VIDEO` without `mediaProvider=sfu`, `sfuChannel=true`, `sfuVideo=true`, or `sfuCapture=real` in the URL.
- candidate mode selected real capture behavior for channel `VIDEO`.
- both participants reached `connected`.
- expected audio+video remote producer count and remote video tile count were observed.
- restart and leave/rejoin passed.
- no-camera fallback assertion passed.
- `?mediaProvider=livekit` rollback assertion passed.

TURN:
- not rerun in candidate mode in this segment.
- explicit-gate TURN proof remains Segment 119 for physical channel `VIDEO` and Segment 117 for 3-user channel `VIDEO`; channel `AUDIO` TURN proof remains Segment 113.

## Remaining Blockers Before Product/Production Default

- production/multi-process readiness remains blocked by process-local mediasoup/signaling state.
- SFU screen-share remains deferred; LiveKit still covers ordinary/default routes.
- production TURN/SFU infra, runbook, monitoring, firewall, process management, and rollback procedure remain out of scope.
- product-facing default still needs a separate decision after candidate soak and any required subjective QA.

## Handoff

Candidate gate:
- `pass` for local/dev non-production candidate mode.

Rollback behavior:
- explicit LiveKit override works through `?mediaProvider=livekit`.
- `?livekit=true` and `?sfu=false` are supported by the runtime selection guard.

LiveKit fallback/default preservation:
- preserved.
- candidate flags are off by default and production-blocked.
- private default remains LiveKit.

Recommended next segment:
- `channel-sfu-nonproduction-candidate-soak-and-turn-rerun`

## Verification Performed

Commands:
- `git diff --check`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run test:browser`
- `bun.cmd run test:browser:private-sfu`
- `bun.cmd run test:browser:channel-audio-sfu`
- `bun.cmd run test:browser:channel-video-sfu`
- guarded channel `AUDIO` candidate-gate smoke
- guarded channel `VIDEO` candidate-gate smoke

Results:
- all required verification commands passed.
- guarded browser scripts skipped safely without smoke env flags.
- guarded channel `AUDIO` candidate-gate smoke passed.
- guarded channel `VIDEO` candidate-gate smoke passed.
