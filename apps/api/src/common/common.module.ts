import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from './config/app.config';
import { PrismaService } from './database/prisma.service';
import { AppLoggerService } from './logger/app-logger.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env.production', '.env'],
      load: [appConfig],
    }),
  ],
  providers: [AppLoggerService, PrismaService],
  exports: [ConfigModule, AppLoggerService, PrismaService],
})
export class CommonModule {}
