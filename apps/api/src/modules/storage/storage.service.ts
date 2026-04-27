import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { STORAGE_PROVIDER } from './storage.constants';
import type {
  BackendStorageProvider,
  ResolvedStorageFileAccess,
  StorageStagedSweepResult,
  StorageUploadEndpoint,
  StorageUploadPolicy,
  UploadedStorageFile,
} from './storage.types';

const MB_IN_BYTES = 1024 * 1024;
const STORAGE_VALUE_PREFIX = 'storage://v1?';

const STORAGE_UPLOAD_POLICIES: Record<StorageUploadEndpoint, StorageUploadPolicy> = {
  serverImage: {
    accessKind: 'backend-redirect',
    allowedContentTypes: ['image/'],
    folder: 'server-images',
    maxFileSizeBytes: 4 * MB_IN_BYTES,
    visibility: 'public',
  },
  messageFile: {
    accessKind: 'backend-redirect',
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
      accessKind: uploadPolicy.accessKind,
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

  async finalizeStoredValue(
    profileId: string | undefined,
    endpoint: StorageUploadEndpoint,
    storedValue: string | null | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const resolvedValue = this.normalizeOptionalString(storedValue ?? undefined);

    if (!resolvedValue || !resolvedValue.startsWith(STORAGE_VALUE_PREFIX)) {
      return resolvedValue ?? storedValue ?? '';
    }

    const uploadPolicy = STORAGE_UPLOAD_POLICIES[endpoint];
    const { fileKey, fileUrl } = this.resolveStoredValueReference(resolvedValue);

    if (!fileKey && !fileUrl) {
      return resolvedValue;
    }

    const finalizedFile = await this.storageProvider.finalizeFile({
      endpoint,
      fileKey,
      fileUrl,
      folder: this.resolveStorageFolder(uploadPolicy.folder),
      profileId: resolvedProfileId,
    });

    return this.serializeStoredValue({
      accessKind: uploadPolicy.accessKind,
      fileKey: finalizedFile.key,
      fileType: finalizedFile.contentType,
      fileUrl: finalizedFile.url,
    });
  }

  async resolveFileAccess(
    endpoint: string | undefined,
    fileUrl: string | undefined,
    fileKey?: string | undefined,
  ): Promise<ResolvedStorageFileAccess> {
    const resolvedEndpoint = this.requireUploadEndpoint(endpoint);
    const uploadPolicy = STORAGE_UPLOAD_POLICIES[resolvedEndpoint];
    const resolvedFileKey = this.normalizeOptionalString(fileKey);
    const resolvedFileUrl = this.normalizeOptionalString(fileUrl);

    if (!resolvedFileKey && !resolvedFileUrl) {
      throw new HttpException('File key or file URL is required', HttpStatus.BAD_REQUEST);
    }

    const resolvedFileAccess = await this.storageProvider.resolveFileAccess({
      endpoint: resolvedEndpoint,
      fileKey: resolvedFileKey,
      fileUrl: resolvedFileUrl,
      folder: this.resolveStorageFolder(uploadPolicy.folder),
    });

    if (resolvedFileAccess.kind !== uploadPolicy.accessKind) {
      throw new HttpException('Storage access policy mismatch', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return resolvedFileAccess;
  }

  async sweepStagedUploads(): Promise<StorageStagedSweepResult> {
    const maxAgeHours = this.configService.get<number>('storage.stagedSweeperMaxAgeHours') ?? 24;
    const maxObjects = this.configService.get<number>('storage.stagedSweeperMaxObjects') ?? 100;
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const folders = Object.values(STORAGE_UPLOAD_POLICIES).map((policy) => this.resolveStorageFolder(policy.folder));

    return this.storageProvider.sweepStagedUploads({
      cutoff,
      folders,
      maxObjects,
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

  private resolveStoredValueReference(value: string) {
    const searchParams = new URLSearchParams(value.slice(STORAGE_VALUE_PREFIX.length));

    return {
      fileKey: this.normalizeOptionalString(searchParams.get('key') ?? undefined),
      fileUrl: this.normalizeOptionalString(searchParams.get('url') ?? undefined),
    };
  }

  private serializeStoredValue({
    accessKind,
    fileKey,
    fileType,
    fileUrl,
  }: {
    accessKind: StorageUploadPolicy['accessKind'];
    fileKey: string;
    fileType: string;
    fileUrl: string;
  }) {
    const searchParams = new URLSearchParams({
      access: accessKind,
      key: fileKey,
      type: fileType,
      url: fileUrl,
    });

    return `${STORAGE_VALUE_PREFIX}${searchParams.toString()}`;
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
