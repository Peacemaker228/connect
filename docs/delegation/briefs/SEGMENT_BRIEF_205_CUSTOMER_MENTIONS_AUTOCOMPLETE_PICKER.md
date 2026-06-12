# Segment Brief 205: Customer Mentions Autocomplete Picker

## Metadata

- Branch: `feature/customer-mentions-autocomplete-picker`
- Base: latest `origin/core/reborn`
- Segment: `customer-mentions-autocomplete-picker`
- Type: customer-priority chat composer UX
- Priority: P1 after `customer-mentions-attention-foundation`
- Commit policy: do not commit automatically. Return PowerShell-safe `git add` / `git commit` commands.

## Repository Reality

Checked before drafting:

- current branch was refreshed from `origin/core/reborn`;
- `origin/core/reborn` contains Segment 204 through merge commit `1538d2a`;
- Wave 35 remains the active customer-priority track;
- `staging.ax-connect.ru` is a working stand with real users, not a disposable test target;
- Segment 204 created metadata-backed channel mentions, `@all`, mention chips, mention attention, and own-message unread/sound suppression;
- Segment 204 manual smoke remains pending and can be covered on staging together with this picker slice;
- current composer is a plain `textarea` in `src/lib/chat/features/chat-input.tsx`;
- channel pages pass `messageQuery.serverId` and `messageQuery.channelId` into `ChatInput`;
- direct-message pages pass only `conversationId`, so this segment should start with channel mentions unless the agent finds a safe existing server/member source for DMs;
- server member data is already available through `useGetServer(serverId)` / `ServerMembersProfilesDto`;
- existing UI has command/popover primitives, but there is no rich text editor.

## Goal

Add a bounded Discord-like mention picker to the channel message composer so users do not have to manually type fragile raw mentions or visible stable tokens.

The picker should make `@user` and `@all` discoverable and usable while preserving the Segment 204 backend-owned mention parsing and unread/attention behavior.

## Required Reading

Rules:

- `rules/rules.md`
- `rules/task.md`
- `rules/backend-api.md`
- `rules/sdk-client-access.md`
- `rules/realtime-media.md`
- `rules/architecture-docs.md`
- `rules/review/mini-review.md`

Docs:

- `docs/roadmap/STAGE_STATUS.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`
- `docs/roadmap/ARCHITECTURE.md`
- `docs/roadmap/BOUNDARIES.md`
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`

## Inspect First

- `src/lib/chat/features/chat-input.tsx`
- `src/lib/chat/features/message-content.tsx`
- `src/lib/chat/features/chat-item.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`
- `src/app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx`
- `src/lib/server-list/features/server-sidebar.tsx`
- `packages/sdk/src/queries/server.ts`
- `packages/app-core/src/contracts/domain.ts`
- `packages/app-core/src/schemas/chat-input-schema.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `src/lib/shared/ui/command.tsx`
- `src/lib/shared/ui/popover.tsx`

## In Scope

- Channel text composer mention picker triggered by typing `@`.
- Suggestions for:
  - `@all`;
  - server members, including the current user, matching the current Segment 204 product decision.
- Keyboard controls:
  - arrow up/down;
  - Enter or Tab to select;
  - Escape to close;
  - normal Enter send behavior must remain unchanged when the picker is closed.
- Mouse selection.
- Filtering by the current query after `@`.
- Safe insertion into the existing `textarea`.
- Prefer a stable submit path:
  - selected member suggestions should submit as stable `<@memberId>` tokens when this can be done without corrupting user text;
  - selected `@all` should submit as stable `<@all>` when this can be done safely;
  - manually typed raw `@DisplayName` / `@all` should continue to rely on Segment 204 backend parsing.
- If stable submit serialization cannot be implemented safely inside the current `textarea` without a larger editor rewrite, keep insertion as raw `@DisplayName` / `@all`, document the limitation clearly, and do not claim duplicate-display-name support.
- Keep screenshot paste, attachment modal, emoji picker, multiline input, autofocus, and send behavior working.
- Update Segment 205 docs/status.

