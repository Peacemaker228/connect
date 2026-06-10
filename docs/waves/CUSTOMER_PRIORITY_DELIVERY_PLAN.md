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

## Unread Realtime Idempotency / Reconnect Fix Plan

Segment:
- `customer-unread-realtime-idempotency-reconnect-fix`

Status: `ready for implementation / blocker before global unread expansion`

Brief:
- `docs/delegation/briefs/SEGMENT_BRIEF_193_CUSTOMER_UNREAD_REALTIME_IDEMPOTENCY_RECONNECT_FIX.md`

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

Next recommended segment:
- `customer-unread-realtime-idempotency-reconnect-fix`
