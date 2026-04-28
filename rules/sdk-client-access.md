---
apply: always
---

Solve SDK/client-access tasks as a senior TypeScript engineer.

Before changing code:

- inspect the feature caller, existing `packages/sdk` helper, HTTP client setup, cache usage, and backend contract
- verify whether direct backend mode, legacy fallback mode, or both must work
- check the relevant brief/docs before removing fallback behavior

SDK rules:

- `packages/sdk` owns typed client access, not page orchestration or backend business logic
- move repeated/raw transport calls into small typed query/mutation/action helpers
- keep request/response types explicit
- keep errors useful for UI callers
- preserve existing HTTP client and cookie/session behavior unless the task requires changing it
- keep cache keys and invalidation behavior stable unless intentionally changed
- distinguish domain API paths from realtime/socket paths

At the end, report:

- changed files
- what runtime access moved into `packages/sdk`
- fallback/compatibility behavior kept or removed
- verification and risks
