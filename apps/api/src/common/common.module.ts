import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from './config/app.config';
import { AppLoggerService } from './logger/app-logger.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
    }),
  ],
  providers: [AppLoggerService],
  exports: [ConfigModule, AppLoggerService],
})
export class CommonModule {}
