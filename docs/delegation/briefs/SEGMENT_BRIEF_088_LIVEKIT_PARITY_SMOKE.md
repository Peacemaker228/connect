# SEGMENT BRIEF 088. LiveKit Parity Smoke

Branch:
- `wave/stage8-livekit-parity-smoke`

Segment:
- `livekit-parity-smoke`

## Goal

Check whether backend/client LiveKit containment broke the current media flows.

This segment is docs/report only. It does not change runtime code, does not fix the current microphone/media behavior, does not remove LiveKit, does not add media dependencies, and does not change SDK/API/UI behavior, env, infra, or production deploy docs.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_087_CLIENT_LIVEKIT_ADAPTER_CONTAINMENT.md`
- `src/lib/shared/features/media-room.tsx`
- `src/lib/shared/features/media/livekit-client-adapter.tsx`
- `packages/sdk/src/actions/media.ts`
- `apps/api/src/modules/media/media.controller.ts`
- `apps/api/src/modules/media/livekit-media-provider.adapter.ts`
- channel media entry page
- direct conversation media entry page

## Smoke Method

Executed:
- static route/prop parity review
- current token path review
- backend adapter response-shape review
- client adapter behavior review
- TypeScript/lint verification

Not executed:
- authenticated browser join against a running LiveKit service
- real microphone/camera permission prompt
- real device-in-use/not-found error generation
- real screen-share publish
- real two-participant private call

Reason:
- this segment is docs/report only, and the current shell did not run a full authenticated app + real device + LiveKit session smoke. No runtime fixes or test harness changes were made.

## Smoke Matrix

Channel `AUDIO`: `review / static pass`
- route entry still renders `<MediaRoom chatId={channel.id} serverId={serverId} video={false} audio={true} />`
- `LiveKitClientAdapter` starts microphone when `audio=true`
- camera start remains gated behind `video=true`
- manual mic-only browser join/leave was not executed

Channel `VIDEO`: `review / static pass`
- route entry still renders `<MediaRoom chatId={channel.id} serverId={serverId} video={true} audio={true} />`
- `LiveKitClientAdapter` starts microphone and camera when both intents are true
- manual mic+camera browser join/leave was not executed

Private video mode: `review / static pass`
- direct conversation page still renders `MediaRoom` only when `video` query is present
- private `MediaRoom` still receives `video={true}` and `audio={true}`
- `chatId` remains `conversation.id`
- manual private video call was not executed

Leave redirect: `review / static pass`
- channel leave still falls back to server general text channel when present, else server root
- private conversation leave still uses `leaveRedirectHref` without `?video=true`
- adapter still detects `.lk-disconnect-button` before running the leave callback
- manual click/redirect smoke was not executed

Preferred-device fallback: `review / static pass`
- adapter still enumerates devices
- microphone start still retries default device when preferred mic fails
- camera start still retries default camera when preferred camera fails
- manual device fallback failure was not executed

Device permission/error toast: `review / static pass`
- adapter still maps `MediaDeviceFailure` to the existing user-visible toast messages
- `onMediaDeviceFailure` still calls the toast mapping
- startup failures still reset requested device and surface a toast
- manual permission-denied/device-in-use/not-found smoke was not executed

Mute/camera/screen-share controls: `review / static pass`
- adapter still renders `VideoConference`
- no controls were removed from the current LiveKit UI
- manual mute/camera/screen-share control smoke was not executed

Token endpoint through `getLiveKitToken`: `review / static pass`
- SDK still calls `GET /api/media/livekit-token`
- request params remain `{ room, username }`
- backend controller still exposes `GET /api/media/livekit-token`
- backend adapter still returns `{ token }`
- manual HTTP token request against running env was not executed

## Result

Pass:
- build/type/lint checks passed.
- static parity for route props, token path, backend token response shape, adapter connection props, device startup behavior, leave redirect wiring, and LiveKit UI wrapper is preserved.
- no runtime code was changed in this smoke segment.

Review:
- manual media-device and LiveKit-room browser smoke was not executed.
- current known microphone/media issue remains intentionally unpatched.
- token endpoint was not live-tested against real LiveKit env in this segment.

Fail:
- none found from static/build smoke.

Overall:
- `review`

## Recommended Next Segment

Recommended next segment:
- `backend-media-control-plane-implementation`

Reason:
- containment is in place and static parity checks did not find a regression; the next implementation step is backend control-plane ownership, while manual LiveKit parity remains a review item for any later runtime rollout decision.

## Verification Performed

Verification performed:
- `git diff --check` passed.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
- `bun.cmd x next lint` passed with the existing warning in `src/lib/shared/features/emoji-picker-custom.tsx`.
