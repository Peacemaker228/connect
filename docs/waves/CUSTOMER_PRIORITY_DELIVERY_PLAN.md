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

Ordering decision:
- do not interrupt the current customer-priority feature work to build the new dev/preview stand immediately;
- first finish the current batch of colleague requirements that affect active staging usage;
- after that batch stabilizes, create a separate dev/preview stand before resuming risky WebRTC/media infrastructure work or broad experiments.

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

## Agent Handoff And Code Review Control

Agent handoff text is not sufficient proof by itself.

For every customer-priority code segment, the supervising agent must inspect the actual repository state before recommending merge, deploy, or operator action:

- read `git status --short --branch` and confirm whether the worktree is clean or which files are pending;
- inspect the real code diff with `git diff`, `git show`, or targeted file reads, not only the handoff summary;
- verify that changed files match the claimed scope and do not touch unrelated runtime, env, DB, media, migration, or production paths;
- call out mismatches between the handoff and the code, even if verification commands pass;
- run or require the relevant verification commands for the touched surface;
- for frontend/runtime changes, require a concrete smoke target or explicitly record why authenticated/manual smoke is still pending;
- for deploy advice, first confirm the target commit is present in the branch that will be deployed.

If this review is not performed, the result must be classified as `review / unverified handoff`, not `pass`.

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
- follow-up notification controls should support muting sound per channel and per direct conversation, so a noisy chat can stay visually unread without playing audio.

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
- a cache-only local update is not enough: other connected participants must see server name/settings changes without manual reload or unrelated refetch.

Required:
- for existing server edit/settings flow, the button label should be `Save` or equivalent;
- create flow should remain `Create` where it creates a new server.
- server edits should emit/update through the existing realtime/socket/event path.
- connected participants should reconcile server list/header/sidebar state from the event.

Acceptance:
- no behavior regression in server create/edit;
- label matches action.
- when user A edits a server name, user B sees the updated name without manual reload.
- local cache update and remote realtime update stay consistent.

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

### P1. Message Copy Action

Problem:
- users need to copy message content quickly.
- media/file messages must not copy broken values like `[object Object]`.

Required behavior:
- message UI exposes a copy action;
- text copy preserves the full message text, including multiline content;
- link messages copy usable text/URLs;
- image/file messages copy a useful representation.

Implementation direction:
- first implementation should reliably copy text plus attachment/file URLs;
- binary image copy should be attempted only if browser/desktop clipboard APIs and file access make it reliable;
- if binary image copy is not safe, fallback to copying the image/file URL rather than `[object Object]`;
- desktop clipboard behavior must be checked because the product is desktop-first.

Acceptance:
- copying a text message pastes the same text;
- copying a multiline message preserves line breaks;
- copying a message with image/file never pastes `[object Object]`;
- fallback behavior is predictable and useful.

### P1. Reply To Message

Problem:
- users need contextual replies like Discord or Telegram.

Required behavior:
- user can choose Reply on a channel or direct message;
- composer shows the replied-to message context;
- sending persists a message linked to the original message;
- rendered message shows a compact reply preview;
- clicking the reply preview should navigate or scroll to the original message where practical.

Implementation direction:
- this should be backend/schema/SDK/UI work, not UI-only state;
- support channel and direct messages if the data model allows it;
- reply target must be scoped to the same channel/conversation and permission-checked;
- deleted or inaccessible originals need a safe fallback label.

Acceptance:
- replies survive reload;
- replies render for other connected participants through realtime;
- unsupported edge cases are explicit, not silent failures.

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
3. Fix server edit realtime propagation so other connected participants see changes without manual reload.
4. Implement unread message indicators with persisted read state.
5. Add notification sound and mute setting.
6. Implement mentions and `@all`.
7. Implement safe link rendering, then optional backend-owned link previews.
8. Implement message copy action.
9. Implement reply-to-message.
10. Restore staging storage readiness for avatars.
11. Improve media provider/fallback UI and screen-share fullscreen.
12. Run web checks, then desktop checks for shared UI changes.
13. Create a separate dev/preview stand after the current colleague-requirements batch stabilizes.
14. Resume WebRTC cleanup only after customer-priority work stabilizes or moves to a separate dev stand.
15. Keep realtime transport hardening as a last-priority backlog item unless a concrete incident appears: staging currently shows `Socket.IO` traffic over `transport=polling` while websocket upgrade is advertised but not observed; future work should verify Nginx websocket upgrade and replace broad emit-by-key with authenticated rooms/subscriptions.

## Low-Risk UX Fixes Result

Segment:
- `customer-priority-inventory-and-low-risk-ux-fixes`

