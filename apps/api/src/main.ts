import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 4000;
  const globalPrefix = configService.get<string>('app.globalPrefix') ?? 'api';

  app.useLogger(logger);
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();

  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}/${globalPrefix}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to bootstrap apps/api', error);
  process.exit(1);
});
