# Customer Priority Delivery Plan

## Why This Exists

An external team has started using `https://staging.ax-connect.ru` as an active working space.

Their requests now have priority over the ongoing WebRTC migration work. The goal is to keep the service usable for them, add practical product features quickly, and avoid breaking the staging workspace while still preserving the existing migration roadmap.

## Current Decision

Status: `active / customer-priority track`

Decisions:
- pause Stage 9 WebRTC production/staging hardening after Segment 182;
- keep the latest WebRTC resume brief documented in this plan;
- treat `staging.ax-connect.ru` as the temporary user-facing working stand;
- do not reset staging DB, redeploy disruptive media experiments, or run disruptive smoke tests there without an explicit operator window;
- keep `core/reborn` as the active development base;
- do not merge new work into the legacy `main` branch by default;
- do not delete or recreate `main` as part of this customer-priority work; branch cleanup/reset is a separate repository-admin decision;
- production Postgres migration remains deferred;
- LiveKit fallback remains available while custom SFU work is paused.

## Stand Strategy

### Staging

Current role: temporary working stand for the external team.

Rules:
- no destructive DB reset;
- no ad hoc schema reset;
- no media infrastructure experiments during active user work;
- no staging env secret values in docs or commits;
- deployment is allowed for scoped product fixes, but only after normal build checks and with a short rollback path.

### Development / Test Stand

Recommendation: create a separate dev or preview stand before risky infra/media experiments resume.

Possible target:
- `dev.ax-connect.ru` or another explicit preprod hostname;
- separate app/API processes;
- separate DB;
- separate storage bucket/prefix;
- separate TURN/SFU env;
- no real user workflow dependency.

Until that exists:
- use local development and guarded browser tests for risky changes;
- deploy to staging only for scoped product fixes needed by the team.

## Branch Strategy

Current active source branch:
- `core/reborn`

Feature branch pattern:
- `feature/customer-unread-message-badges`
- `feature/customer-chat-input-ux`
- `feature/customer-mentions`
- `feature/customer-staging-storage-readiness`
- `feature/customer-media-fallback-ui`

Rules:
- branch from latest `core/reborn`;
- keep PRs small and user-visible;
- do not use `main` for new work unless a separate repo-admin segment explicitly changes branch policy;
- do not rewrite `main` while staging is being used unless there is a reviewed backup/branch-protection plan.

## Priority Requirements

### P0. Staging Reliability

Problem:
- staging is now a real working space for the team.

Required:
- preserve existing staging data;
- make deploy steps predictable;
- make rollback clear;
- avoid disruptive WebRTC/TURN experiments on staging until a separate dev stand exists or a testing window is approved.

Acceptance:
- team can continue using current staging server/channel/conversation data;
- product fixes deploy without data reset;
- WebRTC migration state is paused and resumable from docs.

### P1. New Message Indicators And Optional Sound

Problem:
- incoming channel or direct messages are not visible enough for recipients when they are not looking at the active conversation.

Required behavior:
- channel list item shows a red unread badge when new messages arrive outside the active channel;
- direct message/member list item shows a red unread badge when a new direct message arrives outside the active conversation;
- unread state survives reload;
- unread state clears when the user opens the channel/conversation;
- realtime updates should update badges without reload;
- optional notification sound for new messages;
- user can mute/disable sound.

Implementation direction:
- backend-owned persisted read state, not UI-only badges;
- per-member channel read state;
- per-member or per-profile direct conversation read state;
- realtime event updates the client cache;
- UI renders badges from read-state/unread-count state;
- sound preference should be persisted or at least kept in a user/local setting with a clear future persistence path.

Out of scope for first slice:
- OS push notifications;
- email notifications;
- mobile push;
- full notification settings matrix.

### P1. Server Settings Submit Label

Problem:
- an existing server settings/edit modal shows a create-style button at the bottom.

Required:
- for existing server edit/settings flow, the button label should be `Save` or equivalent;
- create flow should remain `Create` where it creates a new server.

Acceptance:
- no behavior regression in server create/edit;
- label matches action.

### P1. Staging Storage Readiness

Problem:
- staging currently lacks real storage secrets/config, so server avatar upload can fail.

Required:
- identify the current active storage provider path in `core/reborn`;
- configure staging storage outside repo without committing secrets;
- smoke server avatar upload on staging;
- preserve production and local env separation.

Acceptance:
- server avatar upload works on staging;
- no secret values are committed or written into docs;
- rollback path is documented.

### P1. Chat Input Newline Behavior

Problem:
- users need multiline messages.

