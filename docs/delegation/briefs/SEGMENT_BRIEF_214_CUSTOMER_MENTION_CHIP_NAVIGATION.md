# Segment Brief 214: Customer Mention Chip Navigation

- Branch: `feature/customer-mention-chip-navigation`
- Segment: `customer-mention-chip-navigation`
- Status: `implemented locally / command verification passed; manual smoke pending`
- Base: latest `origin/core/reborn`
- Priority: P1 customer-product polish after generic file attachment copy and before reply-to-message

## Goal

Make metadata-backed single-user mention chips clickable so users can jump to the mentioned member's existing direct conversation/profile entry point from a channel message.

In the current app shape, the expected target is the existing direct conversation route:

`/servers/:serverId/conversations/:memberId`

Group mentions such as `@all` must remain non-navigating.

## Current Context

- Segment 204 added metadata-backed channel mentions and mention chips.
- Segment 205 added the channel composer mention picker.
- Segment 207/208 made edit mode render mentions readably and added edit-mode mention picker.
- Segment 206 copy action already copies mentions as readable `@name` / `@all`.
- Current `MessageContent` renders mention chips as non-interactive spans.
- Existing app navigation already uses member ids for direct conversations in:
  - `src/lib/server-list/features/server-member.tsx`
  - `src/lib/chat/features/chat-item.tsx` author avatar/name click
  - `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- The conversation page redirects away from self conversations. Do not create a broken self-navigation path.

## Required Reading

Rules:
- `rules/rules.md`
- `rules/task.md`
- `rules/sdk-client-access.md`
- `rules/architecture-docs.md`
- `rules/review/mini-review.md`

Docs:
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_207_CUSTOMER_MESSAGE_EDIT_MODE_CORRECTNESS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_208_CUSTOMER_MESSAGE_EDIT_MENTION_PICKER.md`

## Inspect First

- `src/lib/chat/features/message-content.tsx`
- `src/lib/chat/features/message-mention-text.ts`
- `src/lib/chat/features/chat-item.tsx`
- `src/lib/server-list/features/server-member.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `packages/app-core/src/contracts/domain.ts`

## In Scope

1. Identify the current mention render token shape and extend it only as much as needed to carry safe navigation metadata for metadata-backed single-user mentions.
2. Render metadata-backed single-user mention chips as accessible interactive controls or links.
3. Navigate to the mentioned member's direct conversation route using the current `serverId` and mention `memberId`.
4. Keep `@all` visually distinct but non-clickable.
5. Do not make raw fallback mentions navigable unless there is reliable metadata for the target member.
6. Avoid broken self-navigation:
   - if the mentioned member is the current member and the existing app does not support a self profile route, keep that chip non-navigating for this slice;
   - document the behavior in the segment handoff.
7. Preserve existing mention rendering, target-user highlight, unread/attention behavior, copy action behavior, edit mode behavior, and link rendering.
8. Use existing routing patterns and shared UI primitives where appropriate. Prefer existing shared/shadcn/Radix primitives when they fit the control; if a native element is clearer, document why.

## Out Of Scope

- Reply-to-message.
- Link previews/unfurl.
- Mention parser changes.
- Mention autocomplete changes.
- Mention attention/unread semantics changes.
- New profile page or profile modal.
- `@all` permission model.
- Backend/API/SDK contract changes unless inspection proves current DTO data is insufficient.
- DB schema/migrations.
- Auth/session, storage/S3, media/WebRTC, staging/prod infra.
- Realtime transport hardening.

If current DTOs do not provide enough data for safe navigation, stop and report the exact missing field instead of inventing a broader backend change.

## Expected Implementation Shape

- Prefer keeping `MessageContent` presentational but allow it to receive the minimal routing context it needs, such as `serverId` and current member id, or a callback like `onMentionClick(memberId)`.
- Keep the actual route construction aligned with existing `ERoutes.SERVERS` / `ERoutes.CONVERSATIONS` usage.
- Prevent nested interactive issues:
  - mention links/buttons must not interfere with message row action hover controls;
  - keyboard activation should work;
  - focus style should be visible enough in both dark and light themes.
- If using a button, set `type="button"`.
- If using a link, use the existing app routing pattern and avoid opening a new tab.

## Acceptance Criteria

- A message containing a metadata-backed single-user `@user` mention renders as a clickable chip for all viewers.
- Clicking another member's mention chip opens/navigates to the existing direct conversation with that member.
- Keyboard activation works for the clickable chip.
- `@all` remains non-clickable.
- Self mention does not navigate to a broken self-conversation route.
- Raw fallback mentions without metadata do not become unreliable links.
- Mention chips still render as readable `@name` / `@all`.
- Mention target-user whole-message highlight remains unchanged.
- Copy action still copies readable mentions, not internal tokens.
- Edit mode readable mention text and edit picker remain unchanged.
- Basic link rendering remains unchanged.

## Manual Smoke

Run authenticated web smoke on a server with at least two users:

1. User A sends a channel message mentioning User B via picker.
2. User A clicks User B's mention chip and lands in the direct conversation with User B.
3. User B clicks the same mention chip and lands in the direct conversation with User B only if this is a supported non-self route; if it is self, confirm the chip does not route to a broken page.
4. User A sends `@all`; confirm the chip is not clickable.
5. User A sends plain text `@unknown` or a raw fallback case without metadata; confirm it is not an unreliable navigation target.
6. Confirm copy action still copies `@name`.
7. Confirm edit mode still displays `@name` / `@all` and the edit picker still works.
8. Confirm ordinary links still open as links.
9. Repeat a quick desktop runtime check if this is moving toward desktop pass; at minimum keep `check:desktop:config` green.

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

## Handoff Format

Do not commit automatically.

Return:
- branch name and base commit;
- changed files;
- exact behavior for other-user mention, self mention, and `@all`;
- any DTO/data limitation found;
- verification output summary;
- manual smoke status;
- PowerShell-safe git commands.

Suggested commit message:

`feat(customer): navigate from mention chips to member conversations`

## Implementation Result

Status:
- `implemented locally / command verification passed; manual smoke pending`

Delivered:
- metadata-backed single-user mention chips now render as internal Next links when the mentioned member is not the current member;
- clicking another member's mention navigates to the existing direct conversation route: `/servers/:serverId/conversations/:memberId`;
- keyboard activation works through native link behavior;
- self mentions remain non-navigating to avoid the existing self-conversation redirect path;
- `@all` remains visually styled but non-clickable;
- raw fallback mention chips without backend metadata remain non-clickable;
- mention target-user whole-message highlight, copy action readable mention output, edit readable mention text, edit picker behavior, and basic link rendering are unchanged;
- backend/API/SDK contracts, parser behavior, DB schema/migrations, unread/realtime behavior, auth/session, storage, media/WebRTC, replies, profile modal, and link previews are unchanged.

DTO/data limitation:
- no blocker found; existing `MessageMentionDto.kind`, `memberId`, and member profile data are sufficient for safe navigation.

Manual smoke:
- pending authenticated web smoke for other-user mention navigation, self mention non-navigation, `@all` non-navigation, fallback non-navigation, copy/edit/link regressions, and desktop runtime review.

Verification:
- `git diff --check`: pass, with existing CRLF conversion warnings only;
- `bun.cmd x prisma validate`: pass;
- `bun.cmd x tsc --noEmit -p tsconfig.json`: pass;
- `bun.cmd run typecheck:api`: pass;
- `bun.cmd run build:api`: pass;
- `bun.cmd x next lint`: pass;
- `bun.cmd run build:web`: pass;
- `bun.cmd run check:desktop:config`: pass.
