# Desktop Release

## Цель

Простой production-процесс для desktop-версии без автообновлений и без отдельной desktop-инфраструктуры.

Текущая схема:

- production web уже работает на `https://ax-connect.ru`
- desktop-приложение использует этот же production web как backend
- пользователи скачивают `.exe` и запускают его локально на Windows

## Как это работает

Desktop build не запускается на Ubuntu-сервере как сервис.

Ubuntu-сервер нужен только для web-приложения:

- `Nginx`
- `PM2`
- `Next.js`
- `Clerk`
- `Prisma / DB`
- `UploadThing`
- `LiveKit`

Electron нужен только как клиентская desktop-оболочка.

## Что нужно один раз

Проверить `electron/app-config.json`:

```json
{
  "productionUrl": "https://ax-connect.ru"
}
```

## Релизный процесс

### 1. Поднять версию

Перед релизом обновить версию в:

- `package.json`
- `electron/package.json`

Версии должны совпадать. Это также проверяется командой `bun run release:desktop`.

Минимальная схема версий:

- `0.0.1`
- `0.0.2`
- `0.0.3`

### 2. Собрать desktop release

На Windows-машине выполнить:

```bash
bun run release:desktop
```

Что делает команда:

- проверяет `electron/app-config.json`
- собирает Windows installer

Результат:

- `dist-desktop/AxConnect-Setup-<version>.exe`

### 3. Smoke test перед рассылкой

Минимально проверить:

- приложение открывается
- логин работает
- открываются серверы и каналы
- отправляются сообщения
- работают файлы
- работают микрофон и камера
- подключается звонок

### 4. Выложить installer

Самый простой вариант — отдавать его с существующего сервера.

Пример стабильного URL:

- `https://ax-connect.ru/downloads/AxConnect-Setup-latest.exe`

Именно этот URL удобно использовать на фронте, чтобы не менять ссылку при каждом релизе.

## Простой вариант публикации на сервере

### Вариант A — отдельная папка на сервере

Например:

```bash
sudo mkdir -p /var/www/ax-connect-downloads
```

Загрузка файла:

```bash
scp dist-desktop/AxConnect-Setup-0.0.1.exe user@server:/var/www/ax-connect-downloads/
```

Обновление стабильной ссылки:

```bash
scp dist-desktop/AxConnect-Setup-0.0.1.exe user@server:/var/www/ax-connect-downloads/AxConnect-Setup-latest.exe
```

Пример Nginx location:

```nginx
location /downloads/ {
    alias /var/www/ax-connect-downloads/;
    types {
        application/octet-stream exe;
    }
    add_header Content-Disposition attachment;
}
```

После изменения:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант B — любое файловое хранилище

Можно временно выкладывать `.exe` в S3, Google Drive, Яндекс Диск или другой внутренний storage.

## Что давать тестировщикам

- ссылку на `.exe`
- короткую инструкцию по установке
- список, что проверить

Пример инструкции:

1. Скачать installer
2. Установить приложение
3. Если Windows покажет предупреждение, нажать "Подробнее" → "Все равно выполнить"
4. Войти в приложение и пройти smoke-check

## Когда выпускать новый релиз

При любом наборе desktop-изменений:

1. поднять версию
2. собрать новый `.exe`
3. перезалить файл
4. отправить новую ссылку команде

Если используется стабильный URL `AxConnect-Setup-latest.exe`, ссылка для пользователей не меняется.

## Ограничения текущего простого варианта

- нет автообновлений
- нет code signing
- Windows может показывать SmartScreen warning
- desktop зависит от доступности `https://ax-connect.ru`

## Следующий этап улучшения

Когда простой вариант подтвердится на тестах, следующий логичный шаг:

- добавить страницу скачивания на сайте
- автоматизировать выпуск installer
- добавить code signing
- позже добавить auto-update
