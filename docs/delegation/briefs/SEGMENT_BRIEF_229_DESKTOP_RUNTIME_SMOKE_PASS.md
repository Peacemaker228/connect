# Segment 229. Desktop Runtime Smoke Pass

## Classification

- segment: `desktop-runtime-smoke-pass`
- type: `desktop release / packaged runtime smoke`
- status: `pass / operator-smoked`
- source branch: `feature/desktop-staging-download-nginx-route-diagnosis`
- artifact: `AxConnect-Staging-Setup-0.0.2.exe`
- channel: `staging`

## Context

Segment 228A closed staging desktop download hosting:

- installer URL serves static bytes without auth redirect;
- downloaded latest installer SHA256 matches `794A8DB83BAA07E47B8B018062EA2600D9C14C0CF8355EE99BA0E1C693AD1164`;
- browser download and Windows installation were confirmed.

This segment records the first packaged desktop runtime smoke on the installed `AxConnect Staging` app.

## Smoke Scope

Operator manually checked the installed desktop app, not only browser staging.

Covered:

- packaged app launch;
- login/session behavior at a basic level;
- server/channel/direct navigation;
- chat send/edit/delete/copy behavior;
- screenshot paste;
- generic file upload/download/open;
- mentions and reply flow;
- unread badges, sound toggle, and per-chat mute behavior at the current web-runtime level;
- window resize/theme-level usability;
- logout-level flow.

## Result

Status: `pass`.

The operator did not find critical blockers during manual desktop smoke.

Known issue:

- generic non-image/non-PDF file open/download UX in Electron is awkward: opening a generic file can show a separate window/native save flow, completion is not clear, and the extra window does not close automatically;
- this is classified as `review / UX issue`, not a blocker for the first staging desktop runtime smoke;
- it should be handled in a focused future segment such as `desktop-file-download-ux-polish`.

Not claimed:

- native OS notifications;
- app/taskbar/dock unread badge;
- auto-update;
- code signing;
- CI/CD release pipeline;
- production desktop rollout.

## Next Segment

Proceed to `desktop-native-notification-bridge`.

Goal:

- route accepted unread/attention events from the renderer to Electron native notifications and best-effort app-level attention signals.

## Verification

Repository verification for this docs update:

- `git diff --check` expected to pass, CRLF warnings acceptable for docs.

Runtime verification was operator-manual and is recorded above.