Required:
- `Enter` sends by default if that is current app behavior;
- `Shift+Enter` inserts a newline;
- consider `Ctrl+Enter` or `Cmd+Enter` as a send shortcut only if it does not conflict with existing user expectation;
- textarea/input height should remain usable and not break compact desktop UI.

Acceptance:
- multiline messages can be typed and sent;
- sending still feels fast;
- desktop/web behavior is aligned.

### P1. Mentions

Problem:
- `@` mentions do not work, including mention-all behavior.

Required:
- mention users in channel messages;
- support `@all` for notifying/tagging everyone in scope;
- parse/store mention metadata, not just raw text styling;
- render mentions in message text;
- connect mentions to unread/notification behavior where possible;
- permission for `@all` should be considered, but first slice can keep it simple if product urgency requires it.

Acceptance:
- typing `@` can select users;
- `@all` is recognized;
- mentioned users get visible unread/notification indication;
- behavior works in web and desktop where the same UI is used.

### P1. Link Rendering And Link Preview

Problem:
- pasted URLs are not clearly rendered as clickable links.
- users expect shared links to be easy to open and, when possible, to show a useful preview.

Required behavior:
- URLs in messages render as clickable links;
- links open safely in a new browser tab/window or desktop-safe external browser flow;
- link text is visually distinguishable from normal message text;
- long URLs should wrap/truncate without breaking chat layout;
- optional preview/unfurl should show basic metadata when available: title, description, site name, and image if safe;
- preview fetching must not expose secrets, auth cookies, or server-private network access.

Implementation direction:
- first slice can render detected URLs as safe links without preview;
- preview/unfurl should be a separate scoped segment with backend-owned metadata fetching and SSRF protections;
- do not fetch arbitrary link previews directly from the browser if that creates CORS, privacy, or inconsistent behavior;
- store or cache preview metadata only if a clear invalidation and safety policy exists.

Acceptance:
- sending a message with `https://example.com` renders a clickable link;
- link click works in web and desktop-safe flow;
- malformed URLs do not become unsafe links;
- preview support, if implemented, is safe and does not block message rendering.

### P1. Chat Input Autofocus After Send

Problem:
- after sending a message, the input should stay ready for the next message.

Required:
- focus returns to chat input after successful send;
- do not steal focus while user is interacting with attachments, menus, or media controls.

Acceptance:
- fast consecutive messaging works naturally.

### P2. Media Provider Choice And Fallback UI

Problem:
- users need a clear way to use audio/video even if LiveKit is unavailable, while custom SFU is not yet production-ready.

Required:
- add clear UI affordance or explanation for available media modes where appropriate;
- preserve LiveKit default/fallback;
- allow explicit custom SFU path only where already gated and safe;
- avoid enabling risky production defaults;
- provide clear user-facing explanation if a mode is experimental or fallback.

Acceptance:
- users can intentionally choose or fall back to the working mode without hidden query params where product-approved;
- no production default switch happens by accident.

### P2. Screen Share Fullscreen View

Problem:
- when a colleague shares screen, the viewer needs to expand it to full screen or a focused large view.

Required:
- viewer can expand remote screen share;
- viewer can exit expanded mode;
- audio/video call controls remain reachable or recoverable;
- works in web and desktop.

Acceptance:
- shared content is readable enough during work sessions.

## Desktop-First Requirement

The master roadmap already defines the product as `desktop-first`.

For this customer-priority track:
- web verification is still first because staging is browser-served;
- desktop verification must follow for chat/media/input changes that affect shared UI;
- if desktop packaging is blocked, document the blocker and do not claim desktop pass.

Minimum desktop checks for relevant features:
- login/session still works;
- channel/direct chat message send works;
- unread indicators render;
- sound preference works or is explicitly web-only in the first slice;
- multiline input works;
- mentions UI works;
- media route/fallback UI does not break desktop shell.

## Deferred WebRTC Resume Brief

The next WebRTC segment is intentionally paused, not cancelled.

Resume when customer-priority fixes are stable or when a separate dev stand exists.