Status: `pass / implemented`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_184_CUSTOMER_PRIORITY_LOW_RISK_UX_FIXES.md`

Delivered:
- server edit/settings submit label now says `Save`;
- server creation still says `Create`;
- server edit success updates and invalidates the local React Query server caches so the changed name appears without a page reload;
- server edit realtime propagation to other connected participants is not covered by Segment 184 and remains the next follow-up before this server-edit item is fully complete;
- main chat composer supports `Enter` to send and `Shift+Enter` to insert a newline;
- main chat composer grows to roughly 20 visible lines, then scrolls internally with a thinner scrollbar;
- whitespace-only chat messages are rejected, leading/trailing blank lines are trimmed, and internal multiline content is preserved;
- backend channel/direct message create/update paths apply the same trim guard;
- multiline message rendering preserves intentional newlines;
- after successful send from the composer, focus returns to the input after the refreshed chat tree settles unless the user moved pointer interaction elsewhere during the pending send;
- after successful send, the chat query cache is updated immediately;
- when the current user sends a message, desktop and mobile chat views force-scroll to the new message even if the user was reading older messages higher in the list;
- ordinary new-message scroll still respects near-bottom state.

Local storage diagnostic:
- `.env.local` contains the expected S3-compatible storage settings and no shell-level `STORAGE_*` override was present;
- read-only `ListObjectsV2` with the local credentials passed;
- local upload failure remains `S3-compatible upload failed: Access Denied`, classified as Object Storage write authorization/bucket policy/KMS/object-lock configuration outside app code;
- no storage code, env values, bucket policy, staging, or production configuration was changed.

Verification:
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass;
- local S3 read-only diagnostic: pass for bucket list, blocked for app upload write by `AccessDenied`;
- local unauthenticated dev smoke reached `/sign-in` successfully.

Not run:
- existing Playwright browser specs, because available specs are SFU/media tests and this segment forbids media/WebRTC work;
- authenticated manual smoke, because no local authenticated test workspace was available;
- packaged desktop build, because this slice changes shared Next UI and the safe desktop config check was the clear low-risk desktop command.

Next recommended segment:
- `customer-unread-message-badges-and-sound-plan`

Keep unread notifications and mentions as separate segments because they touch backend/realtime/data model and need more design than a label/input fix.

## Server Edit Realtime Propagation Result

Segment:
- `customer-server-edit-realtime-propagation-fix`

Status: `pass / implemented`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_185_CUSTOMER_SERVER_EDIT_REALTIME_PROPAGATION_FIX.md`

Delivered:
- added shared/backend server update realtime event `server_updated`;
- event key is `server:${serverId}:profile`;
- payload carries `{ id, name, imageUrl }`;
- backend emits the event after successful `PATCH /api/servers/:serverId`;
- current server sidebar/header cache reconciles from the event;
- server list/sidebar cache reconciles from events for server ids already present in the accessible `['servers']` cache;
- repeated events update by server id and do not create duplicate list entries.

Verification:
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Not run:
- authenticated two-session local smoke, because no two authenticated local user sessions/workspace were available in this shell;
- existing Playwright specs, because available specs are SFU/media tests and this segment forbids media/WebRTC work;
- packaged desktop build.

Next recommended segment:
- `customer-unread-message-badges-and-sound-plan`

## Staging Storage Write Permission Diagnostic Result

Segment:
- `customer-staging-storage-write-permission-fix`

Status: `partial pass / storage write recovered externally; backend-redirect image display fixed locally`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_186_CUSTOMER_STAGING_STORAGE_WRITE_PERMISSION_FIX.md`

Delivered:
- confirmed the active app upload path remains backend-owned through `POST /api/storage/upload`;
- confirmed server avatars use `endpoint=serverImage`, folder `server-images`, and `PutObjectCommand`;
- confirmed message files use `endpoint=messageFile`, folder `message-files`, and `PutObjectCommand`;
- checked the real staging API runtime without printing values: `ax-connect-staging-api` is online but has no `STORAGE_*` variables in PM2 runtime;
- confirmed `/etc/ax-connect-staging/api.env` is readable but currently contains no storage env names;
- confirmed `yc` CLI is not installed/configured locally or on staging, so this shell cannot change Yandex Cloud IAM or bucket policy;
- reran a redacted local candidate credential diagnostic: `.env.local` storage shape is present, `ListObjectsV2` passes, app-like `PutObject` under `server-images/__diagnostics__` fails with `AccessDenied`, and no temp object was left behind;
- checked available bucket metadata with the same local candidate credentials without printing policy/ACL values: bucket policy and object-lock reads are denied, bucket encryption config is not present/readable as active, and bucket ACL metadata is readable.
- recorded the operator finding that accidental Yandex Cloud deletion caused the original write failure and local S3 writes recovered after deletion was cancelled;
- recorded staging browser evidence that `POST /api/storage/upload` now returns `200 OK` for `messageFile`;
- fixed uploaded storage images to render with `next/image` `unoptimized` when using backend-owned `/api/storage/access`, avoiding the failing `/_next/image?.../api/storage/access...` optimizer path;
- changed image attachment alt text so serialized `storage://v1?...` values are not shown as broken-image fallback text.

