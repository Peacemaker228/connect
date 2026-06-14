# Segment Brief 218: Customer Reply Navigation Loaded Range Polish

- Branch: `feature/customer-reply-navigation-loaded-range-polish`
- Segment: `customer-reply-navigation-loaded-range-polish`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Base: latest `origin/core/reborn`
- Priority: P1 reply UX polish after reply foundation, reply preview mention rendering, and reply attention

## Goal

Make compact reply previews useful for navigation inside the currently loaded chat range.

When a user clicks a reply preview on a sent message, the chat should scroll to the original message if that original message is already loaded in the current channel/DM view, and briefly highlight it.

This is a bounded Discord-like navigation polish slice. It is not history search, not loading around an arbitrary original message, and not a reply visual redesign.

## Product Decision

Use a conservative loaded-range behavior:

- click/tap a reply preview on a message row scrolls to the original message when that original is already rendered in the current chat list;
- the original message gets a short, subtle highlight/pulse so the user can find it;
- if the original is not loaded, do not fetch arbitrary history in this slice;
- deleted reply targets remain safe fallback and should not become misleading navigation controls;
- composer reply bar navigation is optional; prioritize sent message reply previews first;
- keep reply preview mention rendering from Segment 216;
- keep reply attention/unread behavior from Segment 217.

Future work can add:

1. loading around a reply original that is outside the loaded range;
2. URL hash/deep-linking to a message;
3. richer Telegram-like quote/navigation behavior.

## Current Context

- Segment 215 added durable reply relationships and compact reply previews.
- Segment 216 made mentions inside reply previews readable/highlighted.
- Segment 217 added reply attention/unread semantics.
- Current `ChatMessages` renders a reversed infinite list and already owns `chatRef` / `bottomRef`.
- Current `ChatItem` renders `MessageReplyPreviewBlock`.
- `MessageReplyPreviewBlock` is also used in the composer reply bar with a cancel button.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/for-brief.md`
- `rules/review/mini-review.md`

Docs:
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_215_CUSTOMER_REPLY_TO_MESSAGE_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_216_CUSTOMER_REPLY_PREVIEW_MENTION_RENDERING_POLISH.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_217_CUSTOMER_REPLY_ATTENTION_UNREAD_FOUNDATION.md`

## Inspect First

- `src/lib/chat/features/chat-messages.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/chat/features/message-reply-preview.tsx`
- `src/lib/shared/utils/hooks/use-chat-scroll.ts`
- `src/lib/chat/features/message-content.tsx`

## In Scope

1. Add loaded-range reply navigation:
   - clicking a sent message's reply preview scrolls to the original if it is currently rendered;
   - no navigation should occur across channels/conversations.
2. Add temporary target highlight:
   - subtle enough for the current dark UI;
   - time-bounded;
   - no layout shift.
3. Keep accessibility reasonable:
   - clickable preview should be keyboard reachable or use an appropriate button-like control;
   - add an accessible label/title if practical.
4. Preserve existing behavior:
   - reply preview mention rendering;
   - deleted/file-only preview fallbacks;
   - reply attention/unread;
   - edit/delete/copy actions;
   - normal message mention navigation;
   - active read-boundary and scroll behavior.
5. Update docs/status for Segment 218.

## Out Of Scope

- Loading history around an original message that is not currently rendered.
- URL message deep links.
- Cross-channel/cross-conversation navigation.
- Reply block visual redesign.
- Reply attention/badges/sound changes.
- Backend/API/SDK/DB/schema changes.
- Realtime event changes.
- Auth/session, storage, media/WebRTC changes.
- Staging/prod migration execution.

## Constraints

