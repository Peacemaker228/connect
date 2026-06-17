# Segment 222: Customer Chat Initial Scroll Stability Fix

Status: implemented locally / command verification passed / targeted local smoke passed

Branch:
- `feature/customer-chat-initial-scroll-stability-fix`

Context:
- after Segment 220/221, production/staging showed an entry-time chat scroll race on chats with history;
- observed behavior: the chat could briefly land at latest, then jump toward the top or middle, and sometimes appear stuck away from the expected initial position;
- local dev did not reliably reproduce the issue, so the fix targets the ownership model rather than a single environment-specific symptom.

Expected behavior:
- on chat entry with unread messages, the first loaded unread non-own message should become the initial target;
- when the unread range is larger than the first latest page, the client may perform bounded older-page loads before settling the initial target;
- on chat entry without unread messages, the initial target is the latest/live bottom;
- initial latest windows should be viewport-aware: if rendered rows are shorter than the chat viewport while older pages still exist, the client should perform bounded older-page loads before settling;
- while initial fill/positioning is not settled, users should see a message-shaped skeleton instead of the intermediate scroll position;
- mark-read, active-chat read boundary, jump-to-latest visibility, viewport auto-fill, and latest-mode auto-scroll must not race the initial positioning.

Implemented:
- added a bounded `limit` query parameter to channel and direct message list endpoints, with server-side clamping;
- the chat client now sends a viewport-estimated initial page size instead of always starting from a tiny fixed latest page;
- server-entry prefetch uses a larger bounded message limit so cached navigation does not seed an underfilled chat window;
- added an explicit initial-scroll settled state in `ChatMessages`;
- disabled latest-mode auto-scroll, boundary load-more, viewport auto-fill, active read-state publication, and mark-read until initial positioning is complete;
- bounded initial unread context loading to avoid infinite older-page fetches;
- bounded viewport-aware initial loading so short-message histories do not leave a large empty top gap while older pages still exist;
- added a shared shadcn-style `Skeleton` component and a chat initial skeleton layer that approximates text, image, and file message rows while the real list remains mounted for measurement;
- initial placement uses instant container `scrollTop` positioning and reveals real content on the next animation frame, avoiding a visible "upper messages then smooth-scroll down" transition;
- repeat navigation to a chat with valid React Query cache now follows stale-while-revalidate behavior: cached messages are shown immediately only after unread summary is known and no unread target is reported, while the active chat query always refetches on mount/return so missed inactive-chat realtime events cannot leave the latest page stale;
- when unread summary already says the returning chat has unread messages, warm cached rows are not revealed as the final state until the latest page reconciliation completes, preventing a visible stale-cache jump before the new message appears;
- unread/read side effects still wait for normal initial positioning and unread summary reconciliation;
- set the `New` divider anchor from the same initial unread decision;
- updated `useChatScroll` so re-enabling auto-scroll after a deliberate disabled phase does not perform a surprise first auto-scroll to bottom;
- updated top-boundary load-more to be scroll-direction aware and slightly debounced, so older pages are not prepended after a brief threshold crossing when the user is already scrolling back down; this avoids bottom-edge/layout jerk caused by unexpected scroll-height growth;
- changed older-page prepend compensation to preserve the nearest visible message row as an anchor when async older pages arrive; the `scrollTop + height delta` fallback remains only for cases where the anchor row is no longer available;
- moved the jump-to-latest button out of the scroll content flow into an absolute overlay, so showing/hiding it no longer changes chat `scrollHeight` near the live bottom;
- changed latest viewport auto-fill to preserve viewport position when older rows are prepended.

Targeted local smoke:
- local production-like web/API: `http://localhost:3001` + `http://localhost:4000`;
- authenticated channel with long history opened at latest bottom;
- one upward scroll into the top-boundary triggered exactly one older-page request and preserved the logical visible row position after prepend;
- scrolling back down to latest triggered no extra older-page requests and reached bottom with the jump control out of scroll flow;
- local web process had to be restarted after `build:web` because the running Next server held stale `.next` assets; after restart the smoke passed.

Out of scope:
- no DB/schema/migration changes;
- no reply navigation model changes;
- no virtualization;
- no link preview work;
- no desktop release pass.

Manual smoke required:
- production/staging chat with no unread and long history opens at latest bottom;
- short-message histories load enough initial rows to avoid a large empty top gap when older pages still exist;
- first chat message request should include a viewport-sized `limit`, not a tiny fixed page followed by visible catch-up;
- the scrollbar should not visibly run through intermediate top/bottom states during initial fill;
- real content should appear directly at the final initial position, without a visible smooth-scroll from older rows to bottom;
- repeat channel/DM navigation with cached messages should show cached content immediately and reconcile in the background, not get stuck on the initial skeleton;
- if another user sends a message while the current user is away from that channel/DM, returning to the chat must refetch the latest page and show the new message without requiring a full page reload;
- fast wheel/scrollbar movement down toward the live bottom should not trigger older-page prepends or visible layout jerk;
- scrolling upward into older-page loading should keep the visible row anchored instead of throwing the user down after each page prepend;
- production/staging chat with unread opens around the first unread and shows `New`;
- opening a chat no longer visibly jumps bottom -> top -> middle;
- older-history auto-fill does not move the user away from the selected initial target;
- reply navigation from Segment 220/221 still works for loaded and unloaded targets;
- jump-to-latest still appears when away from bottom and hides after returning to latest.