Required operator fix:
- deploy the local image display fix to staging;
- confirm the chat attachment no longer requests `/_next/image` for backend-redirect storage images;
- confirm the browser requests `/api/storage/access` directly and renders the uploaded image inline;
- keep public write disabled and keep production storage untouched.

Verification:
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- staging upload: pass by operator/browser report for `messageFile`;
- staging inline image display after local fix: pending deploy/browser confirmation.

Not touched:
- production storage/env/data;
- storage architecture/provider;
- DB schema or migrations;
- unread notifications, mentions, media, WebRTC, coturn, mediasoup, or LiveKit.

Next recommended segment:
- `customer-staging-storage-display-deploy-and-smoke`

Return to `customer-unread-message-badges-and-sound-plan` only after staging upload and inline display are green.

## Storage Link CORS Prefetch Follow-up

Segment:
- `customer-storage-link-cors-prefetch-fix`

Status: `pass / local code fix`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_188_CUSTOMER_STORAGE_LINK_CORS_PREFETCH_FIX.md`

Delivered:
- fixed production/staging console noise where storage file links triggered browser fetch/prefetch-style requests that followed `/api/storage/access` redirects to Yandex Object Storage and received `OPTIONS 403`;
- replaced `next/link` with plain `<a>` for chat image attachment links, chat PDF links, and upload-preview PDF links;
- kept `next/image unoptimized` for backend-redirect storage images;
- did not change storage upload API, provider, bucket policy, CORS settings, env values, DB, media, or production infra.

Staging smoke after deploy:
- open a chat with storage image/PDF attachments;
- confirm image display still works;
- confirm clicking image/PDF opens the file in a new tab;
- confirm Network no longer shows storage-link prefetch `OPTIONS 403` to Yandex for those assets.

## Unread Message Badges Foundation Result

Segment:
- `customer-unread-message-badges-foundation`

Status: `pass / implemented locally; manual two-user smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_189_CUSTOMER_UNREAD_MESSAGE_BADGES_FOUNDATION.md`

Delivered:
- added additive persisted read-state models for channels and direct conversations;
- added a migration that creates read-state tables, indexes unread count paths, and baselines existing chats at migration time so historical messages do not become unread on first deploy;
- added backend unread summary endpoint for accessible server channels and visible direct conversations;
- added idempotent mark-read endpoints for channels and direct conversations;
- preserved existing active chat realtime events;
- added unread realtime events: `server:${serverId}:unread` for channel unread and `member:${memberId}:direct-unread` for recipient-only direct unread;
- updated sidebar client cache from unread realtime events while ignoring own messages and active chat messages;
- fixed direct-message access by requiring conversation membership before returning `GET /api/direct-messages` history;
- active incoming realtime messages also mark the current channel/conversation read so reload does not bring back badges for messages already seen in the open chat;
- added compact red count badges for channel and direct/member list entries;
- opening a channel or direct conversation marks that scope read;
- API/client shapes include `mentionCount`, `replyCount`, and `attentionLevel` so future mention/reply attention can plug in without pretending normal unread is a direct mention.

Verification:
- `bun.cmd x prisma generate`: pass;
- `bun.cmd x prisma validate`: pass;
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Pending:
- authenticated two-user browser smoke.

Not included:
- notification sound / mute setting;

## Prisma Active Postgres Migration Chain Repair Result

Segment:
- `customer-prisma-active-postgres-migration-chain-repair`

Status: `pass / implemented locally; staging operator action pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_191_CUSTOMER_PRISMA_ACTIVE_POSTGRES_MIGRATION_CHAIN_REPAIR.md`

Delivered:
- confirmed active Prisma datasource is PostgreSQL;
- confirmed active local DB points to `localhost:5433/connect_validation`, not staging/prod;
- confirmed local `_prisma_migrations` was missing before repair and the invalid MySQL cleanup migration was not applied locally;
- added active clean PostgreSQL baseline `00000000000000_clean_baseline` from the existing `prisma/postgres-validation` baseline;
- retired the invalid active MySQL-only migration `20260501120000_remove_clerk_identity_provider`;
- kept unread migration after the baseline;
- verified an existing local pre-unread DB through `migrate resolve --applied 00000000000000_clean_baseline` followed by `prisma migrate dev`;
- verified a fresh temporary local Postgres DB can apply baseline plus unread through `prisma migrate deploy`;
- verified local migration-backed unread behavior with disposable rows: channel unread recipient/sender counts, direct unread recipient/sender counts, mark-read clearing, and own-message negative cases;
- verified the disposable local smoke rows were cleaned up after the run;
- documented safe existing-DB handling: baseline resolve, then `migrate deploy`, without reset.

Verification:
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x prisma migrate dev`: pass after local baseline resolve;
- fresh temporary local Postgres `bun.cmd x prisma migrate deploy`: pass;
- `bun.cmd x prisma migrate status`: pass / up to date locally;
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass.
- local disposable unread DB/business smoke: pass.

