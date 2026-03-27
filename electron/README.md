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

Поэтому для `dev` нужно два процесса:

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
  "productionUrl": "https://your-connect.example.com"
}
```

## Команды

- `bun run dev:desktop` — desktop dev
- `bun run build:desktop` — сборка Windows desktop installer
- `bun run start:desktop` — локальный запуск Electron из исходников

## Что уже сделано

- безопасный `preload`
- обработка `axconnect://` deep links
- проброс `session_id` в renderer для будущего desktop auth flow
- разрешения на камеру и микрофон только для origin приложения
