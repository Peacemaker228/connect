---
apply: always
---

# AX Connect — runbook / эксплуатационная документация

## 1. Назначение документа

Этот документ нужен, чтобы любой разработчик или инженер, получив доступ к проекту, мог:

- понять, как устроен сервис;
- понять, где что находится;
- поднять, обновить и проверить приложение;
- не сломать production при работе с конфигами и секретами.

Документ составлен по текущему фактическому состоянию проекта и инфраструктуры.

---

## 2. Что это за сервис

AX Connect — это веб-приложение на Next.js, которое сейчас развернуто на отдельном Ubuntu-сервере.

На практике в проекте используются:

- Next.js 14
- React
- Bun для установки зависимостей и сборки
- PM2 для запуска production-процесса
- Nginx как reverse proxy и SSL-терминация
- MySQL как база данных
- Prisma ORM
- backend-owned auth для авторизации
- managed-cloud `S3-compatible` storage для загрузки файлов
- LiveKit Cloud для аудио/видео-конференций

---

## 3. Домен и основные адреса

### Основной домен приложения
- https://ax-connect.ru

### Дополнительный домен
- https://www.ax-connect.ru

Желательно использовать основной домен:
- https://ax-connect.ru

### LiveKit
Используется LiveKit Cloud, а не self-hosted LiveKit.

Текущий public URL LiveKit:
- wss://ax-connect-l8vtv34h.livekit.cloud

---

## 4. Архитектура в одном абзаце

Пользователь заходит в браузере на `ax-connect.ru`.

Дальше запросы идут так:

1. Nginx принимает HTTPS на сервере
2. Nginx проксирует приложение на локальный Next.js процесс
3. Next.js запущен через PM2
4. Приложение использует:
   - backend-owned auth flow для auth
   - managed-cloud `S3-compatible` storage для хранения файлов
   - LiveKit Cloud для конференций
   - MySQL + Prisma для данных

---

## 5. Где находится проект на сервере

Корень проекта на сервере:

```bash
/var/www/ax-connect
```

Там лежат:
- исходники приложения
- package.json
- next.config.mjs
- ecosystem.config.cjs
- env-файлы
- node_modules
- .next
- prisma

---

## 6. Текущая схема запуска

Приложение работает без Docker.

### Production-стек
- Bun — установка пакетов и сборка
- PM2 — запуск приложения
- Nginx — reverse proxy и HTTPS

### PM2
Имя процесса:
- ax-connect

Запуск идёт через PM2 ecosystem config.

---

## 7. Основные скрипты проекта

Актуальные ключевые скрипты:

- `dev`
- `build:web`
- `build:server`
- `build`
- `start:web`
- `start:back`
- `prisma:generate`
- `prisma:migrate`
- `prisma:migrate:deploy`
- `prisma:dbpush`

Для текущего production-сценария фронта главное:

```bash
bun install
bun run build:web
pm2 restart ax-connect
```

---

## 8. Переменные окружения

## Важно
Секреты не должны храниться в репозитории.

Рекомендуемая схема:
- локально: `.env.local`
- production: `.env.production` или серверный `.env`
- в репозитории: только `.env.example`

### Ключевые переменные

#### Auth
- repo-level `CLERK_*` переменные больше не используются
- текущий runtime использует backend-owned auth flow и cookie-session path
- если в окружении остались старые `NEXT_PUBLIC_CLERK_*` или `CLERK_SECRET_KEY`, их нужно удалить как legacy leftovers

#### LiveKit
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

#### Storage
- `STORAGE_BUCKET`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_PUBLIC_BASE_URL`
- optional `STORAGE_S3_REGION`
- optional `STORAGE_S3_FORCE_PATH_STYLE`
- optional `STORAGE_KEY_PREFIX`

#### Prisma / MySQL
- `DATABASE_URL`

Пример:
```env
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DB_NAME
```

#### Прочее
- `NODE_ENV`
- `PORT`

---

## 9. Auth — как устроен сейчас

Сейчас активный runtime auth path backend-owned.

### Важные моменты
- browser/runtime auth больше не зависит от `Clerk` как активного provider path
- session/profile resolution идет через backend auth boundary
- browser auth использует backend cookie-session flow

### В приложении
- frontend работает через локальные auth entrypoints и backend auth session snapshot
- repo-level `ClerkProvider` / `proxyUrl` wiring больше не является текущим source of truth

### На Nginx
- отдельный `Clerk` proxy path `/__clerk/` больше не нужен как обязательная часть текущего auth runtime
- актуальнее держать корректный proxy до основного web/backend runtime

---

## 10. Storage — текущее состояние

Текущий active path больше не использует `UploadThing`.

Сейчас проект работает так:
- browser/runtime идет в backend-owned upload path
- backend управляет storage boundary
- активный provider — managed-cloud `S3-compatible` storage
- чтение файлов остается `public` и идет через backend-owned `backend-redirect` path

### Что проверить
- `STORAGE_BUCKET`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_PUBLIC_BASE_URL`
- backend upload/access routes
- отображение файлов после загрузки

### Примечание
Исторические `UploadThing` URL могут еще встречаться в старых данных как legacy compatibility, но это уже не active runtime dependency.

---

## 11. LiveKit — текущее состояние

Используется LiveKit Cloud.

### Важно
Это не self-hosted инстанс.

Текущий URL:
```env
NEXT_PUBLIC_LIVEKIT_URL="wss://ax-connect-l8vtv34h.livekit.cloud"
```

