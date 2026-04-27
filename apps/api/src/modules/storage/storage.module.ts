import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { S3CompatibleStorageProvider } from './s3-compatible-storage.provider';
import { STORAGE_PROVIDER } from './storage.constants';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    S3CompatibleStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService, s3CompatibleStorageProvider: S3CompatibleStorageProvider) => {
        const activeProvider = configService.get<string>('storage.activeProvider') ?? 's3-compatible';

        if (activeProvider === 's3-compatible') {
          return s3CompatibleStorageProvider;
        }

        throw new Error(
          `Unsupported storage provider: ${activeProvider}. The UploadThing compatibility provider is disabled; use s3-compatible storage.`,
        );
      },
      inject: [ConfigService, S3CompatibleStorageProvider],
    },
  ],
  exports: [StorageService, STORAGE_PROVIDER],
})
export class StorageModule {}
