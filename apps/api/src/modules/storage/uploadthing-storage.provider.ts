import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';

import type {
  BackendStorageProvider,
  StorageProviderUploadRequest,
  StorageStoredFile,
} from './storage.types';

@Injectable()
export class UploadthingStorageProvider implements BackendStorageProvider {
  readonly kind = 'uploadthing' as const;

  private readonly utapi = new UTApi();

  async uploadFile(request: StorageProviderUploadRequest): Promise<StorageStoredFile> {
    const file = new File([Uint8Array.from(request.buffer)], request.fileName, {
      type: request.contentType,
    });

    const result = await this.utapi.uploadFiles(file, {
      contentDisposition: 'inline',
    });

    if (result.error || !result.data) {
      throw new InternalServerErrorException(result.error?.message ?? 'Upload failed');
    }

    return {
      key: result.data.key,
      name: result.data.name,
      size: result.data.size,
      contentType: request.contentType,
      url: result.data.ufsUrl ?? result.data.url,
      visibility: request.visibility,
      provider: this.kind,
    };
  }
}