## Out Of Scope

- Rich text editor rewrite.
- Reply-to-message.
- Link rendering or link previews.
- Message copy action.
- Browser/OS Notification API.
- Native desktop popups/taskbar badges.
- Backend mention schema changes.
- Prisma migrations.
- Realtime transport hardening.
- Auth/session changes.
- Storage/S3 changes.
- WebRTC/media changes.
- Staging DB reset.
- Production deploy or migration.

## Constraints

- Do not change the Segment 204 backend parser unless a blocking bug is found and explained.
- Do not weaken backend-owned membership validation.
- Do not make the client authoritative for mention recipients.
- Do not introduce a broad editor dependency without explicit justification.
- Preserve current `textarea` behavior unless the agent proves a small local replacement is safer.
- Preserve own-message unread/sound suppression.
- Preserve direct unread privacy.
- Preserve active-visible read semantics from Segment 203.
- Staging users may validate the final behavior, but the implementation still needs local command verification before handoff.

## Expected Implementation Shape

Preferred path:

1. Add small composer-local mention utilities, for example under `src/lib/chat/features/`:
   - detect active `@` trigger around the caret;
   - build suggestion list from current server members plus `@all`;
   - apply a selected suggestion to the current textarea value and caret position;
   - serialize selected stable mentions on submit if safely trackable.

2. Keep `ChatInput` in control:
   - derive `serverId` from `messageQuery.serverId` only for channel messages;
   - use `useGetServer(serverId)` or an existing query cache to read members;
   - do not fetch a new endpoint if existing server member data is enough.

3. UI:
   - use a compact popover/list near the composer;
   - show avatar/initial, display name, and secondary email/name if available;
   - show `@all` as a visually separated option that remains selectable even when the member list exceeds the visible member cap;
   - keep the list constrained in height and keyboard accessible;
   - keep text fitting and no overlap on desktop/narrow layouts.

4. Stable token behavior:
   - best case: selected `@DisplayName` appears readable while the submitted payload is converted to `<@memberId>` / `<@all>`;
   - acceptable first slice: insert raw `@DisplayName` / `@all` and document that duplicate display names still require the future stable-token/rich-editor model;
   - unacceptable: silently claim stable duplicate-name support while only submitting ambiguous raw names.

5. Documentation:
   - record exactly which token path was implemented;
   - record remaining limitations honestly.

## Acceptance Criteria

Channel composer:

- Typing `@` opens suggestions.
- Typing after `@` filters suggestions.
- `@all` is available and selectable.
- Members are available and selectable.
- Current user is available for explicit self-mention rendering/highlight.
- Escape closes the picker without changing text.
- Arrow keys move selection.
- Enter/Tab selects when picker is open.
- Enter sends when picker is closed.
- Shift+Enter still inserts newline.
- Emoji picker, screenshot paste, attachment upload, and autofocus still work.

Mention behavior:

- Selected `@user` creates a message that renders as a mention chip after send.
- Selected `@all` creates a message that renders as `@all` mention chip after send.
- If stable serialization is implemented, selected duplicate display names must resolve to the selected member, not an arbitrary raw-name match.
- If stable serialization is not implemented, duplicate display names must remain documented as not fully solved.
- Sender own-message unread/sound remains suppressed.
- Non-target users do not get mention attention from a single-user mention.
- `@all` attention remains consistent with Segment 204.

Compatibility:

- No DB migration.
- No backend schema change.
- No staging/prod secrets printed.
- No staging DB reset.
- No WebRTC/media work.

## Verification

Run:

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

If the agent changes backend/API or SDK contracts despite this being intended as a UI slice, explain why and rerun the relevant backend/API verification.

## Manual Smoke

Local or staging, two or three users in one server/channel:

