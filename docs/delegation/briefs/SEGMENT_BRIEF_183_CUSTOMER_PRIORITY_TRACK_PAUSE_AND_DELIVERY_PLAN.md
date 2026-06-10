# Segment Brief 183: Customer Priority Track Pause And Delivery Plan

## Metadata

- Branch: `wave/stage9-customer-priority-track-pause-and-plan`
- Segment: `customer-priority-track-pause-and-delivery-plan`
- Type: docs-only planning / priority reset
- Status: `pass / documented`

## Context

An external team has started using `https://staging.ax-connect.ru` as an active working stand. Their requests are now priority one.

The previous active track was Stage 9 WebRTC production/staging hardening. Segment 182 fixed the staging TURN relay network path but left cleanup convergence blocked after successful TURN relay.

The WebRTC work is paused, not cancelled. The resume brief for the next WebRTC segment is recorded in `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`.

## Files Added

- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`

## Files Updated

- `docs/roadmap/STAGE_STATUS.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/waves/PRODUCTION_MEDIA_INFRA_RUNBOOK_PLAN.md`

## Decisions

### WebRTC / Stage 9

Decision: pause.

Current state:
- staging TURN relay network path: fixed in Segment 182;
- remaining WebRTC blocker: cleanup convergence after successful TURN relay;
- next WebRTC segment is saved as `staging-turn-success-cleanup-convergence-fix`;
- no production media rollout is allowed while paused;
- LiveKit fallback remains preserved.

### Staging Stand

Decision: `staging.ax-connect.ru` becomes the temporary user-facing working stand.

Rules:
- do not reset staging DB;
- do not run disruptive media smoke/tests during user work;
- do not make risky infra experiments there without an explicit operator window;
- deploy scoped customer fixes only after checks and with a rollback path.

### Branches

Decision:
- `core/reborn` is the active development base;
- legacy `main` should not receive new product work by default;
- do not delete/recreate `main` as part of this segment;
- any future `main` reset from `core/reborn` requires a separate repo-admin segment.

### Dev/Test Stand

Decision:
- a separate dev/preview stand is recommended before risky media/infra experiments resume;
- staging should not be used as the playground while the team is actively working there.

### Desktop-First

Decision:
- customer-priority features must consider desktop after web verification;
- if desktop verification is blocked, document the blocker instead of claiming pass.

## Captured Customer Requirements

Priority items:
- unread message indicators for channels and direct messages;
- optional notification sound and mute/disable sound setting;
- server settings/edit submit label should say `Save`, not `Create`;
- server settings/edit changes should propagate to other connected participants through realtime, not only local cache update;
- staging storage readiness for server avatars;
- multiline chat input behavior;
- mentions with `@user` and `@all`;
- clickable link rendering and optional safe link previews;
- message copy action, including safe text/media copy fallback;
- reply-to-message like Discord/Telegram;
- chat input autofocus after send;
- media provider/fallback UI and explanation;
- remote screen share fullscreen/focused view;
- web and desktop verification for shared UI flows.

## Recommended Work Order

1. `customer-priority-inventory-and-low-risk-ux-fixes`
   - server settings `Save` label;
   - chat input autofocus after send;
   - multiline input behavior.
2. `customer-server-edit-realtime-propagation-fix`
   - server update socket/event propagation for connected participants.
3. `customer-unread-message-badges-and-sound-plan`
   - backend/read-state/realtime design.
4. `customer-unread-message-badges-implementation`
   - persisted unread/read state, realtime badges, sound preference.
5. `customer-mentions-user-and-all`
   - mention parsing, UI picker, rendering, notifications.
6. `customer-message-link-rendering-and-preview`
   - safe clickable links first, then backend-owned link previews if approved.
7. `customer-message-copy-action`
   - copy text/multiline/link/media messages with safe media fallback.
8. `customer-reply-to-message`
   - persisted reply target, reply preview rendering, realtime support.
9. `customer-staging-storage-readiness`
   - configure staging storage outside repo and smoke avatar upload.
10. `customer-media-fallback-ui-and-screen-share-fullscreen`
   - explicit fallback/provider UI and screen-share fullscreen.
11. `customer-desktop-parity-smoke`
   - desktop checks for all shared UI changes.

## Resume WebRTC Brief

Stored in:
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`

Resume segment:
- Branch: `wave/stage9-staging-turn-success-cleanup-convergence-fix`
- Segment: `staging-turn-success-cleanup-convergence-fix`

## Verification

Required:

```bash
git diff --check
bun.cmd x tsc --noEmit -p tsconfig.json
bun.cmd run typecheck:api
bun.cmd x next lint
```

No runtime code, DB, env, production, staging server, or WebRTC behavior changes are made by this segment.

## Classification

- customer-priority plan: `pass / documented`
- WebRTC Stage 9: `paused / resumable`
- staging as active user workspace: `acknowledged / protect data`
- production Postgres migration: `deferred / untouched`
- production media rollout: `blocked / untouched`
- LiveKit fallback: `preserved`

## Recommended Next Segment

`customer-priority-inventory-and-low-risk-ux-fixes`

Rationale:
- fastest safe impact for the team;
- avoids DB/schema changes for the first customer-priority step;
- does not disturb staging media infrastructure;
- prepares the app for heavier unread/mentions work.
