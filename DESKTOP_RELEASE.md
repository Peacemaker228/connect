# Desktop Release

## Что это за схема

- Web production уже работает на `https://ax-connect.ru`.
- Desktop-приложение — это `Electron`-оболочка, которая использует тот же production web как backend.
- На Ubuntu-сервере не нужно запускать `Electron` как сервис.
- Пользователям нужно только скачать и установить `.exe`.

## Что уже настроено

- В `electron/app-config.json` указан production URL: `https://ax-connect.ru`.
- На фронте ссылка на desktop по умолчанию ведёт на `/downloads/AxConnect-Setup-latest.exe`.
- `nginx` может раздавать installer по адресу `https://ax-connect.ru/downloads/...`.
- Команда `bun run release:desktop` проверяет конфиг и собирает installer.
- Версии в `package.json` и `electron/package.json` должны совпадать.

## Какой формат релизов используем

Храним два файла:

- версионный: `AxConnect-Setup-0.0.2.exe`
- стабильный: `AxConnect-Setup-latest.exe`

Пользователям всегда даём ссылку на `latest`.
Версионный файл нужен для истории и отката.

## Порядок релиза

### 1. Обновить версию

Подними версию в двух файлах:

- `package.json`
- `electron/package.json`

Пример:

- `0.0.1` → `0.0.2`

### 2. Собрать installer

На Windows-машине выполни:

```bash
bun run release:desktop
```

На выходе будет файл:

- `dist-desktop/AxConnect-Setup-<version>.exe`

Пример:

- `dist-desktop/AxConnect-Setup-0.0.2.exe`

### 3. Прогнать быстрый smoke-check

Перед публикацией проверь:

- приложение открывается
- логин работает
- каналы и чаты открываются
- сообщения отправляются
- файлы загружаются
- звонок работает
- микрофон и камера запрашиваются корректно
- в приложении показывается правильная версия

### 4. Залить файл на сервер

Залей версионный файл:

```bash
scp dist-desktop/AxConnect-Setup-0.0.2.exe user@server:/var/www/ax-connect-downloads/
```

Обнови стабильный файл:

```bash
ssh user@server "cp /var/www/ax-connect-downloads/AxConnect-Setup-0.0.2.exe /var/www/ax-connect-downloads/AxConnect-Setup-latest.exe"
```

### 5. Проверить ссылку

Проверь в браузере:

- `https://ax-connect.ru/downloads/AxConnect-Setup-latest.exe`

### 6. Передать ссылку команде

Пользователям даётся одна стабильная ссылка:

- `https://ax-connect.ru/downloads/AxConnect-Setup-latest.exe`

## Настройка `nginx`

Это делается один раз. На каждый новый релиз менять `nginx` не нужно.

Добавь в `server { ... }` блок сайта:

```nginx
location = /downloads/AxConnect-Setup-latest.exe {
    alias /var/www/ax-connect-downloads/AxConnect-Setup-latest.exe;
    default_type application/octet-stream;
    add_header Content-Disposition "attachment";
    add_header Cache-Control "no-store";
    try_files $uri =404;
}

location /downloads/ {
    alias /var/www/ax-connect-downloads/;
    default_type application/octet-stream;
    types {
        application/octet-stream exe;
    }
    add_header Content-Disposition "attachment";
    add_header Cache-Control "no-store";
    try_files $uri =404;
}
```

После изменения конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Папка на сервере

Если её ещё нет:

```bash
sudo mkdir -p /var/www/ax-connect-downloads
```

## Что не нужно делать

- не нужно запускать `Electron` через `pm2` на Ubuntu
- не нужно поднимать отдельный desktop backend
- не нужно менять фронтовую ссылку на каждом релизе
- не нужно править `nginx` на каждом релизе

## Текущий релизный цикл

На практике цикл такой:

1. поднять версию
2. выполнить `bun run release:desktop`
3. залить версионный `.exe`
4. обновить `AxConnect-Setup-latest.exe`
5. проверить ссылку
6. отдать ссылку команде

## Ограничения текущего решения

- пока нет auto-update
- пока нет code signing
- Windows может показывать SmartScreen warning
- desktop зависит от доступности `https://ax-connect.ru`

## Что можно улучшить позже

- автоматизировать upload на сервер
- добавить страницу релизов
- добавить code signing
- добавить auto-update
