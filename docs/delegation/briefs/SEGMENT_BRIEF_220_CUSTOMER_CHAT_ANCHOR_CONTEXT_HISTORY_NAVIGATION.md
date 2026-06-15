# Segment Brief: Customer Chat Anchor Context History Navigation

- Branch: `feature/customer-chat-anchor-context-history-navigation`
- Segment: `customer-chat-anchor-context-history-navigation`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Wave: `Wave 35 / CUSTOMER_PRIORITY_DELIVERY_PLAN`
- Stage: `Customer-priority product delivery`
- Priority: P1 reply/history UX follow-up after Segment 219

## Goal

Replace the Segment 219 reply-target context overlay with a proper anchor-based history navigation model.

When a user clicks a reply preview whose original message is outside the currently loaded range, the chat should move into a bounded history window around that target message instead of rendering a visual "island" between the latest messages and the old target.

The user should be able to continue loading history around that anchored window and return to the latest messages through an explicit "jump to latest" / "down" control.

## Product Decision

The current Segment 219 behavior is technically correct but visually transitional:

- it fetches a bounded context around an unloaded reply target;
- it renders that context as a chat-local overlay while preserving the normal latest-message infinite query;
- this can create a visible gap between the target context and the newer messages.

Do not try to solve this gap with spacing/CSS.

The agreed next model is anchor/windowed history navigation:

1. A loaded reply target keeps the fast local scroll/highlight path.
2. An unloaded reply target loads a bounded message window centered around the target.
3. That bounded window becomes the active visible history range instead of an overlay on top of the latest range.
4. The user can load older messages above the anchor window.
5. The user can load newer messages below the anchor window.
6. A visible "jump to latest" / "down" control returns to the latest message range.
7. New incoming messages while the user is away from the latest range should not force-scroll; they should be surfaced through the existing unread/new-message affordance or the new jump control.

This is intentionally closer to Discord/Telegram-like history navigation than to a one-off reply overlay.

## Scope

Implement a bounded anchor-context history mode for channel and direct chats.

Required:

- keep Segment 218 loaded-row reply preview scroll/highlight behavior;
- replace Segment 219 overlay rendering for unloaded targets with an active context/history range;
- support channel and direct reply target navigation;
- support soft-deleted target navigation to the deleted fallback row when accessible;
- support loading older messages from the anchored range;
- support loading newer messages from the anchored range;
- provide a visible "jump to latest" / "down" control when the user is not at the latest range;
- preserve existing read/unread semantics from Segments 203, 217, and later;
- preserve normal latest-chat behavior when the user enters a channel/DM normally;
- keep bounded API reads; do not load every message between a target and latest.

## Out of Scope

- full chat virtualization;
- replacing the whole chat stack with a new message-list library;
- URL deep links/permalinks;
- thread UI;
- reply visual redesign;
- reply attention logic changes;
- unread model rewrite;
- realtime transport rewrite;
- DB schema/migration unless a narrowly justified cursor/index change is required and documented first;
- broad cache refactor not needed for this slice.

## Virtualization Note

Virtualization is a possible future performance step, not the default next implementation.

Only consider virtualization after the anchor/windowed navigation model is correct, and only if real smoke or profiling shows that large loaded ranges cause DOM/performance problems.

If needed later, evaluate a dedicated segment such as:

- `customer-chat-message-list-virtualization-review`
- `customer-chat-message-list-virtualization-implementation`

The review should compare:

- current infinite-query chat stack;
- TanStack Virtual-style row virtualization;
- a specialized message-list library such as Virtuoso Message List;
- desktop runtime constraints;
- scroll anchoring, dynamic row heights, images/files, reply highlight, unread divider, and "jump to latest" behavior.

Do not add virtualization as an incidental dependency in this segment.

## Expected UX

Loaded target:

- click reply preview;
- scroll to the rendered target;
- briefly highlight target;
- no network context fetch required.

Unloaded target:

