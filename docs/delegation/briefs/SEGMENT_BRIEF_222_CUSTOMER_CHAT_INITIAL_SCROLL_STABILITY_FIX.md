# Segment 222: Customer Chat Initial Scroll Stability Fix

Status: implemented locally / verification pending

Branch:
- `feature/customer-reply-telegram-visual-polish`

Context:
- after Segment 220/221, production/staging showed an entry-time chat scroll race on chats with history;
- observed behavior: the chat could briefly land at latest, then jump toward the top or middle, and sometimes appear stuck away from the expected initial position;
- local dev did not reliably reproduce the issue, so the fix targets the ownership model rather than a single environment-specific symptom.

Expected behavior:
- on chat entry with unread messages, the first loaded unread non-own message should become the initial target;
- when the unread range is larger than the first latest page, the client may perform bounded older-page loads before settling the initial target;
- on chat entry without unread messages, the initial target is the latest/live bottom;
- initial latest windows should be viewport-aware: if rendered rows are shorter than the chat viewport while older pages still exist, the client should perform bounded older-page loads before settling;
- mark-read, active-chat read boundary, jump-to-latest visibility, viewport auto-fill, and latest-mode auto-scroll must not race the initial positioning.

Implemented:
- added an explicit initial-scroll settled state in `ChatMessages`;
- disabled latest-mode auto-scroll, boundary load-more, viewport auto-fill, active read-state publication, and mark-read until initial positioning is complete;
- bounded initial unread context loading to avoid infinite older-page fetches;
- bounded viewport-aware initial loading so short-message histories do not leave a large empty top gap while older pages still exist;
- set the `New` divider anchor from the same initial unread decision;
- updated `useChatScroll` so re-enabling auto-scroll after a deliberate disabled phase does not perform a surprise first auto-scroll to bottom;
- changed latest viewport auto-fill to preserve viewport position when older rows are prepended.

Out of scope:
- no backend/API/SDK/DB changes;
- no reply navigation model changes;
- no virtualization;
- no link preview work;
- no desktop release pass.

Manual smoke required:
- production/staging chat with no unread and long history opens at latest bottom;
- short-message histories load enough initial rows to avoid a large empty top gap when older pages still exist;
- production/staging chat with unread opens around the first unread and shows `New`;
- opening a chat no longer visibly jumps bottom -> top -> middle;
- older-history auto-fill does not move the user away from the selected initial target;
- reply navigation from Segment 220/221 still works for loaded and unloaded targets;
- jump-to-latest still appears when away from bottom and hides after returning to latest.