Pending:
- staging operator should inspect `_prisma_migrations`;
- if staging has the pre-unread schema without migration history, run `prisma migrate resolve --applied 00000000000000_clean_baseline`, then `prisma migrate deploy`;
- authenticated two-user unread smoke after staging/local migration application.
- mentions and `@all`;
- reply attention;
- raw text mention/reply detection;
- WebRTC/media changes;
- production Postgres migration or staging DB reset.

## Unread Notification System Plan

Segment:
- `customer-unread-notification-system-plan`

Status: `pass / planned`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_192_CUSTOMER_UNREAD_NOTIFICATION_SYSTEM_PLAN.md`

Decision:
- continue from persisted normal unread counts into a layered notification system instead of implementing isolated badge/sound/mention behavior;
- keep normal unread separate from direct attention signals such as `@user`, `@all`, and replies;
- keep Socket.IO as the realtime transport for this track;
- verify desktop behavior explicitly when a segment touches browser/desktop notification surfaces.

Planned order:
1. `customer-global-unread-summary-and-server-badges`
   - backend global unread summary across accessible servers;
   - server-list badges when unread arrives on another server;
   - channel/direct row emphasis plus count badges.
2. `customer-new-message-divider`
   - `New` / `Новое` divider in the chat at the first unread message;
   - preserve the pre-open read anchor before mark-read clears unread.
3. `customer-notification-sound-browser-desktop-badges`
   - browser title unread count and optional favicon marker;
   - sound plus mute preference;
   - desktop native notification/app badge verification.
4. `customer-mentions-replies-attention`
   - `@user`, `@all`, and reply attention as stronger metadata-backed signals.

Next recommended segment:
- `customer-global-unread-summary-and-server-badges`

Then continue to:
- `customer-new-message-divider`
- `customer-notification-sound-browser-desktop-badges`
- `customer-mentions-replies-attention`

## Global Unread Summary And Server Badges Result

Segment:
- `customer-global-unread-summary-and-server-badges`

Status: `pass / implemented locally; manual two-user smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_195_CUSTOMER_GLOBAL_UNREAD_SUMMARY_AND_SERVER_BADGES.md`

Delivered:
- added backend global unread endpoint `GET /api/unread/servers/summary`;
- global summary returns per-server normal unread totals and current member id per server;
- kept existing per-server channel/direct detail endpoint unchanged;
- added SDK global unread query and global unread query key;
- successful channel/direct mark-read invalidates the global unread summary;
- server rail subscribes to all accessible server unread keys and all current member direct-unread keys from global summary;
- server rail shows compact red count badges for servers with unread;
- global unread cache reconciles after unread events, duplicates, socket connect/reconnect, focus, and visibility return;
- channel/member rows get stronger unread text emphasis while keeping numeric badges;
- did not add sound, browser tab badge, desktop notifications, `New` divider, mentions, replies, storage, WebRTC, or migrations.

Verification:
- `git diff --check`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user / two-server local smoke; not run in this shell because no ready authenticated two-user local sessions were available.

Review follow-ups:
- global unread summary currently uses per-server/per-channel/per-conversation count queries; acceptable for the current customer slice, but should be monitored and optimized before larger-scale server/channel usage;
- global `attentionLevel` is normal-unread only until mention/reply/`@all` metadata exists;
- do not claim deploy/product pass until a two-user / two-server manual smoke confirms inactive-server badge behavior, clear-on-open, reload restore, and no duplicate increment regression.

## Unread Tab Badge And New Divider Result

Segment:
- `customer-unread-tab-badge-new-divider`

Status: `pass / implemented locally; manual two-user smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_196_CUSTOMER_UNREAD_TAB_BADGE_AND_NEW_DIVIDER.md`

Delivered:
- extended server-scoped unread summary channel/direct items with `lastReadAt` as the backend-owned read anchor;
- mark-read responses now return the written `lastReadAt`;
- chat captures the unread anchor before the existing mark-read flow clears unread;
- chat renders `Новое` above the earliest loaded unread message after the captured anchor for channels and direct conversations;
- divider placement ignores own and deleted messages;
- browser tab title uses global unread `totalUnreadCount`, renders `(N)` / `(99+)`, and restores the normal title at zero;
- kept global/server/channel/direct badge behavior on the existing unread query and realtime reconciliation path;
- did not add sound, Notification API, favicon/native badges, mentions, replies, storage, WebRTC, or migrations.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user local smoke; not run in this shell because no ready authenticated two-user local sessions were available.

Known limitation:
- if the real first unread message is outside the currently loaded pagination window, the divider is placed above the first unread message available in the loaded range; the client does not fetch full history for this segment.

## Idle Profile/Reconnection Sidebar State Incident

Segment:
- `customer-idle-profile-reconnect-sidebar-state-fix`

Status: `implemented locally / see result below`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_197_CUSTOMER_IDLE_PROFILE_RECONNECT_SIDEBAR_STATE_FIX.md`

