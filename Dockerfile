# Базовый образ Node.js
FROM node:20

# Устанавливаем Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы проекта в контейнер
COPY . .

# Передача переменных окружения для сборки
ARG DATABASE_URL
ARG LIVEKIT_API_KEY
ARG LIVEKIT_API_SECRET
ARG NEXT_PUBLIC_LIVEKIT_URL
ARG NEXT_PUBLIC_SITE_URL

# Устанавливаем переменные окружения для процесса сборки
ENV DATABASE_URL=$DATABASE_URL
ENV LIVEKIT_API_KEY=$LIVEKIT_API_KEY
ENV LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Устанавливаем зависимости с помощью Bun
RUN bun install

# Строим приложение Next.js
RUN bun next build

# Экспонируем порт (порт 3000 по умолчанию для Next.js)
EXPOSE 3000

# Команда для запуска приложения
CMD ["bun", "next", "start"]
