# SEGMENT BRIEF 084. App-Core Media Contracts Code

Branch:
- `wave/stage8-app-core-media-contracts-code`

Segment:
- `app-core-media-contracts-code`

## Goal

Implement the first Stage 8 vendor-neutral media contract surface in `packages/app-core` without runtime behavior changes.

This segment changes only app-core contract types/exports and roadmap docs. It does not change `apps/api`, `packages/sdk`, web media runtime code, dependencies, infra, env, deploy docs, or the current microphone/media behavior.

## Required Reading / Checks

Repository state checked:
- `git status --short --branch`
- `git log --oneline -8`
- `git diff --name-only`

Docs/code read:
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_078_MEDIA_CONTRACT_SHAPE_DESIGN.md`
- `packages/app-core/src/contracts/media-provider.ts`
- `packages/app-core/src/contracts/index.ts`

## Files Changed

Changed:
- `packages/app-core/src/contracts/media-provider.ts`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/MEDIA_MVP_IMPLEMENTATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_084_APP_CORE_MEDIA_CONTRACTS_CODE.md`

Reviewed but unchanged:
- `packages/app-core/src/contracts/index.ts`

Reason:
- the existing barrel already exports `./media-provider`, so the new contract surface remains available through the existing `packages/app-core/src/contracts` export path.

## Contract Surface Added

Room/scope contracts:
- `MediaRoomScopeKind`
- `MediaRoomMode`
- `MediaRoomScope`
- `MediaRoomDescriptor`

Participant/session contracts:
- `MediaParticipantIdentity`
- `MediaParticipantSession`
- `MediaParticipantLifecycleState`

Permission contracts:
- `MediaPermissions`
- `MediaPermissionReason`
- `MediaPermissionSnapshot`

Media state contracts:
- `MediaBooleanState`
- `MediaState`
- `MediaStatePatch`
- `MediaStateSnapshot`

Track contracts:
- `MediaTrackKind`
- `MediaTrackSource`
- `MediaTrackState`
- `MediaTrack`

Lifecycle/reconnect contracts:
- `MediaRoomLifecycleState`
- `MediaDisconnectReason`
- `MediaReconnectPolicy`
- `MediaReconnectState`
- `ResumeMediaSessionCommand`

Screen-share and error contracts:
- `MediaScreenShareReplacePolicy`
- `MediaScreenSharePolicy`
- `MediaErrorCode`
- `MediaError`

Command/event contracts:
- `MEDIA_CLIENT_COMMAND_NAMES`
- `MediaClientCommandName`
- `MEDIA_SERVER_EVENT_NAMES`
- `MediaServerEventName`
- command payload base types for room, participant, state, track, screen-share, subscription, reconnect, and resume commands
- server event payload base types for room, participant, track, permissions, reconnect, and error events

## Compatibility Notes

Existing seed contracts remain exported:
- `MediaConnectionState`
- `MediaParticipant`
- `MediaRoom`
- `MediaRoomAccessRequest`
- `MediaRoomAccess`
- `MediaParticipantStatePatch`
- `MediaProvider`

Transitional compatibility aliases were added:
- `CreateRoomAccessRequest`
- `CreateRoomAccess`
- `LegacyMediaPermissions`
- `TransitionalMediaPermissions`

`MediaRoomAccess` now carries optional app-shaped metadata for future adapters:
- `descriptor`
- `participantSession`
- `providerAccess`
- `permissions`
- `state`

Top-level `token` and `endpoint` stay available on `MediaRoomAccess` for the current compatibility path.

## Boundary Result

Pass:
- app-core now has a concrete vendor-neutral media contract vocabulary from Segment 078.
- the contract covers room scope/mode, stable participant/session identity, permissions, desired/published state, tracks, lifecycle, reconnect/resume, screen-share policy, errors, commands, and events.
- existing media exports remain reachable through the existing barrel export.
- no media runtime implementation, dependency, infra, or product behavior change was introduced.

Review:
- the next SDK segment should decide how much of the command payload surface is used immediately versus kept as typed future surface.
- backend/client adapter code should keep provider-specific access details below `providerAccess` and avoid leaking them into app UI contracts.
- `ResumeMediaSessionCommand.resumeToken` remains optional until the backend control-plane decides whether session identity alone is sufficient.

Block:
- no runtime replacement should start before the SDK command surface and adapter containment segments define compatibility with the current token flow.

Overall:
- `pass`

## Recommended Next Segment

Recommended next segment:
- `sdk-media-command-surface`

Reason:
- app-core now exports the shared media contract vocabulary needed for SDK media commands without changing runtime behavior.

## Verification Performed

Verification performed:
- `rg -n "LiveKit|livekit|mediasoup|coturn" packages/app-core/src` returned no matches.
- `bun.cmd x tsc --noEmit -p tsconfig.json` passed.
- `bun.cmd run typecheck:api` passed.
- `git diff --check` passed.
