# Desktop (Electron)

## Что это

Desktop-версия работает как безопасная Electron-оболочка поверх существующего web-приложения.

## Dev

- Запуск: `bun run dev:desktop`
- Desktop dev-сервер поднимается на `http://localhost:3005`
- Первой страницей открывается `/sign-in`, чтобы не упираться в защищённый корневой маршрут до авторизации
- При необходимости URL можно переопределить через `ELECTRON_RENDERER_URL`

## Production build

- Укажите URL развернутого приложения в `electron/app-config.json`
- Соберите приложение: `bun run build:desktop`

Пример `electron/app-config.json`:

```json
{
  "productionUrl": "https://your-connect.example.com",
  "initialPath": "/sign-in"
}
```

## Что уже включено

- безопасный `preload`
- поддержка deep link `axconnect://`
- проброс `session_id` в renderer для будущего desktop-auth flow
- разрешения на камеру и микрофон только для origin приложения