Observed staging incident:
- after several hours idle with two authenticated browser windows open, the account area temporarily showed fallback `AX` / missing user identity;
- the current user temporarily appeared in the member list;
- server rail unread badges incremented, but channel/member row badges did not update until a later blink/refetch;
- after the UI recovered, profile/user identity and row unread indicators appeared again.

Working diagnosis:
- this points to client auth/profile readiness after idle/reconnect, not to a staging DB migration failure;
- `ServerSidebar` currently derives member filtering and `currentMember` from `useGetProfile`;
- while `profile` is missing, self is not filtered out and `useUnreadSocket` cannot subscribe with `currentMemberId`;
- global unread/server rail can still update separately, which matches the observed split behavior.

Decision:
- do not continue to sound/native notifications until this core profile/current-member recovery issue is fixed or disproven;
- fix the authenticated shell so it does not render misleading member/user state while profile is loading or recovering;
- preserve staging data and avoid unrelated auth rewrites, DB migrations, storage work, media/WebRTC work, and production changes.

## Idle Profile/Reconnection Sidebar State Result

Segment:
- `customer-idle-profile-reconnect-sidebar-state-fix`

Status: `pass / implemented locally; manual idle smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_197_CUSTOMER_IDLE_PROFILE_RECONNECT_SIDEBAR_STATE_FIX.md`

Root cause:
- `/api/auth/session` can return an anonymous `200` snapshot with `profile: null` when an expired access cookie is still present, so the SDK refresh-on-401 path does not run;
- `useGetProfile` could cache that missing profile until a later refetch;
- `ServerSidebar` rendered normal member/account UI from missing profile state, which let self appear in the member list and left server-scoped unread without `currentMemberId`.

Delivered:
- shared SDK auth refresh promise is now exposed through `refreshBackendSession()` and reused by the 401 interceptor plus manual/session recovery paths;
- `useGetProfile` now attempts one refresh when the session snapshot has no profile and refetches on focus/reconnect;
- `ServerSidebar` gates normal rendering until both profile and current member are ready, then invalidates server-scoped unread summary on current-member recovery;
- `BackendUserMenu` no longer shows `AX` / `Account` from wholly missing profile props while account state is loading/recovering;
- global unread/server rail behavior, unread realtime contracts, backend auth/session code, DB, storage, media/WebRTC, and production/staging infra were not changed.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user idle/reconnect smoke; not run in this shell because no ready authenticated two-user local/staging sessions were available.

## Unread Sound And Mute Settings Result

Segment:
- `customer-unread-sound-and-mute-settings`

Status: `pass / implemented locally; manual two-user smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_198_CUSTOMER_UNREAD_SOUND_AND_MUTE_SETTINGS.md`

Delivered:
- added a short local MP3 unread notification sound as a client-side effect of accepted realtime unread events;
- sound is triggered from the global unread socket path only after own-message, active-chat, access/current-member, and duplicate-event guards pass;
- reload summary, initial unread summary load, focus/reconnect refetch, and historical unread counts do not trigger sound;
- added bounded message-id sound dedupe so duplicate/replayed realtime events do not play twice;
- added local `Notification sound` checkbox to the account dropdown;
- stored the preference in `localStorage` under `ax-connect:unread-notification-sound-enabled`, with a future path to backend profile preference;
- kept unread badges, global summary reconciliation, title count, and `Новое` divider behavior on the existing unread system;
- did not add Notification API, native desktop popups, taskbar/app badge, mentions, replies, storage, WebRTC/media, DB schema, or migrations.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user local smoke; not run in this shell because no ready authenticated two-user local sessions were available.

