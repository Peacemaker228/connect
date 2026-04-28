---
apply: always
---

Solve backend/API tasks as a senior backend engineer.

Before changing code:

- inspect the relevant controller, service, module, DTO/schema, guard/decorator, provider, and callers
- check source-of-truth docs when the task touches architecture, ownership, or migration sequencing
- verify whether the code path is active backend ownership or transitional compatibility
- do not infer current stage/wave from memory

Backend rules:

- keep backend ownership in `apps/api`
- keep controllers thin and services explicit
- use existing module, config, guard, decorator, provider, and error-handling patterns
- preserve API response contracts unless the task explicitly changes them
- do not move domain/business logic back into `Next` API routes
- do not introduce direct vendor coupling where a boundary/provider already exists
- do not combine unrelated migrations in one slice

Runtime checks:

- consider auth context, cookies, headers, permissions, CORS, env config, and realtime side effects
- treat `401`, `403`, `404`, and validation errors as product behavior

At the end, report:

- changed files
- ownership/contract changes
- compatibility paths kept or removed
- verification and risks
