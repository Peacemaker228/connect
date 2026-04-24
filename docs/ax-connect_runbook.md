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
- Clerk для авторизации
- UploadThing для загрузки файлов
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
   - Clerk production для auth
   - UploadThing для хранения файлов
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

#### Clerk
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

#### Clerk proxy
- `NEXT_PUBLIC_CLERK_PROXY_URL`

Production-значение:
```env
NEXT_PUBLIC_CLERK_PROXY_URL=/__clerk
```

Локально эту переменную лучше не задавать, если используется test/dev Clerk.

#### LiveKit
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

#### UploadThing
- `UPLOADTHING_TOKEN`

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

## 9. Clerk — как устроен сейчас

Сейчас используется production Clerk instance.

### Важные моменты
- production auth работает через домен приложения
- включен proxy-сценарий через:
  - `https://ax-connect.ru/__clerk`

### В приложении
В `ClerkProvider` используется `proxyUrl`, желательно через env.

### На Nginx
Для production proxy используется отдельный блок `location /__clerk/`, который проксирует запросы Clerk Frontend API.

### Важно
Ключи Clerk должны быть парой из одного и того же instance:
- `pk_live_...`
- `sk_live_...`

Иначе будут ошибки:
- invalid secret
- keys do not match
- redirect loop

---

## 10. UploadThing — текущее состояние

Изначально использовался стандартный client-side UploadThing flow через `UploadDropzone`, где браузер отправляет файл напрямую в ingest UploadThing.

В некоторых сетях это работало нестабильно без VPN.

### Что сделано
Добавлен server-side upload fallback:
- браузер отправляет файл на наш API route
- сервер загружает файл в UploadThing через `UTApi.uploadFiles()`

Это уменьшает зависимость от прямого доступа клиента к ingest UploadThing.

### Что проверить
- `UPLOADTHING_TOKEN`
- route для server upload
- отображение файлов после загрузки

### Дополнительно
Если картинки не отображаются через `next/image`, нужно проверить `next.config.mjs` и `remotePatterns` для UploadThing CDN-доменов.

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
- проксирует Clerk proxy path `/__clerk/`

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
- Clerk public config
- LiveKit public URL

то нужен полный rebuild, потому что `NEXT_PUBLIC_*` встраиваются в клиентский bundle на этапе сборки.

---

## 16. Как запускать локально

Рекомендуемый локальный сценарий:

- использовать test/dev Clerk
- не использовать production proxy
- не использовать production live keys Clerk

### Локальный env
Лучше хранить в `.env.local`.

### Важно
Локально не должно быть production-переменных вроде:
```env
NEXT_PUBLIC_CLERK_PROXY_URL=/__clerk
```

иначе локальный `localhost` начнет стучаться в production `ax-connect.ru/__clerk`.

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
- `pk_live` / `sk_live`
- Clerk proxy URL
- Nginx location `/__clerk/`
- cookies / incognito
- что локалка не использует production proxy

### Если файлы не грузятся
Проверить:
- `UPLOADTHING_TOKEN`
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
- production Clerk secret
- production DB password
- UploadThing token
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
2. Clerk отвечает за auth и требует аккуратного разделения local/prod
3. UploadThing лучше иметь с server-side fallback
4. LiveKit Cloud сейчас является самым нестабильным внешним модулем из-за регионально-сетевой зависимости

Если новый человек получает этот документ, он должен начинать не с «переписывать всё», а с понимания:
- где проект,
- как он запускается,
- где env,
- как перезапустить,
- какие внешние сервисы реально критичны.
