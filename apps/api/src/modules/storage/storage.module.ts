import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { STORAGE_PROVIDER } from './storage.constants';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { UploadthingStorageProvider } from './uploadthing-storage.provider';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    UploadthingStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        uploadthingStorageProvider: UploadthingStorageProvider,
      ) => {
        const activeProvider = configService.get<string>('storage.activeProvider') ?? 'uploadthing';

        if (activeProvider === 'uploadthing') {
          return uploadthingStorageProvider;
        }

        throw new Error(`Unsupported storage provider: ${activeProvider}`);
      },
      inject: [ConfigService, UploadthingStorageProvider],
    },
  ],
  exports: [StorageService, STORAGE_PROVIDER],
})
export class StorageModule {}
