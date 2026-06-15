# Segment Brief 221: Customer Reply Telegram Visual Polish

## Segment

`customer-reply-telegram-visual-polish`

## Branch

`feature/customer-reply-telegram-visual-polish`

## Status

`implemented locally / command verification passed; manual smoke pending`

## Goal

Polish reply visuals after Segment 220 using a Telegram-like style, not a Discord-like stacked block.

Reply previews should stay compact and readable:

- purple/violet reply accent line;
- subtle purple/violet preview background;
- readable author and one-line preview text;
- metadata-backed `@user` / `@all` rendering preserved;
- current Segment 220 reply navigation behavior preserved.

This segment is frontend/shared UI polish only.

## Required Reading

- `rules/rules.md`
- `rules/task.md`
- `rules/review/mini-review.md`
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`
- `docs/roadmap/STAGE_STATUS.md`
- `docs/delegation/briefs/SEGMENT_BRIEF_220_CUSTOMER_CHAT_ANCHOR_CONTEXT_HISTORY_NAVIGATION.md`

## In Scope

- Update sent-message reply preview visual style to a compact Telegram-like treatment.
- Keep the composer reply bar visually compatible through the shared reply preview component.
- Update temporary reply target navigation highlight to purple/violet background, without ring-only treatment or layout shift.
- Keep clickable reply preview accessibility and focus state.
- Update docs/status.

## Out Of Scope

- No backend/API/SDK contract changes.
- No DB schema/migration changes.
- No reply attention/unread changes.
- No realtime event changes.
- No URL deep links/permalinks.
- No thread UI.
- No message-list virtualization.
- No WebRTC/media work.
- No storage/auth/session changes.
- No broad chat scroll/navigation rewrite.
- No mention parsing/rendering changes beyond preserving existing reply preview mention rendering.

## Implementation Result

Delivered:

- shared reply previews now use a compact violet Telegram-like left line and subtle violet background;
- reply preview author text, hover state, keyboard focus ring, and cancel button use the same violet accent family;
- composer reply bar reuses the shared violet reply preview style instead of overriding it with the old neutral block background;
- reply target navigation highlight now uses a temporary violet background, not the previous orange ring-style treatment;
- double-clicking an empty area of a non-deleted message row starts a reply, Telegram-style, while double-clicks on text, links, files, avatars, headers, reply previews, action buttons, forms, and other controls are ignored;
- Segment 220 navigation behavior and data flow are unchanged.

Kept out of scope:

- no backend/API/SDK/DB/realtime/auth/storage/media/WebRTC changes;
- no reply attention/unread semantics changes;
- no virtualization;
- no thread/deep-link work.

## Verification

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

## Manual Smoke

- Channel reply preview with plain text original.
- Channel reply preview with `@user` / `@all`.
- Deleted original fallback.
- Loaded target navigation with violet highlight.
- Unloaded target navigation through anchored context with violet highlight.
- Composer reply bar select/cancel/send.
- Double-click empty message row area starts reply.
- Double-click message text, link, file row, avatar/header, reply preview, or action button does not start reply.
- Direct-message reply preview regression.
- Light and dark theme visual check if practical.

Desktop runtime remains review/pending unless a packaged desktop smoke is explicitly run.

## Handoff

Do not commit automatically.

Return:

- branch and base commit;
- `git status --short --branch`;
- changed files;
- what visual style changed;
- confirmation that Segment 220 navigation behavior was preserved;
- confirmation that backend/API/SDK/DB/realtime/auth/storage/media were not touched;
- verification results;
- manual smoke status;
- remaining risks;
- PowerShell-safe `git add` and `git commit` commands.

Suggested commit message:

`style(customer): polish reply previews with telegram-like accents`
