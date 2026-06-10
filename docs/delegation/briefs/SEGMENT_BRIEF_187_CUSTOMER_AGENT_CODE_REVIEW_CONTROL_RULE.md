# Segment Brief 187: Customer Agent Code Review Control Rule

## Metadata

- Branch: `feature/customer-staging-storage-write-permission-fix`
- Segment: `customer-agent-code-review-control-rule`
- Type: docs-only process correction
- Status: `pass / documented`

## Context

During the customer-priority track, an agent handoff was almost treated as sufficient evidence for merge/deploy without independently checking the actual code diff.

That is not acceptable for this project while `staging.ax-connect.ru` is actively used by an external team.

## Rule

Agent summaries and handoff briefs are inputs, not proof.

Before recommending merge, deploy, or operator action, the supervising agent must inspect the actual repository state and changed code.

Required checks:

- run `git status --short --branch`;
- inspect the real changed files with `git diff`, `git show`, or targeted file reads;
- compare the code diff against the handoff claims;
- identify scope drift, unrelated runtime changes, env changes, DB/schema changes, media changes, migration changes, or production-impacting changes;
- run or require the verification commands appropriate for the touched surface;
- for frontend/runtime changes, require a concrete smoke target or mark smoke as pending;
- for deploy guidance, confirm the target commit exists on the branch being deployed.

## Classification Rule

If the supervising agent has not inspected the actual diff/code, the segment must not be called `pass`.

Use:

- `review / unverified handoff`

until code inspection and verification are complete.

## Customer-Priority Application

This applies to all customer-priority segments, including:

- storage/upload/display fixes;
- unread badges and sounds;
- mentions;
- link rendering and link previews;
- message copy;
- reply-to-message;
- media fallback UI;
- desktop parity checks.

## Intentionally Not Changed

- runtime code;
- env files;
- production/staging server state;
- branch strategy;
- WebRTC migration state;
- Stage 6/Postgres migration state.

## Verification

Expected verification for this docs-only correction:

```bash
git diff --check
```

## Result

The customer-priority plan now explicitly requires real code review and verification before merge/deploy recommendations.
