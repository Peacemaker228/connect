import { registerAs } from '@nestjs/config';

const DEFAULT_API_PORT = 4000;
const DEFAULT_GLOBAL_PREFIX = 'api';

function parsePort(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.API_PORT ?? process.env.PORT, DEFAULT_API_PORT),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? DEFAULT_GLOBAL_PREFIX,
}));
