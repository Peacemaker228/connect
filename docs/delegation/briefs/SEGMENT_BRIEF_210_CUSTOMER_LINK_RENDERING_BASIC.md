# Segment Brief 210: Customer Link Rendering Basic

Branch: `feature/customer-link-rendering-basic`
Segment: `customer-link-rendering-basic`
Status: `implemented locally / command verification passed; manual smoke pending`
Base: latest `origin/core/reborn`

## Preparation Notes

Repository reality at brief creation:
- local branch was updated to `core/reborn`;
- `origin/core/reborn` already includes Segment 209 through PR #154;
- worktree was clean before this brief was created.

Docs checked:
- `rules/for-brief.md`;
- `docs/roadmap/STAGE_STATUS.md`;
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/BOUNDARIES.md`;
- `SEGMENT_BRIEF_204_CUSTOMER_MENTIONS_ATTENTION_FOUNDATION.md`;
- `SEGMENT_BRIEF_206_CUSTOMER_MESSAGE_COPY_ACTION.md`;
- `SEGMENT_BRIEF_209_CUSTOMER_CHAT_SEND_BUTTON.md`.

Selected rule files:
- `rules/rules.md` for baseline workflow;
- `rules/task.md` because this is frontend/shared UI work;
- `rules/architecture-docs.md` because docs/status must be updated;
- `rules/review/mini-review.md` for merge-readiness review after implementation.

Intentionally excluded:
- link previews/unfurl cards;
- backend URL fetching;
- reply-to-message;
- broad file-transfer expansion;
- backend/API/SDK contract changes;
- DB/schema/migrations;
- unread/realtime behavior;
- auth/session;
- storage provider config;
- media/WebRTC.

## Goal

Render plain URLs inside chat message text as clickable links while preserving existing message text, multiline rendering, mentions, copy behavior, and attachment rendering.

This is the first safe slice:
- no previews;
- no server-side fetch;
- no metadata scraping;
- no backend changes.

## Current Context

`MessageContent` currently owns visible message text rendering:
- stable mention tokens and raw fallback mentions render as mention chips;
- plain text remains React text, with `whitespace-pre-wrap` owned by `ChatItem`;
- deleted messages bypass `MessageContent`.

`message-copy.ts` owns copy output:
- it already makes copied content readable;
- copy behavior should not be changed unless a bug is directly caused by link rendering.

Attachments already render through separate file blocks in `ChatItem` and must stay unchanged.

## Implementation Result

Delivered:
- `MessageContent` now keeps mention tokenization as the first rendering pass and linkifies only the remaining plain-text segments;
- `http://`, `https://`, and `www.` message URLs render as native anchors with `target="_blank"` and `rel="noopener noreferrer"`;
- `www.` links receive an `https://` href while preserving the visible text;
- trailing punctuation such as `.`, `,`, `!`, `?`, and `)` remains visible as normal text outside the link target;
- long links use the existing `overflow-wrap-anywhere` helper so message layout can wrap instead of overflowing;
- deleted messages, file attachment blocks, and copy output remain on the existing paths.

Not changed:
- no link preview/unfurl cards;
- no backend URL fetch;
- no backend/API/SDK/DB/unread/auth/storage/media change;
- no reply-to-message or file-transfer policy work.

## Inspect First

Runtime files:
- `src/lib/chat/features/message-content.tsx`;
- `src/lib/chat/features/message-mention-text.ts`;
- `src/lib/chat/features/message-copy.ts`;
- `src/lib/chat/features/chat-item.tsx`;
- `src/lib/chat/features/chat-messages.tsx`.

Docs:
- `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
- `docs/roadmap/STAGE_STATUS.md`.

## In Scope

- Detect safe web links in message text and render them as `<a>`.
- Supported first-slice links:
  - `http://...`;
  - `https://...`;
  - `www.example...` rendered with `https://` href.