1. User A types `@`, sees `@all` and server members.
2. User A filters by a member name and selects User B.
3. Sent message renders as mention chip for all viewers.
4. User B gets mention attention when not active-read.
5. User C gets normal unread only.
6. User A does not get own unread/sound from own message.
7. User A selects `@all`; other users get mention attention; sender own unread/sound stays suppressed.
8. User A selects self; sender sees rendering/highlight, but no own unread/sound.
9. Escape, arrow keys, Enter/Tab selection work.
10. Shift+Enter, normal send, emoji, screenshot paste, and attachment modal still work.
11. Reload restores backend mention state.
12. Desktop config check is required; packaged desktop runtime remains review unless manually run.

Note: Segment 204 smoke can be repeated during the same staging/user smoke pass, but do not mark Segment 204 or 205 fully product-pass without actual user/operator evidence.

## Implementation Result

Status: `implemented locally / command verification passed; manual smoke pending`

Delivered:

- Channel composer typing `@` opens a bounded picker with current server members from the existing `useGetServer(serverId)` data path plus a visually separated `@all` option.
- The picker popup uses the existing shadcn/cmdk `Command` list primitives for a more consistent selected-item UI while keeping text input ownership in the chat `textarea`.
- Suggestions are built only when the loaded server snapshot id matches the current `channelServerId`, avoiding stale members from `keepPreviousData`.
- Suggestions filter by the query after `@`.
- Member suggestions are capped, while matching `@all` remains selectable below a horizontal divider even when there are more members than the cap.
- ArrowUp/ArrowDown move selection.
- The picker list uses a Discord-like tall bounded `max-height` sized to fit the current cap of 8 member suggestions plus the separated `@all` option, but it is also viewport-aware so small windows shrink the list and allow scrolling.
- When the list becomes scrollable, keyboard navigation keeps the selected option visible through native `scrollIntoView({ block: 'nearest' })`, without custom scroll math.
- Pointer interaction inside the picker, including dragging the scroll bar, no longer closes the picker through the textarea blur handler; after pointer release, focus/caret are restored back to the chat textarea.
- Known polish debt: keyboard navigation can still visually jump while the chat `textarea` owns input focus and the shadcn/cmdk `Command` popup owns only the option list. This is acceptable for the current MVP slice and should be revisited as a focused mention editor / combobox-controller polish task if users complain.
- Enter/Tab select while the picker is open.
- Escape closes the picker without changing text.
- Mouse selection uses the same insertion path.
- Closed-picker Enter send and Shift+Enter newline remain unchanged.
- Selected suggestions insert readable `@DisplayName` / `@all` text into the textarea.
- On submit, still-intact selected mention ranges are serialized to stable `<@memberId>` / `<@all>` tokens before the existing message create mutation runs.
- If the user edits a selected mention range, that tracked stable replacement is dropped and the remaining raw text follows the Segment 204 backend parser path.
- The picker is channel-only; direct-message mention autocomplete remains out of scope for this first slice.
- Screenshot paste, attachment modal, emoji insert, normal text paste, autofocus, and existing message creation are preserved.
- Backend/API/SDK contracts, DB schema/migrations, unread/realtime behavior, auth/session, storage/media, replies, link rendering, message copy, and Notification API are unchanged.

Known limitations:

- Stable duplicate-display-name resolution applies to picker-selected mentions whose visible range remains intact until submit.
- Manual raw `@DisplayName` typing remains intentionally backend-parser based and can still be ambiguous when duplicate display names exist.
- This slice does not introduce rich-text chips inside the textarea; chips still render in sent messages through Segment 204 metadata-backed rendering.

## Docs To Update

- `docs/delegation/briefs/SEGMENT_BRIEF_205_CUSTOMER_MENTIONS_AUTOCOMPLETE_PICKER.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`

## Handoff Requirements

Return:

- branch name;
- changed files;
- exact picker behavior;
- exact token insertion/submission strategy;
- whether backend/API/SDK contracts changed;
- whether DB schema/migration changed;
- what remained out of scope;
- verification results;
- manual smoke status;
- known limitations, especially duplicate display names and stable token handling;
- PowerShell-safe git add/commit commands.