Follow-up requirement:
- per-channel and per-direct-conversation sound mute controls are covered by `customer-unread-per-chat-sound-mute-controls`.

## Unread Per-Chat Sound Mute Controls Result

Segment:
- `customer-unread-per-chat-sound-mute-controls`

Status: `pass / implemented locally; manual two-user smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_199_CUSTOMER_UNREAD_PER_CHAT_SOUND_MUTE_CONTROLS.md`

Delivered:
- added local per-channel and per-direct-conversation sound mute state without changing unread badges, counts, row emphasis, server rail badges, title count, or `New` divider behavior;
- stored muted scopes in `localStorage` under `ax-connect:unread-notification-muted-scopes` as a JSON string array;
- used stable scope keys: `channel:${serverId}:${channelId}` and `conversation:${serverId}:${memberId}`;
- resolved direct mute scopes from accepted direct unread payloads with `senderMemberId`, matching the recipient-side member row;
- blocked sound when global sound is disabled or the specific scope is muted, while still accepting realtime unread cache updates and visual indicators;
- kept bounded message-id sound dedupe active even for muted events so replays do not sound later after unmute;
- added compact hover/focus speaker controls to channel and direct member rows, with muted rows keeping the muted icon visible;
- did not add backend notification preference persistence, DB schema/migrations, server-wide mute, Notification API, native desktop popups, taskbar/app badge, storage, WebRTC/media, or staging/prod changes.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user local smoke.

## Auth Session Idle Boundary Hardening Result

Segment:
- `customer-auth-session-idle-boundary-hardening`

Status: `pass / implemented locally; manual idle smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_200_CUSTOMER_AUTH_SESSION_IDLE_BOUNDARY_HARDENING.md`

Root cause:
- after access-token cookie expiry, backend auth context swallowed the expired-cookie `UnauthorizedException` and could fall through to anonymous context;
- `GET /api/auth/session` then returned `200` with `profile: null` instead of using the still-valid refresh cookie;
- SDK refresh-on-401 did not deterministically run because the session read was not a `401`;
- Segment 197 client gating prevented misleading shell rendering, but the backend session read still needed deterministic cookie recovery.

Delivered:
- `GET /api/auth/session` now uses a backend service path that returns the current authenticated snapshot when access auth is valid;
- when access auth is anonymous but a refresh cookie exists, the same session read calls existing `AuthService.refreshSession()`, rotates cookies through `AuthCookiesService`, and returns the refreshed authenticated session snapshot;
- if refresh-cookie recovery fails with `UnauthorizedException`, the response returns an explicit anonymous session snapshot without clearing cookies, avoiding cross-tab refresh-token rotation races where a late failed response could erase a session already recovered by another tab;
- `/api/auth/session/refresh` and SDK refresh-on-401 behavior remain unchanged;
- client profile/current-member shell gating remains unchanged, and current-member recovery now invalidates server-scoped unread, global unread, current server, and server list caches;
- unread realtime event contracts, direct unread privacy key, active chat mark-read, own-message negative behavior, DB schema, storage, media/WebRTC, and staging/prod infra are unchanged.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.
- focused auth/session endpoint smoke against changed code was not completed because this shell has no safe local `DATABASE_URL` in process env; a temporary API with `AUTH_ACCESS_TOKEN_TTL_SECONDS=1` failed before listening, and the already-running local API was not used as proof because it likely predated this code change.

Manual smoke:
- pending two-user idle/reconnect smoke with valid refresh cookie;
- pending truly expired refresh-session smoke.

## Unread Notification Pipeline Reliability Result

Segment:
- `customer-unread-notification-pipeline-reliability`

Status: `pass / implemented locally; manual notification smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_201_CUSTOMER_UNREAD_NOTIFICATION_PIPELINE_RELIABILITY.md`

Root cause / narrowed diagnosis:
- unread sound decisions were coupled to route-active checks instead of actual page visibility/focus;
- an open active chat suppressed global unread/sound and could mark incoming events read even when the tab/window was hidden, minimized, or unfocused;
- audio playback failures were intentionally silent, so browser policy failure, mute, dedupe, and route suppression were not easy to distinguish.

