# Desktop (Electron)

## Как это устроено

Desktop-версия в этом проекте — это Electron-оболочка поверх существующего Next.js приложения.

- `Electron` отвечает за нативное окно, preload, deep links и desktop permissions.
- `Next.js` продолжает рендерить интерфейс и выполнять серверные роуты.
- В `dev` Electron открывает локальный адрес `http://localhost:3005`.
- В `production` packaged app открывает URL из `electron/app-config.json`.

## Зачем нужен отдельный dev-сервер

Electron сам по себе не рендерит ваш React/Next проект из исходников.
Он просто открывает URL внутри desktop-окна.

Поэтому для `dev` нужны два процесса:

- `bun run dev:desktop:web` — поднимает локальный Next dev server на `3005`
- `bun run dev:desktop:app` — запускает Electron и открывает этот URL

Общий запуск:

```bash
bun run dev:desktop
```

Порт `3005` выбран специально, чтобы не конфликтовать с обычным web-dev на `3000`.

## Конфиг production

Файл `electron/app-config.json` нужен только для packaged desktop build.
В dev-режиме он не используется.

Пример:

```json
{
  "productionUrl": "https://ax-connect.ru"
}
```

Для ссылки на installer во frontend можно использовать переменную:

```env
NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL=/downloads/AxConnect-Setup-latest.exe
```

## Desktop Channels

Production remains the default desktop build:

```powershell
bun.cmd run check:desktop:production-config
bun.cmd run build:desktop
```

Production identity:

- app id: `com.axconnect.desktop`
- product name: `AxConnect`
- renderer URL: `https://ax-connect.ru`
- artifact: `AxConnect-Setup-<version>.exe`

Staging uses a separate Electron Builder config:

```powershell
bun.cmd run check:desktop:staging-config
bun.cmd run build:desktop:staging
```

Staging identity:

- app id: `com.axconnect.desktop.staging`
- product name: `AxConnect Staging`
- renderer URL: `https://staging.ax-connect.ru`
- protocol: `axconnect-staging`
- artifact: `AxConnect-Staging-Setup-<version>.exe`

Generated installer output under `dist-desktop/*` and `electron/build-info.json` is ignored and must not be committed.

## Staging Auto-Update

Staging desktop has a proof-only auto-update path:

- runtime dependency: `electron-updater`;
- provider: generic static URL `https://staging.ax-connect.ru/downloads/desktop/staging/win/`;
- metadata/artifacts: `latest.yml`, `AxConnect-Staging-Setup-<version>.exe`, and `.exe.blockmap`;
- main process enables updater only when the packaged desktop channel is `staging`;
- preload exposes only narrow status/check/install APIs;
- renderer shows a desktop-only account-menu action and requires explicit `Restart and update` after download.
- lifecycle statuses are bounded to `unsupported`, `idle`, `checking`, `available`, `not_available`, `downloading`, `downloaded`, and `error`;
- packaged staging checks run on startup and then every `45` minutes unless a check/download/downloaded update is already in progress;
- manual retry remains available from the account menu after `error` or `not_available`.

Production update publishing is not configured in this segment.

## Native Notifications

The desktop shell exposes a narrow unread-notification bridge through preload:

- renderer calls `window.electron.showUnreadNotification(payload)` only from the existing unread decision path;
- main process validates origin and payload before creating an Electron `Notification`;
- notification click sends a narrow navigation event back to the existing renderer window;
- renderer caches `window.electron.getWindowState()` / `window.electron.onWindowStateChange(...)` so desktop unread decisions know whether the Electron window is focused, visible, or minimized;
- browser web runtime does not call this bridge when `window.electron?.isDesktop` is false.

Windows native notifications require a Start Menu registered AppUserModelID. On `win32`, the main process sets
`app.setAppUserModelId(...)` from the active desktop channel `appId` in `electron/app-config.json` before notifications are
created:

- production: `com.axconnect.desktop`
- staging: `com.axconnect.desktop.staging`

Packaged smoke is required before marking the native notification segment as pass.
On Windows desktop, active-chat notification suppression should only happen when the Electron window is focused, visible, and not minimized.

## Команды

- `bun run dev:desktop` — desktop dev
- `bun run build:desktop` — сборка Windows desktop installer
- `bun run release:desktop` — production desktop release с проверкой конфига
- `bun run start:desktop` — локальный запуск Electron из исходников

## Что уже сделано

- безопасный `preload`
- обработка `axconnect://` deep links
- проброс `session_id` в renderer для будущего desktop auth flow
- разрешения на камеру и микрофон только для origin приложения