- Use `target="_blank"` and `rel="noopener noreferrer"`.
- Preserve visible text exactly enough for user readability:
  - do not swallow trailing punctuation like `.`, `,`, `!`, `?`, `)`;
  - keep newlines and normal text around links.
- Keep mention rendering intact and higher priority than link rendering.
- Keep deleted-message rendering unchanged.
- Keep file attachment rendering unchanged.
- Prefer small reusable parsing/render helpers if they reduce complexity.
- Prefer existing shared/shadcn/Radix/cmdk primitives when they fit; if a native/custom element is chosen, document why. For plain links, native `<a>` is expected and appropriate.
- Update docs:
  - this brief;
  - `docs/waves/CUSTOMER_PRIORITY_DELIVERY_PLAN.md`;
  - `docs/roadmap/STAGE_STATUS.md`.

## Out Of Scope

- Link preview/unfurl cards.
- Fetching remote URL metadata.
- SSRF handling beyond avoiding backend fetch entirely.
- `mailto:`, `tel:`, `ftp:`, custom schemes, or `javascript:` links.
- Broad URL normalization beyond `http`, `https`, and `www.`.
- Backend/API/SDK changes.
- DB schema/migrations.
- Unread/realtime changes.
- Notification/sound behavior.
- Storage/auth/media/WebRTC changes.
- Reply-to-message.
- Broad file-transfer changes.

## Implementation Guidance

Preferred shape:
- extend `MessageContent` to tokenize text into:
  - mention chips;
  - safe link anchors;
  - plain text;
- keep tokenization deterministic and easy to audit;
- avoid dangerous regex patterns with catastrophic backtracking;
- do not use `dangerouslySetInnerHTML`;
- do not fetch the link.

Parsing rules:
- mentions should win over links if ranges overlap;
- link detection should run on plain text segments after mention tokenization, or use a combined scanner that preserves mention priority;
- trim trailing punctuation from the anchor target while leaving punctuation as normal text;
- reject unsafe schemes.

Anchor styling:
- make links visually recognizable but not loud;
- use theme-compatible underline/hover styling;
- ensure long links wrap instead of overflowing message containers.

Compatibility:
- `MessageContent` must still render `mentions === undefined` fallback behavior as before;
- `mentions: []` must remain trusted backend-empty state and should not create false mention chips;
- copy behavior can remain plain text unless the implementation naturally shares safe helpers without changing output.

## Acceptance Criteria

Functional:
- `https://example.com` renders as a clickable link;
- `http://example.com/path?a=1` renders as a clickable link;
- `www.example.com/path` renders as a clickable link with `https://www.example.com/path` href;
- trailing punctuation is not part of the href;
- multiple links in one message render correctly;
- multiline text with links preserves line breaks;
- normal text without links is unchanged.

Safety:
- `javascript:alert(1)` does not become a clickable link;
- non-web schemes are not linkified in this first slice;
- no `dangerouslySetInnerHTML`;
- no backend fetch or preview request is added.

Regression:
- mention chips still render;
- messages containing both mentions and links render both correctly;
- deleted messages are unchanged;
- image/PDF attachment blocks are unchanged;
- message copy action still copies readable text/attachment URL as before.

## Verification Commands

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

No migration command should be required.

## Manual Smoke

Use authenticated web sessions.

Check channel and direct-message messages:
- plain `https://...`;
- plain `http://...`;
- `www...`;
- multiple links;
- link followed by `.`, `,`, `!`, `?`, `)`;
- multiline message with links;
- mention plus link in the same message;
- deleted-message visual remains unchanged;
- image/PDF attachment message remains unchanged;
- copy action still copies readable text.

Desktop runtime:
- review/pending unless packaged desktop runtime is actually opened and checked.

## Handoff Format

Return:
- branch name;
- files changed;
- summary of behavior;
- explicit confirmation that no preview/backend fetch/API/DB changes were made;
- verification command results;
- manual smoke status;
- remaining risks/follow-ups.

Do not commit automatically. Return PowerShell-safe `git add` / `git commit` commands.
