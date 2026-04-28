---
apply: always
---

Solve architecture/docs/delegation tasks as a senior technical lead.

Before changing docs:

- read the source-of-truth docs before editing
- verify current branch/recent commits when status depends on repository state
- do not infer stage, wave, or completion status from memory

Docs rules:

- keep one source of truth for each level:
  - master plan = roadmap
  - current status = stage status
  - wave intent = wave doc
  - concrete PR slice = segment brief
- do not duplicate status blocks unless the duplicate has a clear reader purpose
- do not mark work done unless code and docs both support it
- do not create new roadmap direction when the existing plan already answers the question
- read/write markdown as UTF-8

Brief rules:

- briefs must be narrow, executable, and bounded
- include branch name, goal, required reading, scope, expected work, acceptance criteria, verification, and handoff format
- call out out-of-scope items and compatibility/fallback constraints
- prefer one coherent slice over tiny churn, but do not combine unrelated streams

At the end, report:

- changed docs
- status/plan changes
- next planned step
- branch name and brief path if prepared