Delivered:
- active chat is considered visibly seen only when `document.visibilityState === 'visible'` and `document.hasFocus()` is true;
- visible/focused active chat still suppresses sound and mark-reads through the existing unread read endpoints;
- hidden/minimized/unfocused active chat remains eligible for unread/title/server badge and sound unless globally or per-chat muted;
- global/per-chat mute still blocks only sound while visual unread remains;
- sound playback now reports `played`, `failed`, `deduped`, `disabled`, or `not_available`;
- optional non-secret diagnostics can be enabled with `localStorage.setItem('ax-connect:debug-unread-notifications', '1')`, and recent entries are available through `window.__axUnreadNotificationDebug.getEntries()`;
- unread realtime contracts, backend/API, DB, storage, auth/session, media/WebRTC, and staging/prod infra are unchanged.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user browser smoke for channel/DM visible-active, hidden-active, muted, duplicate, reload/focus, and debug reason-code cases.

## Chat Composer Screenshot Paste And Focus Result

Segment:
- `customer-chat-composer-screenshot-paste-and-focus-stability`

Status: `pass / implemented locally; manual web smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_202_CUSTOMER_CHAT_COMPOSER_SCREENSHOT_PASTE_FOCUS.md`

Delivered:
- chat composer paste now detects clipboard image files and wraps them in timestamped screenshot-style `File` objects;
- pasted images open the existing `messageFile` attachment confirmation modal instead of auto-sending;
- pasted and normally selected message files both upload through the same backend-owned staged storage path, `uploadStorageFile('messageFile', file)`;
- attachment `Send` is disabled while a pasted/preselected file is still uploading;
- cancel/remove keeps staged upload cleanup through `useStagedUpload`, and late upload completion after modal close is cleaned when the client still owns that staged value;
- successful attachment send still creates the message through the existing SDK message mutation and backend finalization path;
- composer focus now runs on safe channel/DM entry and after successful text or attachment send, while avoiding focus while a modal is open or another focusable control owns focus;
- plain text paste, plus-button file upload, `Enter` send, `Shift+Enter` newline, unread behavior, auth/session, storage provider config, DB schema, media/WebRTC, staging DB, and production infra are unchanged.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending authenticated web smoke for channel screenshot paste, DM screenshot paste, cancel cleanup, plain text paste, plus-button upload, Enter/Shift+Enter, and focus stability;
- packaged desktop runtime smoke was not run; desktop remains `review`, not pass, with only config verification completed.

Known limitation:
- mixed text+image clipboard payloads are handled as image paste; the text part is not inserted into the composer.

## Unread Active Visible Read Semantics Fix Result

Segment:
- `customer-unread-active-visible-read-semantics-fix`

Status: `pass / implemented locally; manual smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_203_CUSTOMER_UNREAD_ACTIVE_VISIBLE_READ_SEMANTICS_FIX.md`

Root cause:
- Segment 201 correctly made hidden/minimized active chats unread/sound eligible, but it also used `document.hasFocus()` as part of the read gate;
- a visible active chat could therefore stay unread until a click/focus event even when the user was already at the bottom and looking at the chat;
- the active row badge was hidden by route equality, which could mask unread that should remain visible while the user is scrolled up.

Delivered:
- read/seen semantics are now based on active route, `document.visibilityState === 'visible'`, and the chat near-bottom state rather than `document.hasFocus()`;
- active visible near-bottom channel/DM events auto mark-read and suppress server rail unread, row unread, and sound;
- active visible scrolled-up channel/DM events keep visual unread and `New` state without playing sound or force-scrolling;
- active hidden/minimized events remain visual-unread and sound eligible unless globally or per-chat muted;
- server sidebar hides active channel/member row badges only when the active chat is at the read boundary;
- global/scoped unread caches still reconcile from backend summaries after events, connect/reconnect, focus, and visibility return;
- direct unread remains private on `member:${memberId}:direct-unread`;
- unread backend/API contracts, DB schema, auth/session, storage, media/WebRTC, and staging/prod infra are unchanged.

Verification:
- `git diff --check`: pass;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.

Manual smoke:
- pending two-user browser smoke for active visible channel/DM near-bottom, active visible scrolled-up, hidden/minimized active chat, different channel, different server, muted channel/DM, reload/reconnect, and desktop runtime review.

## Mentions Attention Foundation Plan

Segment:
- `customer-mentions-attention-foundation`

