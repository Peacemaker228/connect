import { registerAs } from '@nestjs/config';

const DEFAULT_API_PORT = 4000;
const DEFAULT_GLOBAL_PREFIX = 'api';
const DEFAULT_DEVELOPMENT_CORS_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3005',
];

function parsePort(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCorsAllowedOrigins() {
  const configuredOrigins = parseCsv(
    process.env.API_CORS_ALLOWED_ORIGINS ?? process.env.API_CORS_ORIGINS,
  );

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return DEFAULT_DEVELOPMENT_CORS_ALLOWED_ORIGINS;
  }

  return [];
}

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.API_PORT, DEFAULT_API_PORT),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? DEFAULT_GLOBAL_PREFIX,
  corsAllowedOrigins: getCorsAllowedOrigins(),
}));
