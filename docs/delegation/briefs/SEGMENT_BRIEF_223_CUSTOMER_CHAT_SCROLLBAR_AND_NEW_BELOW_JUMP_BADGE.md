# Segment 223: Customer Chat Scrollbar And New-Below Jump Badge

Status: implemented locally / command verification passed / targeted local smoke passed

Branch:
- `feature/customer-chat-initial-scroll-stability-fix`

## Goal

Improve chat/list scrolling polish without reopening the broader chat-history architecture:

- add a subtle shared scrollbar style for native chat scrolling and existing shared `ScrollArea` lists;
- show a compact count badge on the floating down/jump control when new incoming messages arrive below the current viewport;
- make the first jump click move to the beginning of the unseen new-message batch, while a second click still moves to the live bottom.

## Implementation Result

Changed:

- `src/app/globals.css`
- `packages/ui/src/components/scroll-area.tsx`
- `src/lib/chat/features/chat-messages.tsx`

Behavior:

- native chat scroll containers use the new `app-scrollbar` utility;
- shared Radix/shadcn `ScrollArea` scrollbars are thinner, quieter, and become clearer on hover;
- incoming messages are counted only when:
  - the chat has finished initial positioning;
  - the user is in latest-mode, not anchored-history mode;
  - the message is newer than the previously known latest message;
  - the message is from another member;
  - the user is not near the live bottom;
- older history prepends do not increment the badge;
- own messages do not increment the badge;
- badge text is capped at `99+`;
- badge color follows existing attention priority:
  - mention: amber;
  - reply: sky;
  - ordinary unread: rose;
- first click with unseen new messages scrolls to the first unseen new message and clears the badge;
- if the user is still away from live bottom, the down control remains visible and the next click moves to latest.

## Out Of Scope

- backend/API/SDK/DB/realtime contract changes;
- Notification API / native desktop badges;
- virtualization;
- reply navigation redesign;
- link previews;
- WebRTC/media work;
- staging/prod deployment.

## Verification

Command verification passed:

- `git diff --check`
- `bun.cmd x prisma validate`
- `bun.cmd x tsc --noEmit -p tsconfig.json`
- `bun.cmd run typecheck:api`
- `bun.cmd run build:api`
- `bun.cmd x next lint`
- `bun.cmd run build:web`
- `bun.cmd run check:desktop:config`

Targeted local browser smoke passed:

- opened a long-history channel on local production-like web/API;
- scrolled above live bottom until the down control appeared;
- sent incoming messages from a second authenticated user through the real backend API/realtime path;
- confirmed ordinary incoming message produced badge `1`;
- confirmed multiple incoming messages accumulated to `3`;
- confirmed `@alek` mention promoted the badge color to amber;
- confirmed old-history load/prepend did not create a badge;
- confirmed clicking the down control cleared the badge and reached live bottom in the tested short lower-batch case.

Remaining manual smoke:

- confirm the two-step first-new-then-latest behavior in a chat where the unseen lower batch is tall enough to keep the viewport away from bottom after the first click;
- check sidebar/server/channel/member list scrollbar appearance in light theme;
- repeat on staging before release.

## Notes

This segment is deliberately frontend-only. It uses already loaded chat messages and existing metadata (`mentions`, `replyTo`) to derive local jump-badge attention. It does not replace persisted unread state, server rail badges, or channel/member row badges.
