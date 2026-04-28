---
apply: always
---

Solve auth/storage tasks as a senior platform engineer.

Before changing code:

- read the relevant boundary docs and current brief
- inspect both backend ownership and browser/runtime callers
- verify whether the task is active-path work or compatibility cleanup

Auth rules:

- keep auth behind the project auth boundary
- do not add direct auth-vendor usage in feature/UI code
- handle cookie/session/logout/refresh/current-user behavior carefully
- treat stale auth state and incorrect redirects as product bugs

Storage rules:

- keep storage behind the project storage boundary
- do not spread storage-vendor assumptions into UI/domain code
- preserve documented legacy compatibility until a brief explicitly removes it
- keep cleanup/sweeper logic bounded and metadata-driven

General rules:

- do not mix auth and storage changes unless the task is explicitly about their interaction
- do not jump to deferred product features unless the roadmap says the current stage owns them

At the end, report:

- changed files
- active-path behavior changed
- compatibility behavior kept or removed
- verification and risks
