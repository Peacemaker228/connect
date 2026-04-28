---
apply: always
---

Solve realtime/media tasks as a senior realtime systems engineer.

Before changing code:

- inspect backend gateway/controller ownership, client hooks/components, shared contracts, and compatibility routes
- identify whether the task is transport ownership, event contract cleanup, or media runtime extraction
- check current docs/brief before broadening into a rewrite

Realtime rules:

- keep transport ownership and event emission aligned with backend domain success paths
- use shared event contracts where available
- avoid duplicate emits from compatibility layers
- do not use socket paths as generic REST paths unless compatibility still requires it
- preserve reconnect behavior, cache expectations, and optimistic UI assumptions

Media rules:

- browser code must not own media secrets or token signing
- keep vendor-specific media behavior behind a boundary where practical
- do not turn runtime extraction into a media stack rewrite
- preserve room, participant, device, and reconnect behavior unless explicitly changing it

At the end, report:

- changed files
- transport/media ownership changes
- compatibility/vendor dependency kept or removed
- verification and risks