- Do not add a Prisma migration.
- Do not change `ChatMessageDto` / `MessageReplyPreviewDto`.
- Do not mutate unread/read-state behavior.
- Avoid global DOM querying if a local ref/map approach is practical; if DOM ids are used, keep them scoped and documented.
- Do not introduce nested interactive controls that break row action buttons.
- Prefer existing shared/shadcn/Radix primitives when they fit. If a custom button/container is used, document why.
- Shared UI changes must keep desktop config green.
- Do not commit automatically.
- Feature branch must be created from latest `origin/core/reborn` and must not track `origin/core/reborn`; verify with `git status --short --branch`.

## Expected Implementation Shape

Likely implementation:

- `ChatMessages` maintains a map of loaded message ids to row elements, or another local loaded-message lookup;
- `ChatItem` exposes/registers its row element by message id;
- `MessageReplyPreviewBlock` accepts an optional navigation handler/interactive mode for sent message previews;
- on click, `ChatMessages` scrolls the target row into view, e.g. `scrollIntoView({ block: 'center', behavior: 'smooth' })`;
- `ChatMessages` tracks a temporary highlighted message id and clears it after a short timeout;
- `ChatItem` applies a no-layout-shift highlight class when it is the temporary target.

If the original is not loaded:
- no crash;
- no bogus navigation;
- optionally record a small local no-op path, but do not add toast/noisy UI in this slice unless already available and low-risk.

## Acceptance Criteria

Channel:
- A sends message `original`.
- B replies to `original`.
- Clicking B's reply preview scrolls to A's loaded original.
- The original receives a short highlight and then returns to normal.
- If the original is deleted, the reply preview still shows deleted fallback and does not produce misleading navigation.
- If the original is outside the loaded range, click does not crash or navigate to the wrong message.

Direct:
- A sends DM `original`.
- B replies to it.
- Clicking the reply preview scrolls to the loaded original in the DM view.

Regression:
- reply preview `@user` / `@all` highlighting still works;
- reply attention unread still works;
- normal message mention chip navigation still works;
- edit/delete/copy row actions still work;
- file-only reply preview still renders attachment fallback;
- active read/scroll behavior is not broken.

## Manual Smoke

Run authenticated web smoke:

1. Channel: reply to a visible loaded message and click the reply preview.
2. Confirm smooth scroll and temporary highlight.
3. Reply to a message containing `@user` / `@all`; confirm preview mention rendering remains.
4. Delete the original; confirm deleted fallback remains safe.
5. Load enough history so an older original is not currently rendered, then click a reply preview targeting it if available; confirm no crash/wrong scroll.
6. Direct message: repeat visible loaded original navigation.
7. Confirm edit/delete/copy actions still work on messages with reply previews.

Desktop runtime:
- if this is heading to desktop release, do a packaged/electron runtime spot check for click target and scroll behavior after web smoke passes.

## Implementation Result

Delivered:
- `ChatMessages` keeps a local map of currently rendered message row elements by message id;
- sent message reply previews can call back into `ChatMessages` to navigate to the original reply target;
- when the target original is currently loaded/rendered in the same chat view, the row scrolls into view with smooth center positioning;
- the target row receives a short no-layout-shift inset ring/background highlight and then returns to normal;
- when the target original is not loaded/rendered, click is a quiet no-op with no history fetch, no wrong scroll, and no crash;
- deleted reply targets keep the existing deleted fallback and are not made navigable;
- composer reply bar keeps its existing cancel-only behavior and is not made navigable in this slice.

Kept out of scope:
- backend/API/SDK/DB/schema changes;
- realtime/unread/read-state changes;
- history loading around unloaded originals;
- URL/deep-link navigation;
- thread UI, reply block redesign, and reply attention changes.

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

No migration command is expected. If Prisma schema is touched, stop and explain why.

## Handoff Format

Do not commit automatically.

Return:
- branch and base commit;
- changed files;
- implementation summary;
- loaded-original behavior;
- not-loaded-original behavior;
- highlight behavior;
- explicit confirmation that backend/API/DB/realtime/unread were not changed;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`feat(customer): add loaded reply navigation`
