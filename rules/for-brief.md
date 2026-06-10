---
apply: always
---

# FOR_BRIEF

Use this rule before writing any delegation brief, next-segment brief, operator brief, or agent handoff prompt.

The goal is to produce a brief from the current repository reality, not from memory or from a previous chat summary.

## 1. Start With Repository Reality

Before drafting the brief:

- run `git status --short --branch`;
- check the current branch and whether the worktree is dirty;
- inspect recent commits if the requested status depends on what was merged;
- do not overwrite or reinterpret uncommitted work from another agent;
- if the worktree is dirty, say whether the new brief can be prepared safely without touching those files.

## 2. Read The Source Of Truth

Always read or re-check the relevant parts of:

- `docs/roadmap/STAGE_STATUS.md`;
- the active wave document;
- the latest relevant `SEGMENT_BRIEF_*`;
- `docs/delegation/DELEGATION_AGENT_GUIDE.md`;
- `docs/roadmap/PLATFORM_MIGRATION_PLAN.md` when the task touches architecture, migration order, database, media, production, staging, or deployment;
- `docs/roadmap/ARCHITECTURE.md` and `docs/roadmap/BOUNDARIES.md` when the task touches ownership boundaries;
- `docs/ax-connect_runbook.md` before production/staging deploy or operator commands.

Do not treat `docs/README.md` as current stage status. It is useful for reading order, but `STAGE_STATUS.md` is the current status source.

## 3. Select Task-Specific Rules

Every brief should include the rule files the next agent must read.

Always include:

- `rules/rules.md`;
- `rules/for-brief.md` if the agent will create another brief;
- `rules/review/mini-review.md` if the task is review, merge readiness, or checking another agent's work.

Add based on task surface:

- frontend/shared UI: `rules/task.md`;
- backend/API/domain: `rules/backend-api.md`;
- SDK/client access/cache/query work: `rules/sdk-client-access.md`;
- realtime/socket/media/WebRTC: `rules/realtime-media.md`;
- auth or storage: `rules/auth-storage.md`;
- docs/roadmap/delegation/status work: `rules/architecture-docs.md`.

If several surfaces are touched, include all relevant rules instead of guessing.

## 4. Filter Legacy Context

Do not pull legacy/historical context into the brief unless it is directly relevant.

Current defaults unless `STAGE_STATUS.md` says otherwise:

- active source branch is `core/reborn`;
- customer-priority work is active under `Wave 35 / CUSTOMER_PRIORITY_DELIVERY_PLAN`;
- `staging.ax-connect.ru` is a working stand with real user activity, not a disposable test target;
- Stage 6 production Postgres migration is deferred;
- Stage 9 WebRTC production/staging hardening is paused and resumable from the saved resume brief;
- legacy `main` is not the default target for new work;
- legacy Clerk/UploadThing/LiveKit/MySQL references may exist in historical docs/runbooks, but they are not active implementation direction unless the current brief explicitly targets them.

When a doc contains historical or stale information, mention that it is historical/stale and point the agent to the current source of truth.

## 5. Keep The Brief Bounded

A good brief must include:

- branch name;
- segment name;
- goal;
- required reading;
- files or directories to inspect first;
- in scope;
- out of scope;
- constraints and compatibility/fallback rules;
- expected implementation shape;
- acceptance criteria;
- verification commands;
- manual/operator smoke if needed;
- handoff format;
- explicit "do not commit" or commit instructions, matching the user's current preference.

Do not combine unrelated streams in one brief. Prefer one coherent product/runtime slice.

## 6. Briefs For Customer-Priority Work

For current customer-priority tasks, always consider:

- preserving staging data;
- avoiding disruptive staging media/TURN experiments;
- web verification first;
- desktop-first follow-up for shared UI, notifications, clipboard, sound, and media controls;
- no staging DB reset;
- no production Postgres migration work;
- no LiveKit removal;
- no WebRTC production rollout unless the customer-priority pause is explicitly lifted.

For unread/notification work specifically, keep normal unread separate from attention signals such as mentions, `@all`, and replies unless the segment explicitly owns attention metadata.

## 7. Output Discipline

Before presenting the brief, state briefly:

- which docs were checked;
- which rule files were selected and why;
- what legacy/deferred areas were intentionally excluded.

If this preparation is skipped, the brief should be classified as `review / insufficient context`, not as ready.