Status: `implemented locally / command verification passed; manual smoke pending`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`

Delivered:
- channel messages now persist normalized mention targets in additive `messagemention` rows with `USER` / `ALL` kind;
- backend message creation/update resolves stable `<@memberId>` / `<@all>` tokens and current raw `@DisplayName` / `@all` text against server members, allows explicit self-mentions and `@all` self-target rows for rendering/highlight, and skips ambiguous duplicate display names;
- chat message DTOs include mention metadata, and message text renders mention chips while plain text and attachments keep the existing path;
- raw `@name` / `@all` tokens render as fallback chips only if a client temporarily lacks the `mentions` metadata field, and target members get a subtle whole-message highlight when backend mention metadata includes their member id;
- server-scoped and global unread summaries count mention rows per recipient member and return `attentionLevel: 'mention'` independently of normal unread count;
- channel unread realtime events include `mentionedMemberIds`, so each client promotes only its own events to mention attention while other recipients keep normal unread;
- server rail and channel/member row badges use summary/realtime `attentionLevel` for stronger mention styling without changing active visible read semantics from Segment 203;
- direct unread remains private on `member:${memberId}:direct-unread`;
- reply-to-message, reply attention, autocomplete/picker UX, link rendering, message copy, Notification API, native desktop popups, storage/auth/media, and broad realtime transport hardening remain out of scope.

Verification:
- `git diff --check`: pass, with existing CRLF conversion warnings only;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x prisma generate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass;
- `bun.cmd x prisma migrate deploy`: pass on local `connect_validation`, applying only `20260611130000_add_message_mentions`;
- post-deploy `bun.cmd x prisma migrate status`: pass, local `connect_validation` schema up to date.

Manual smoke:
- initial smoke stopped on mention rendering/attention findings: inconsistent chips across clients, unproven `@all`, missing stable-token note, and missing target-user whole-message highlight;
- pending repeat two/three-user channel smoke for plain unread, `@user`, explicit self-mention rendering/highlight, `@all` including sender rendering/highlight, sender own-message unread/sound negative case, non-target normal unread, active-visible auto-read, read clearing, reload restore, hidden/scrolled-up behavior, muted channel visual attention, and desktop runtime review.

Watch item:
- if a self-mention such as `@alek` shows yellow mention badges for other users only after idle/reconnect and disappears after browser refresh, treat it as a realtime/cache reconciliation suspect first; verify backend unread summaries before changing mention parsing semantics;
- future architecture should split mention rendering entities from notification/attention recipients, while keeping current own-message unread/sound suppression as a hard invariant.

Next split after this:
- mention autocomplete/picker UX if it does not fit safely inside the foundation slice;
- reply-to-message as a separate backend/schema/SDK/UI segment;
- safe link rendering and message copy as separate segments.

## Unread Realtime Idempotency / Reconnect Fix Plan

Segment:
- `customer-unread-realtime-idempotency-reconnect-fix`

Status: `pass-with-review / implemented locally; local duplicate smoke passed, first-event-after-idle watch item recorded`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_193_CUSTOMER_UNREAD_REALTIME_IDEMPOTENCY_RECONNECT_FIX.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_194_CUSTOMER_UNREAD_REALTIME_IDEMPOTENCY_RECONNECT_FIX.md`

Observed local issue:
- two-browser local testing can drift after idle/reconnect;
- one unread direction can stop updating until reload;
- one incoming message can sometimes increment unread as if two events were processed;
- full page reload restores correct state, which points to client realtime/cache drift rather than a migration/read-state DB failure.

Decision:
- do not expand unread into global server badges, browser tab indicators, sounds, or desktop notifications until the current per-server/direct unread realtime path is idempotent and reconnect-safe.

Expected fix direction:
- dedupe unread realtime events by `messageId`;
- refetch/invalidate unread summary after Socket.IO reconnect/connect recovery;
- refetch/invalidate unread summary after browser focus following idle;
- keep backend unread summary as source of truth;
- keep optimistic cache increment only as a fast path;
- preserve private direct unread on `member:${memberId}:direct-unread`;
- preserve active-chat mark-read and sender/own-message negative behavior.

Delivered:
- added bounded module-level dedupe for unread realtime events using current member id, server id, event scope, and `messageId`;
- duplicate unread events no longer increment the same browser-session unread cache twice;
- added targeted unread summary reconciliation after processed/duplicate realtime events;
- added targeted unread summary reconciliation on socket `connect`, Socket.IO manager `reconnect`, browser `focus`, and `visibilitychange` back to visible;
- kept active chat mark-read behavior;
- kept own-message negative behavior;
- kept direct unread private on `member:${memberId}:direct-unread`;
- did not add global unread, server badges, sound, browser tab badges, desktop notifications, mentions, replies, migrations, storage, or WebRTC changes.

Manual review:
- local two-browser duplicate unread increments were no longer reproduced;
- reload/focus reconciliation restored correct backend summary state;
- one first-event-after-idle/local-dev observation did not show immediately, then reconciled and later events worked normally;
- keep this as a watch item for staging/production rather than blocking this scoped fix forever.

Next recommended segment:
- `customer-global-unread-summary-and-server-badges`, with first-event-after-idle monitored as a known review item
