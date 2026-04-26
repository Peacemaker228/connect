import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { S3CompatibleStorageProvider } from './s3-compatible-storage.provider';
import { STORAGE_PROVIDER } from './storage.constants';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { UploadthingStorageProvider } from './uploadthing-storage.provider';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    S3CompatibleStorageProvider,
    UploadthingStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        s3CompatibleStorageProvider: S3CompatibleStorageProvider,
        uploadthingStorageProvider: UploadthingStorageProvider,
      ) => {
        const activeProvider = configService.get<string>('storage.activeProvider') ?? 's3-compatible';

        if (activeProvider === 's3-compatible') {
          return s3CompatibleStorageProvider;
        }

        if (activeProvider === 'uploadthing') {
          return uploadthingStorageProvider;
        }

        throw new Error(`Unsupported storage provider: ${activeProvider}`);
      },
      inject: [ConfigService, S3CompatibleStorageProvider, UploadthingStorageProvider],
    },
  ],
  exports: [StorageService, STORAGE_PROVIDER],
})
export class StorageModule {}
