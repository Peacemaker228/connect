# Segment Brief 198: Customer Unread Sound And Mute Settings

## Metadata

- Branch: `feature/customer-unread-sound-and-mute-settings`
- Base: latest `origin/core/reborn`
- Segment: `customer-unread-sound-and-mute-settings`
- Type: customer-priority unread notification UX
- Status: `pass / implemented locally; manual two-user smoke pending`

## Goal

Add an optional short sound for new incoming unread messages and a clear local mute setting, using the existing unread realtime path.

## Implementation

Sound trigger:

- sound is triggered from `use-global-unread-socket`;
- only after the unread realtime event passes existing access/current-user lookup, own-message filtering, active-chat filtering, and global duplicate-event filtering;
- no sound is triggered by initial unread summary load, reload restore, focus/reconnect refetch, or historical unread counts.

Sound playback:

- implemented through the local asset `public/sounds/that-was-quick-606.mp3`;
- no new dependency was added;
- browser autoplay restrictions are handled silently: failed audio playback does not affect unread badges or cache reconciliation.

Setting:

- local setting is stored in `localStorage` under `ax-connect:unread-notification-sound-enabled`;
- default is enabled;
- account dropdown exposes a compact `Notification sound` checkbox;
- future backend profile preference can replace the localStorage store without changing unread event contracts.

Dedupe:

- unread realtime dedupe from Segment 194/195 remains in place;
- sound also has a bounded message-id dedupe map;
- accepted events are marked for sound dedupe even when sound is muted, so replayed old events do not sound after the user unmutes.

## Not Included

- OS/browser Notification API;
- native desktop popup notifications;
- taskbar/app icon badge;
- mentions, `@all`, replies;
- link previews;
- copy/reply message actions;
- DB schema/migrations;
- staging/prod deploy;
- WebRTC/media/storage changes.

## Verification

Passed:

```powershell
git diff --check
bun.cmd x prisma validate
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd run build:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Manual smoke pending:

- two users / two browsers;
- channel unread sound;
- direct unread sound;
- mute toggle;
- reload does not play historical sound;
- idle/reconnect does not double-play;
- active chat does not play.

## Risks / Follow-ups

- Autoplay restrictions can block sound until the browser has accepted user interaction; this is intentionally silent and does not break unread behavior.
- The setting is local to the browser/device for this slice. Backend profile persistence remains a future notification-settings segment.
- Per-channel and per-direct-conversation sound mute is not included in this slice and is recorded as a follow-up requirement. The expected product behavior is: noisy channels/DMs can be muted for sound while still keeping visual unread badges/counts.

## Next Segment

Recommended next segment:

- `customer-unread-per-chat-sound-mute-controls`

Acceptable alternative if attention signals are more urgent:

- `customer-mentions-replies-attention`