- click reply preview;
- fetch bounded context around the target;
- replace the visible range with that anchored context range;
- scroll/highlight the target;
- no visual "gap" between the context and unrelated latest messages.

While in anchored history:

- scroll up loads older messages adjacent to the current range;
- scroll down loads newer messages adjacent to the current range;
- new realtime messages do not force jump to latest;
- a "jump to latest" / "down" control lets the user return to the live bottom.

Deleted target:

- if accessible, the anchor window includes the soft-deleted row;
- click reply preview navigates/highlights the deleted fallback row.

Wrong chat / inaccessible target:

- backend rejects context request;
- UI does not scroll to an incorrect row;
- no sensitive data leaks across channel/conversation boundaries.

## Technical Direction

Start by reading:

- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/message-reply-preview.tsx`
- `src/lib/shared/data-access/chat/use-chat-socket.ts`
- `src/lib/shared/data-access/chat/chat-message-page-patch.ts`
- `packages/sdk/src/queries/chat.ts`
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/direct-messages/direct-messages.controller.ts`
- `apps/api/src/modules/direct-messages/direct-messages.service.ts`
- `docs/delegation/briefs/SEGMENT_BRIEF_219_CUSTOMER_REPLY_TARGET_CONTEXT_NAVIGATION.md`

Prefer an explicit local state model that distinguishes:

- normal latest mode;
- anchored context mode.

The anchored context mode should have enough cursor/page metadata to load both older and newer adjacent pages without confusing the normal latest infinite-query state.

If the existing context endpoints do not return enough cursor metadata, extend them narrowly and document the response shape. Keep membership and same-channel/conversation validation.

## Acceptance Criteria

Channel:

- loaded reply target still scrolls/highlights without regression;
- unloaded reply target opens an anchored context window with no unrelated latest/context visual gap;
- older messages can be loaded from the anchored window;
- newer messages can be loaded from the anchored window;
- soft-deleted target can be reached as a deleted fallback row;
- wrong-channel target is rejected server-side.

Direct:

- loaded and unloaded reply targets behave the same way in DM;
- wrong-conversation target is rejected server-side.

Jump to latest:

- visible when the user is away from the latest range;
- returns to the latest messages;
- does not destroy normal latest-mode read/unread behavior.

Regression:

- existing "load previous messages" in normal latest mode still works;
- message update/delete realtime patching still updates anchored rows and reply previews;
- reply attention/unread still works;
- mention chips and mention preview rendering still work;
- copy/edit/delete/file/link behavior is not broken.

## Manual Smoke

Run authenticated web smoke:

1. Channel loaded target:
   - reply to a visible loaded message;
   - click reply preview;
   - confirm scroll/highlight.
2. Channel unloaded target:
   - reply to an older message outside the first loaded page;
   - reload or return to latest range;
   - click reply preview;
   - confirm anchored window opens around target with no unrelated latest/context gap.
3. Anchor older/newer loading:
   - from the anchored window, scroll up and confirm older adjacent messages load;
   - scroll down and confirm newer adjacent messages load.
4. Jump to latest:
   - from anchored history, click the jump/down control;
   - confirm return to latest messages.
5. Deleted target:
   - reply to a message, delete the original, then click reply preview;
   - confirm deleted fallback row is reached/highlighted.
6. Direct messages:
   - repeat loaded/unloaded/jump-to-latest cases in DM.
7. Realtime:
   - while one user is in anchored history, have another user send a new message;
   - confirm no forced jump to latest and a clear way to return to latest.
8. Regression:
   - edit/delete/copy messages with reply previews;
   - check mention rendering in reply previews;
   - check file-only reply previews.

Desktop runtime:

- if this moves toward desktop release, run a packaged/electron spot check for anchor navigation, jump-to-latest, and dynamic height rows.

## Implementation Result