### Что уже выяснено
- С VPN соединение работает лучше
- Без VPN у части пользователей соединение может деградировать
- По тестам с VPN трафик шёл в регион Germany 2
- Без VPN трафик уходил в Japan
- На Build плане LiveKit нет region pinning
- Region pinning доступен только на Scale plan или выше

### Практический вывод
Проблема с видео/аудио, скорее всего, связана не с кодом фронта, а с маршрутизацией/региональным доступом до LiveKit Cloud.

### Что можно сделать
- использовать VPN как временный workaround
- перейти на платный план LiveKit и запросить EU region pinning
- отказаться от модуля LiveKit
- позже рассмотреть self-hosted альтернативу

---

## 12. База данных и Prisma

Используется MySQL и Prisma.

### Что важно
- production БД находится на том же сервере
- Prisma использует `DATABASE_URL`

### Полезные команды

#### Генерация клиента
```bash
bun run prisma:generate
```

#### Применение миграций
```bash
bun run prisma:migrate:deploy
```

#### Быстрое пуш-синхронизирование схемы
```bash
bun run prisma:dbpush
```

### Важно
`db push` — быстрый инструмент, но не лучший долгосрочный production workflow.

---

## 13. Nginx

Конфиг сайта находится примерно здесь:

```bash
/etc/nginx/sites-available/ax-connect
```

Активируется через:

```bash
/etc/nginx/sites-enabled/ax-connect
```

### Что делает Nginx
- принимает HTTPS
- отдает SSL
- проксирует приложение на `127.0.0.1:3000`
- отдельный Clerk proxy path `/__clerk/` для текущего auth runtime больше не обязателен

### После правок Nginx
Всегда выполнять:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 14. PM2

### Проверка статуса
```bash
pm2 status
```

### Логи
```bash
pm2 logs ax-connect
```

### Перезапуск
```bash
pm2 restart ax-connect
```

### Сохранение процессов
```bash
pm2 save
```

---

## 15. Как деплоить изменения

### Стандартная последовательность

```bash
cd /var/www/ax-connect
git pull
bun install
rm -rf .next
bun run build:web
pm2 restart ax-connect
```

### Что делать после изменения env
Если менялись:
- `NEXT_PUBLIC_*`
- LiveKit public URL

то нужен полный rebuild, потому что `NEXT_PUBLIC_*` встраиваются в клиентский bundle на этапе сборки.

---

## 16. Как запускать локально

Рекомендуемый локальный сценарий:

- использовать локальный backend auth flow
- не смешивать локальные auth cookies/session с production окружением

### Локальный env
Лучше хранить в `.env.local`.

### Важно
Локально не должно быть legacy `CLERK_*` переменных, если они остались в старом env-файле.

### Локальный старт
```bash
next dev -p 3000
```

или через bun-скрипты, если так принято в проекте.

---

## 17. Что проверять при проблемах

### Если сайт не открывается
Проверить:
```bash
pm2 status
pm2 logs ax-connect
sudo nginx -t
sudo systemctl status nginx
```

### Если auth ломается
Проверить:
- `/api/auth/session`
- backend auth cookies
- browser network/errors around login/register/refresh
- cookies / incognito
- что локалка не использует production auth env/secrets

### Если файлы не грузятся
Проверить:
- storage env (`STORAGE_*`)
- route server upload
- ошибки в browser network
- домены картинок в `next.config.mjs`

### Если видео/аудио не работает
Проверить:
- `NEXT_PUBLIC_LIVEKIT_URL`
- доступность LiveKit Cloud из конкретной сети
- работоспособность с VPN / без VPN
- LiveKit connection test

---

## 18. Что не хранить в git

Нельзя хранить в репозитории:
- production auth secrets
- production DB password
- storage access keys / secrets
- LiveKit API secret
- любые боевые ключи и токены

В репозитории должен быть только безопасный шаблон:
- `.env.example`

---

## 19. Что желательно сделать позже

### Инфраструктурно
- привести env-файлы к чистой схеме:
  - `.env.local`
  - `.env.production`
  - `.env.example`
- задокументировать точные пути и резервное копирование БД
- описать регулярный backup MySQL
- привести Prisma workflow к нормальной migration strategy

### По продукту
- решить судьбу модуля LiveKit
- если LiveKit остается:
  - либо платный план с region pinning
  - либо self-hosted
  - либо другой провайдер

### По UX
- нормализовать ошибки загрузки файлов
- привести к единой схеме auth / upload / media diagnostics

---

## 20. Краткий operational cheat sheet

### Проверка сайта
```bash
curl -I https://ax-connect.ru
```

### Перезапуск приложения
```bash
cd /var/www/ax-connect
bun run build:web
pm2 restart ax-connect
```

### Логи приложения
```bash
pm2 logs ax-connect
```

### Логи Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Проверка Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Проверка MySQL
```bash
mysql -u root -p
```

---

## 21. Финальный смысл

Сервис уже можно сопровождать и развивать, если понимать 4 ключевых вещи:

1. Next.js + PM2 + Nginx — это основа веб-приложения
2. backend-owned auth отвечает за auth и требует аккуратного разделения local/prod
3. managed-cloud `S3-compatible` storage теперь идет через backend-owned storage boundary
4. LiveKit Cloud сейчас является самым нестабильным внешним модулем из-за регионально-сетевой зависимости

Если новый человек получает этот документ, он должен начинать не с «переписывать всё», а с понимания:
- где проект,
- как он запускается,
- где env,
- как перезапустить,
- какие внешние сервисы реально критичны.