```md
Branch: wave/stage9-staging-turn-success-cleanup-convergence-fix
Segment: staging-turn-success-cleanup-convergence-fix

Context:
Segment 182 fixed TURN relay network path on staging:
- MEDIA_SFU_ANNOUNCED_ADDRESS points to staging public IPv4;
- coturn external-ip/relay-ip corrected;
- coturn uses network_mode: host;
- TURN selected relay/host ICE pair;
- remote track became live.

Remaining blocker:
After successful TURN harness cleanup does not converge:
- rooms=0
- transports=2
- producers=1
- consumers=1
even after second cleanup and bounded 20s recheck.

This means TURN media path now works. Do not revisit network config unless evidence changes. The next problem is resource lifecycle cleanup after successful TURN.

Read first:
- docs/delegation/briefs/SEGMENT_BRIEF_182_STAGING_TURN_RELAY_NETWORK_CONFIG_FIX.md
- docs/delegation/briefs/SEGMENT_BRIEF_181_STAGING_TURN_RELAY_DIAGNOSTICS_RERUN.md
- docs/delegation/briefs/SEGMENT_BRIEF_179_STAGING_MEDIA_TURN_RELAY_CONSUME_CLEANUP_FIX.md
- apps/api/src/modules/media/mediasoup-prototype.service.ts
- apps/api/src/modules/media/media.controller.ts
- packages/sdk/src/actions/media.ts
- src/lib/shared/features/media/sfu-client-adapter.ts
- src/lib/shared/features/media/sfu-smoke-harness.tsx

Goal:
Fix cleanup convergence after successful TURN smoke so active rooms/sessions/transports/producers/consumers settle to 0.

Allowed:
- scoped backend cleanup fix;
- scoped client/harness cleanup await fix;
- extra non-secret health diagnostics for resource ownership if needed;
- rerun Direct + TURN harness cleanup on staging.

Forbidden:
- touching production;
- changing TURN network config again without evidence;
- enabling production/default SFU;
- removing LiveKit;
- broad refactors;
- unbounded cleanup loops/retries;
- storing secrets/IP values in docs.

Likely areas:
- successful consume path leaves producer/consumer/transport not associated with closed session;
- transport close endpoint may not close producers/consumers in all directions;
- room/session close may remove room state before child resources are closed;
- harness Stop/Reset may not await close calls after successful TURN consume;
- consumer close may not close producer-side resources, or vice versa.

Implementation guidance:
- make backend cleanup authoritative: closing participant/session/transport should close all owned consumers/producers/transports.
- cleanup should be idempotent.
- resource maps should not retain entries after close.
- health counters should reflect actual maps after cleanup.
- keep bounded waits only in smoke, not runtime loops.

Validation:
- Direct harness: pass.
- Direct cleanup: active resources 0.
- TURN harness: pass.
- TURN cleanup: active resources 0 after bounded convergence.
- Run second Stop/Reset to prove idempotency.
- No production changes.
- LiveKit fallback unchanged.

Verification:
- git diff --check
- bun.cmd x tsc --noEmit -p tsconfig.json
- bun.cmd run typecheck:api
- bun.cmd run build:api
- bun.cmd x next lint
- staging Direct + TURN harness rerun

Handoff:
- root cause;
- exact code/config/docs changed;
- before/after health counters;
- Direct/TURN/cleanup classification;
- remaining blockers;
- recommended next segment.
```

## Recommended Work Order

1. Document this pause and customer-priority plan.
2. Fix quick low-risk UX issues:
   - server settings `Save` label;
   - chat input autofocus;
   - multiline input behavior.
3. Implement unread message indicators with persisted read state.
4. Add notification sound and mute setting.
5. Implement mentions and `@all`.
6. Implement safe link rendering, then optional backend-owned link previews.
7. Restore staging storage readiness for avatars.
8. Improve media provider/fallback UI and screen-share fullscreen.
9. Run web checks, then desktop checks for shared UI changes.
10. Resume WebRTC cleanup only after customer-priority work stabilizes or moves to a separate dev stand.

## Low-Risk UX Fixes Result

Segment:
- `customer-priority-inventory-and-low-risk-ux-fixes`

Status: `pass / implemented`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_184_CUSTOMER_PRIORITY_LOW_RISK_UX_FIXES.md`

Delivered:
- server edit/settings submit label now says `Save`;
- server creation still says `Create`;
- main chat composer supports `Enter` to send and `Shift+Enter` to insert a newline;
- multiline message rendering preserves intentional newlines;
- after successful send from the composer, focus returns to the input unless the user moved focus or pointer interaction elsewhere during the pending send.

Verification:
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass;
- local unauthenticated dev smoke reached `/sign-in` successfully.

Not run:
- existing Playwright browser specs, because available specs are SFU/media tests and this segment forbids media/WebRTC work;
- authenticated manual smoke, because no local authenticated test workspace was available;
- packaged desktop build, because this slice changes shared Next UI and the safe desktop config check was the clear low-risk desktop command.

Next recommended segment:
- `customer-unread-message-badges-and-sound-plan`

Keep unread notifications and mentions as separate segments because they touch backend/realtime/data model and need more design than a label/input fix.