Delivered:
- Segment 219 context reads now expose explicit `olderCursor` and `newerCursor` metadata while preserving the existing normal latest `nextCursor` query behavior;
- `GET /api/messages/:messageId/context` and `GET /api/direct-messages/:directMessageId/context` accept optional `direction=older|newer` for bounded adjacent history reads from the current anchor window boundary;
- backend access checks and same channel/conversation validation remain authoritative for initial target context and adjacent cursor reads;
- loaded reply targets keep the Segment 218 local scroll/highlight fast path with no context request;
- unloaded reply targets replace the visible range with a target-centered anchored history window instead of rendering a separate overlay island beside latest messages;
- initial anchored context now uses the same bounded page size as normal chat history on each side of the target, reducing short "island" windows on desktop viewports without loading the whole gap to latest;
- anchored history can load older adjacent messages from the top and newer adjacent messages from the bottom without loading all history between target and latest;
- older-message loading now triggers near the top boundary instead of only at exact `scrollTop === 0`, and preserves viewport position after prepending older rows so manual/automatic pagination does not jump to the beginning of the newly loaded block;
- latest and anchored history ranges now auto-fill the viewport with bounded follow-up reads when the first visible range is too short for the current screen height;
- near-boundary preload uses a viewport-aware threshold, so users can scroll a little before the next older/newer page is needed instead of immediately hitting a manual page break;
- prepended older rows and first unloaded-target positioning use pre-paint scroll correction so users do not see an intermediate jumped layout frame while the DOM range changes;
- chat rows are rendered in natural chronological DOM order (`oldest -> newest`) instead of `flex-col-reverse`, so browser scroll anchoring and prepend compensation operate on the same visual direction as the user scrolls;
- programmatic loaded-target smooth scrolling temporarily suppresses boundary pagination so near-top preload does not add older rows in the middle of the scroll animation;
- the anchored range uses a history layout instead of the normal latest `mt-auto` bottom-stick layout, preventing reply-target windows from being pushed into large empty gaps;
- the sticky down control is visible whenever the user is away from the live bottom: normal loaded latest ranges return with native smooth for nearby distances and a short fake-smooth jump for far loaded distances, while anchored/window-switch returns use deterministic positioning;
- once an anchored range has loaded all newer messages and the user reaches the live bottom, the chat exits anchored mode and the down control disappears instead of staying stuck on screen;
- reply target navigation uses deterministic container-relative centering: already loaded targets use native smooth for nearby distances and a short fake-smooth jump for far loaded distances, while newly loaded context targets switch ranges and position instantly with highlight to avoid scroll-animation races;
- anchored history renders the same chat start/welcome state when older history reaches the beginning;
- automatic bottom scrolling and forced scroll-to-bottom events are disabled while anchored so target scroll/highlight cannot race the latest-mode auto-scroll timers;
- while anchored, normal latest read/near-bottom state is treated as not at latest so new messages do not force-scroll or get marked read as visible latest messages;
- anchored rows and their reply previews are patched by the existing realtime update/delete payload path;
- soft-deleted targets remain navigable as deleted fallback rows when backend access permits.

Kept out of scope:
- no virtualization or message-list library replacement;
- no reply block visual redesign;
- no reply attention/unread contract changes;
- no DB schema/migration;
- no auth/storage/media/WebRTC changes;
- no realtime transport hardening;
- no URL deep links/permalinks;
- no thread UI.

## Verification Commands

Run from repo root in PowerShell:

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

If Prisma schema changes are proposed, stop and explain why before applying migration work.

## Handoff Format

Do not commit automatically.

Return:

- branch and base commit;
- `git status --short --branch` proof that the branch is not incorrectly tracking `origin/core/reborn`;
- changed files;
- normal latest-mode behavior;
- anchored context-mode behavior;
- API/SDK response shape if changed;
- jump-to-latest behavior;
- deleted target behavior;
- wrong-chat rejection behavior;
- explicit confirmation that virtualization, reply visual redesign, reply attention, auth/storage/media, and broad realtime transport changes were not included;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`feat(customer): add anchored reply history navigation`
