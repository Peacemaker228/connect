import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { STORAGE_PROVIDER } from './storage.constants';
import type {
  BackendStorageProvider,
  StorageUploadEndpoint,
  StorageUploadPolicy,
  UploadedStorageFile,
} from './storage.types';

const MB_IN_BYTES = 1024 * 1024;

const STORAGE_UPLOAD_POLICIES: Record<StorageUploadEndpoint, StorageUploadPolicy> = {
  serverImage: {
    allowedContentTypes: ['image/'],
    folder: 'server-images',
    maxFileSizeBytes: 4 * MB_IN_BYTES,
    visibility: 'public',
  },
  messageFile: {
    allowedContentTypes: ['image/', 'application/pdf'],
    folder: 'message-files',
    maxFileSizeBytes: 4 * MB_IN_BYTES,
    visibility: 'public',
  },
};

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: BackendStorageProvider,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(
    profileId: string | undefined,
    endpoint: string | undefined,
    file: UploadedStorageFile | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const resolvedEndpoint = this.requireUploadEndpoint(endpoint);
    const uploadPolicy = STORAGE_UPLOAD_POLICIES[resolvedEndpoint];
    const resolvedFile = this.requireUploadedFile(file);

    this.ensureAllowedFile(resolvedFile, uploadPolicy);

    const storedFile = await this.storageProvider.uploadFile({
      buffer: resolvedFile.buffer,
      endpoint: resolvedEndpoint,
      fileName: resolvedFile.originalname,
      contentType: resolvedFile.mimetype,
      folder: this.resolveStorageFolder(uploadPolicy.folder),
      profileId: resolvedProfileId,
      size: resolvedFile.size,
      visibility: uploadPolicy.visibility,
    });

    return {
      key: storedFile.key,
      name: storedFile.name,
      size: storedFile.size,
      type: storedFile.contentType,
      url: storedFile.url,
    };
  }

  async deleteFile(
    profileId: string | undefined,
    endpoint: string | undefined,
    fileUrl: string | undefined,
    fileKey?: string | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const resolvedEndpoint = this.requireUploadEndpoint(endpoint);
    const uploadPolicy = STORAGE_UPLOAD_POLICIES[resolvedEndpoint];
    const resolvedFileKey = this.normalizeOptionalString(fileKey);
    const resolvedFileUrl = this.normalizeOptionalString(fileUrl);

    if (!resolvedFileKey && !resolvedFileUrl) {
      throw new HttpException('File key or file URL is required', HttpStatus.BAD_REQUEST);
    }

    await this.storageProvider.deleteFile({
      endpoint: resolvedEndpoint,
      fileKey: resolvedFileKey,
      fileUrl: resolvedFileUrl,
      folder: this.resolveStorageFolder(uploadPolicy.folder),
      profileId: resolvedProfileId,
    });
  }

  private ensureAllowedFile(file: UploadedStorageFile, policy: StorageUploadPolicy) {
    if (!policy.allowedContentTypes.some((contentType) => file.mimetype.startsWith(contentType))) {
      throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
    }

    if (policy.maxFileSizeBytes && file.size > policy.maxFileSizeBytes) {
      throw new HttpException('File is too large', HttpStatus.BAD_REQUEST);
    }
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }

  private requireUploadEndpoint(endpoint: string | undefined): StorageUploadEndpoint {
    if (endpoint === 'messageFile' || endpoint === 'serverImage') {
      return endpoint;
    }

    throw new HttpException('Invalid upload endpoint', HttpStatus.BAD_REQUEST);
  }

  private requireUploadedFile(file: UploadedStorageFile | undefined) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    return file;
  }

  private normalizeOptionalString(value: string | undefined) {
    const resolvedValue = value?.trim();

    return resolvedValue ? resolvedValue : null;
  }

  private resolveStorageFolder(folder: string) {
    const configuredPrefix = this.configService.get<string>('storage.keyPrefix');

    if (!configuredPrefix) {
      return folder;
    }

    return `${configuredPrefix}/${folder}`;
  }
}
