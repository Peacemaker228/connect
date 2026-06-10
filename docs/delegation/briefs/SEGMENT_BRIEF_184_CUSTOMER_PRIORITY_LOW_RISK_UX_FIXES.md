# Segment Brief 184: Customer Priority Low-Risk UX Fixes

## Metadata

- Branch: `feature/customer-priority-low-risk-ux-fixes`
- Segment: `customer-priority-inventory-and-low-risk-ux-fixes`
- Type: scoped product UX fix
- Status: `pass / implemented`

## Context

An external team is actively using `https://staging.ax-connect.ru`, so this segment stayed limited to quick customer-priority UX fixes with low blast radius.

The WebRTC/Stage 9 track remains paused. Staging data, production data, media infrastructure, storage settings, unread state, notification sound, and mentions were intentionally not touched.

## Required Reading

- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_183_CUSTOMER_PRIORITY_TRACK_PAUSE_AND_DELIVERY_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- server create/edit modal files
- chat input and message rendering files
- desktop docs/scripts under `electron/*` and `apps/desktop/*`

## Scope Implemented

### Server Settings Submit Label

- Existing server edit/settings modal submit label now renders `Save`.
- New server creation keeps the default `Create` label.
- Submit behavior, mutation calls, routing, and staged upload cleanup were not changed.
- After edit success, the local React Query `['servers']` list cache and current `['server', serverId]` cache are updated and invalidated so changed server names show without a page reload.

### Chat Input Multiline Behavior

- Main chat composer now uses a compact textarea.
- `Enter` submits the message.
- `Shift+Enter` inserts a newline.
- `Ctrl+Enter` and `Cmd+Enter` were not existing dedicated shortcuts; because `Enter` submits, they continue to submit through the same Enter path unless `Shift` is held.
- Message content is edge-trimmed before submit so whitespace-only messages cannot be sent and leading/trailing blank lines do not create empty rendered space.
- Internal multiline content is preserved.
- The backend channel/direct message create and update paths apply the same edge-trim guard so direct API calls cannot create whitespace-only messages.
- The composer auto-sizes up to roughly 20 visible lines and then scrolls internally.
- The composer scrollbar uses a thin local style so it does not visually dominate the input.
- Text message rendering now preserves intentional newlines with `whitespace-pre-wrap`.

### Chat Input Autofocus After Send

- After a successful send initiated from the chat input, focus returns to the composer.
- Autofocus is retried briefly after `router.refresh()` so the composer stays focused after the refreshed chat tree settles.
- Autofocus is cancelled if pointer interaction moves away during the pending send, which avoids stealing focus from file upload, emoji/menu interactions, media controls, or navigation.
- Existing loading and error behavior is preserved: failed sends do not reset the form and do not force focus.
- After successful send, the chat query cache is updated immediately with the created message and realtime add handling ignores duplicate message ids. This keeps mobile layouts from waiting on a later refresh/socket pass before scrolling.
- The chat scroll hook tracks whether the user is near the bottom and, when appropriate, scrolls the message container itself to the bottom across a few short layout-settle attempts. This fixes mobile browsers that did not show the newly sent message until manual scroll.

### Local Storage Diagnostic

- Local `.env.local` was inspected with secret values redacted from handoff.
- Storage env is present and loaded for the API path.
- A read-only S3 diagnostic using the same `.env.local` credentials successfully listed the target bucket.
- The reported upload failure is therefore classified as external Object Storage write authorization failure: the key/bucket can be read/listed, but `PutObject` is denied by service account role, bucket policy, bucket ACL, KMS/object-lock policy, or an equivalent Yandex Object Storage access rule.
- No storage code, env values, bucket policy, production, or staging configuration was changed.

## Files Changed

- `src/lib/shared/features/modals/common/server-modal.tsx`
  - added a `type: 'create' | 'edit'` mode matching the existing channel modal pattern;
  - renders `Create` for create mode and `Save` for edit mode.
- `src/lib/shared/features/modals/edit-server-modal.tsx`
  - passes `type="edit"` into `ServerModal`.
- `src/lib/chat/features/chat-input.tsx`
  - replaced the single-line composer input with a compact textarea;
  - added Enter submit, Shift+Enter newline, 20-line bounded auto-height, guarded refocus after successful send, and immediate chat cache update after create.
- `src/lib/chat/features/chat-item.tsx`
  - preserves newline formatting in rendered text messages.
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
  - ignores duplicate realtime add events for messages already inserted into the chat cache.
- `src/lib/shared/utils/hooks/use-chat-scroll.ts`
  - tracks near-bottom state and scrolls the chat container to bottom after new messages across mobile layout settle.
- `src/app/globals.css`
  - added a local scrollbar style for the chat composer textarea.
- `packages/app-core/src/schemas/chat-input-schema.ts`
  - edge-trims chat input content and rejects whitespace-only messages.
- `apps/api/src/modules/messages/messages.service.ts`
  - edge-trims and validates channel message content on create/update.
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
  - edge-trims and validates direct message content on create/update.
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
  - recorded this segment result and next recommended segment.
- `docs/roadmap/STAGE_STATUS.md`
  - recorded this segment under Wave 35 and updated next likely work.
- `docs/delegation/briefs/SEGMENT_BRIEF_184_CUSTOMER_PRIORITY_LOW_RISK_UX_FIXES.md`
  - added this handoff brief.

## Verification

Passed:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
bun.cmd run build:web
bun.cmd run check:desktop:config
```

Additional local storage diagnostic:

- `.env.local` storage keys are present; shell-level `STORAGE_*` overrides are absent.
- bucket/public URL shape is internally consistent.
- `ListObjectsV2` with `.env.local` credentials passed.
- app upload still returns `S3-compatible upload failed: Access Denied`, which points at missing/denied write permission outside the app code.

Local web smoke:

- `bun.cmd next dev -p 3011` served the app locally.
- `Invoke-WebRequest http://localhost:3011` returned `200`.
- Headless Playwright loaded `http://localhost:3011` and observed redirect to `/sign-in` with the sign-in form visible.

Not run:

- Existing browser specs were not run because the available Playwright tests are SFU/media smoke tests, not relevant to this UX slice, and media/WebRTC work is out of scope for this segment.
- Authenticated manual smoke for create/edit server and chat send/newline/focus was not completed in this local shell because no local authenticated session/test workspace was available.
- Packaged desktop build was not run. The safe desktop config check passed, and desktop shares the same Next UI code path.

## Intentionally Not Touched

- unread badges or read state;
- notification sound;
- mentions;
- storage/S3/env configuration;
- media provider, LiveKit, SFU, TURN, WebRTC, coturn, mediasoup;
- production or staging server commands;
- DB schema, Prisma migrations, or staging data;
- broad UI redesign.

## Result

- customer-priority low-risk UX fixes: `pass / implemented`
- web verification: `pass for static/type/build and local unauthenticated smoke; authenticated manual smoke not run`
- desktop verification: `partial / safe config check passed; packaged desktop build not run`
- storage upload: `blocked by local Object Storage PutObject AccessDenied outside app code`
- staging: `untouched`
- production: `untouched`

## Recommended Next Segment

`customer-unread-message-badges-and-sound-plan`

Rationale:
- unread indicators and sound touch backend-owned read state, realtime events, and preference behavior, so they should be planned separately before implementation.
