import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  BackendStorageProvider,
  StorageProviderFinalizeRequest,
  ResolvedStorageFileAccess,
  StorageProviderDeleteRequest,
  StorageProviderResolveAccessRequest,
  StorageProviderSweepStagedRequest,
  StorageProviderUploadRequest,
  StorageStagedSweepResult,
  StorageStoredFile,
} from './storage.types';

const DEFAULT_S3_REGION = 'auto';
const LEGACY_READ_HOSTS = ['utfs.io', 'ufs.sh'];
const STAGED_UPLOAD_STATE = 'staged';

type ResolvedS3CompatibleConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
};

type S3ObjectDetails = {
  cacheControl: string | null;
  contentDisposition: string | null;
  contentLength: number;
  contentType: string;
  key: string;
  metadata: Record<string, string>;
};

const encodeStorageKey = (key: string) => {
  return key
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};

const sanitizeFileNamePart = (fileName: string) => {
  const extension = extname(fileName).toLowerCase();
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  const normalizedBaseName = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return {
    extension,
    baseName: normalizedBaseName || 'file',
  };
};

@Injectable()
export class S3CompatibleStorageProvider implements BackendStorageProvider {
  readonly kind = 's3-compatible' as const;

  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(request: StorageProviderUploadRequest): Promise<StorageStoredFile> {
    if (request.visibility !== 'public') {
      throw new BadRequestException('Only public storage visibility is supported');
    }

    const config = this.getResolvedConfig();
    const objectKey = this.buildObjectKey(request.folder, request.fileName);

    try {
      await this.getClient(config).send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          Body: request.buffer,
          ContentDisposition: 'inline',
          ContentType: request.contentType,
          CacheControl: 'public, max-age=31536000, immutable',
          Metadata: {
            endpoint: request.endpoint,
            profileid: request.profileId,
            stagedat: new Date().toISOString(),
            uploadstate: STAGED_UPLOAD_STATE,
          },
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `S3-compatible upload failed: ${this.getErrorMessage(error)}`,
      );
    }

    return {
      key: objectKey,
      name: request.fileName,
      size: request.size,
      contentType: request.contentType,
      url: this.createPublicUrl(config.publicBaseUrl, objectKey),
      visibility: request.visibility,
      provider: this.kind,
    };
  }

  async deleteFile(request: StorageProviderDeleteRequest): Promise<void> {
    const config = this.getResolvedConfig();
    const objectKey =
      request.fileKey?.trim() || this.resolveObjectKeyFromPublicUrl(config.publicBaseUrl, request.fileUrl);

    this.ensureAllowedFolder(objectKey, request.folder);

    const objectOwnerProfileId = await this.getObjectOwnerProfileId(config, objectKey);

    if (!objectOwnerProfileId) {
      return;
    }

    if (objectOwnerProfileId !== request.profileId) {
      throw new ForbiddenException('Cannot delete another profile file');
    }

    try {
      await this.getClient(config).send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `S3-compatible delete failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async finalizeFile(request: StorageProviderFinalizeRequest): Promise<StorageStoredFile> {
    const config = this.getResolvedConfig();
    const objectKey =
      request.fileKey?.trim() || this.resolveObjectKeyFromPublicUrl(config.publicBaseUrl, request.fileUrl);

    this.ensureAllowedFolder(objectKey, request.folder);

    const objectDetails = await this.getObjectDetails(config, objectKey);

    if (!objectDetails) {
      throw new BadRequestException('Storage file not found');
    }

    if (objectDetails.metadata.profileid && objectDetails.metadata.profileid !== request.profileId) {
      throw new ForbiddenException('Cannot finalize another profile file');
    }

    if (objectDetails.metadata.uploadstate === STAGED_UPLOAD_STATE) {
      try {
        await this.getClient(config).send(
          new CopyObjectCommand({
            Bucket: config.bucket,
            Key: objectKey,
            CopySource: `${config.bucket}/${encodeStorageKey(objectKey)}`,
            MetadataDirective: 'REPLACE',
            ContentType: objectDetails.contentType,
            CacheControl: objectDetails.cacheControl ?? 'public, max-age=31536000, immutable',
            ContentDisposition: objectDetails.contentDisposition ?? 'inline',
            Metadata: this.buildCommittedMetadata(objectDetails.metadata),
          }),
        );
      } catch (error) {
        throw new InternalServerErrorException(
          `S3-compatible finalize failed: ${this.getErrorMessage(error)}`,
        );
      }
    }

    return {
      key: objectKey,
      name: basename(objectKey),
      size: objectDetails.contentLength,
      contentType: objectDetails.contentType,
      url: this.createPublicUrl(config.publicBaseUrl, objectKey),
      visibility: 'public',
      provider: this.kind,
    };
  }

  async resolveFileAccess(
    request: StorageProviderResolveAccessRequest,
  ): Promise<ResolvedStorageFileAccess> {
    const config = this.getResolvedConfig();
    const normalizedFileKey = request.fileKey?.trim();

    if (normalizedFileKey) {
      this.ensureAllowedFolder(normalizedFileKey, request.folder);

      return {
        kind: 'backend-redirect',
        upstream: 'public-url',
        isLegacyCompatibility: false,
        provider: this.kind,
        visibility: 'public',
        url: this.createPublicUrl(config.publicBaseUrl, normalizedFileKey),
      };
    }

    const legacyFileUrl = request.fileUrl?.trim();

    if (!legacyFileUrl) {
      throw new BadRequestException('Storage file URL is required when the file key is missing');
    }

    try {
      const resolvedObjectKey = this.resolveObjectKeyFromPublicUrl(config.publicBaseUrl, legacyFileUrl);

      this.ensureAllowedFolder(resolvedObjectKey, request.folder);

      return {
        kind: 'backend-redirect',
        upstream: 'public-url',
        isLegacyCompatibility: false,
        provider: this.kind,
        visibility: 'public',
        url: this.createPublicUrl(config.publicBaseUrl, resolvedObjectKey),
      };
    } catch (error) {
      if (error instanceof BadRequestException && this.isAllowedLegacyReadUrl(legacyFileUrl)) {
        return {
          kind: 'backend-redirect',
          upstream: 'public-url',
          isLegacyCompatibility: true,
          provider: this.kind,
          visibility: 'public',
          url: legacyFileUrl,
        };
      }

      throw error;
    }
  }

  async sweepStagedUploads(request: StorageProviderSweepStagedRequest): Promise<StorageStagedSweepResult> {
    const config = this.getResolvedConfig();
    let deletedObjects = 0;
    let keptObjects = 0;
    let scannedObjects = 0;
    let remainingObjects = request.maxObjects;

    for (const folder of request.folders) {
      if (remainingObjects <= 0) {
        break;
      }

      let continuationToken: string | undefined;

      do {
        const listedObjects = await this.listFolderObjects(config, folder, remainingObjects, continuationToken);
        continuationToken = listedObjects.NextContinuationToken;

        for (const object of listedObjects.Contents ?? []) {
          if (remainingObjects <= 0) {
            break;
          }

          if (!object.Key || !object.LastModified || object.LastModified > request.cutoff) {
            continue;
          }

          const objectDetails = await this.getObjectDetails(config, object.Key);

          if (!objectDetails) {
            continue;
          }

          scannedObjects += 1;
          remainingObjects -= 1;

          if (objectDetails.metadata.uploadstate !== STAGED_UPLOAD_STATE) {
            keptObjects += 1;
            continue;
          }

          if (!this.isStagedObjectExpired(objectDetails.metadata.stagedat, request.cutoff)) {
            keptObjects += 1;
            continue;
          }

          await this.deleteObject(config, object.Key);
          deletedObjects += 1;
        }
      } while (continuationToken && remainingObjects > 0);
    }

    return {
      deletedObjects,
      keptObjects,
      scannedObjects,
    };
  }

  private buildObjectKey(folder: string, fileName: string) {
    const { baseName, extension } = sanitizeFileNamePart(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    return `${folder}/${datePrefix}/${randomUUID()}-${baseName}${extension}`;
  }

  private createPublicUrl(publicBaseUrl: string, objectKey: string) {
    return `${publicBaseUrl}/${encodeStorageKey(objectKey)}`;
  }

  private ensureAllowedFolder(objectKey: string, folder: string) {
    if (objectKey === folder || objectKey.startsWith(`${folder}/`)) {
      return;
    }

    throw new BadRequestException('Storage file does not belong to the requested upload endpoint');
  }

  private getClient(config: ResolvedS3CompatibleConfig) {
    if (!this.client) {
      this.client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }

    return this.client;
  }

  private buildCommittedMetadata(metadata: Record<string, string>) {
    const committedMetadata: Record<string, string> = {};

    Object.entries(metadata).forEach(([key, value]) => {
      if (!value || key === 'uploadstate' || key === 'stagedat') {
        return;
      }

      committedMetadata[key] = value;
    });

    return committedMetadata;
  }

  private getResolvedConfig(): ResolvedS3CompatibleConfig {
    const accessKeyId = this.requireConfigValue('storage.s3AccessKeyId');
    const secretAccessKey = this.requireConfigValue('storage.s3SecretAccessKey');
    const bucket = this.requireConfigValue('storage.bucket');
    const endpoint = this.requireConfigValue('storage.s3Endpoint');
    const publicBaseUrl = this.requireConfigValue('storage.publicBaseUrl');
    const region = this.configService.get<string>('storage.s3Region') ?? DEFAULT_S3_REGION;
    const forcePathStyle = this.configService.get<boolean>('storage.s3ForcePathStyle') ?? false;

    return {
      accessKeyId,
      secretAccessKey,
      bucket,
      endpoint,
      publicBaseUrl,
      region,
      forcePathStyle,
    };
  }

  private async getObjectOwnerProfileId(config: ResolvedS3CompatibleConfig, objectKey: string) {
    try {
      const result = await this.getClient(config).send(
        new HeadObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
        }),
      );

      return result.Metadata?.profileid ?? null;
    } catch (error) {
      if (this.isMissingObjectError(error)) {
        return null;
      }

      throw new InternalServerErrorException(
        `S3-compatible ownership check failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async getObjectDetails(config: ResolvedS3CompatibleConfig, objectKey: string): Promise<S3ObjectDetails | null> {
    try {
      const result = await this.getClient(config).send(
        new HeadObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
        }),
      );

      return {
        key: objectKey,
        metadata: result.Metadata ?? {},
        contentDisposition: result.ContentDisposition ?? null,
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? 'application/octet-stream',
        cacheControl: result.CacheControl ?? null,
      };
    } catch (error) {
      if (this.isMissingObjectError(error)) {
        return null;
      }

      throw new InternalServerErrorException(
        `S3-compatible object read failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private isStagedObjectExpired(stagedAt: string | undefined, cutoff: Date) {
    if (!stagedAt) {
      return true;
    }

    const stagedAtTime = Date.parse(stagedAt);

    if (Number.isNaN(stagedAtTime)) {
      return true;
    }

    return stagedAtTime <= cutoff.getTime();
  }

  private async listFolderObjects(
    config: ResolvedS3CompatibleConfig,
    folder: string,
    maxObjects: number,
    continuationToken?: string,
  ) {
    try {
      return await this.getClient(config).send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          Prefix: `${folder}/`,
          ContinuationToken: continuationToken,
          MaxKeys: maxObjects,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `S3-compatible staged sweep list failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async deleteObject(config: ResolvedS3CompatibleConfig, objectKey: string) {
    try {
      await this.getClient(config).send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `S3-compatible staged sweep delete failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unknown storage error';
  }

  private isMissingObjectError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorName = 'name' in error ? error.name : undefined;
    const httpStatusCode =
      '$metadata' in error &&
      error.$metadata &&
      typeof error.$metadata === 'object' &&
      'httpStatusCode' in error.$metadata
        ? error.$metadata.httpStatusCode
        : undefined;

    return errorName === 'NotFound' || errorName === 'NoSuchKey' || httpStatusCode === 404;
  }

  private isAllowedLegacyReadUrl(fileUrl: string) {
    try {
      const resolvedUrl = new URL(fileUrl);
      const normalizedHostname = resolvedUrl.hostname.toLowerCase();

      if (resolvedUrl.protocol !== 'https:' && resolvedUrl.protocol !== 'http:') {
        return false;
      }

      return LEGACY_READ_HOSTS.some(
        (allowedHost) => normalizedHostname === allowedHost || normalizedHostname.endsWith(`.${allowedHost}`),
      );
    } catch {
      return false;
    }
  }

  private resolveObjectKeyFromPublicUrl(publicBaseUrl: string, fileUrl: string | null | undefined) {
    try {
      if (!fileUrl) {
        throw new BadRequestException('Storage file URL is required when the file key is missing');
      }

      const resolvedPublicBaseUrl = new URL(publicBaseUrl);
      const resolvedFileUrl = new URL(fileUrl);

      if (resolvedPublicBaseUrl.origin !== resolvedFileUrl.origin) {
        throw new BadRequestException('Storage file host does not match the active storage public URL');
      }

      const basePathname = resolvedPublicBaseUrl.pathname.replace(/\/+$/g, '');
      const objectPathname = decodeURIComponent(resolvedFileUrl.pathname);

      if (basePathname && !objectPathname.startsWith(`${basePathname}/`)) {
        throw new BadRequestException('Storage file path is outside of the configured public base URL');
      }

      const keyPathname = basePathname ? objectPathname.slice(basePathname.length + 1) : objectPathname.slice(1);
      const objectKey = keyPathname.replace(/^\/+/, '');

      if (!objectKey) {
        throw new BadRequestException('Storage file key is empty');
      }

      return objectKey;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid storage file URL');
    }
  }

  private requireConfigValue(configKey: string) {
    const value = this.configService.get<string>(configKey)?.trim();

    if (!value) {
      throw new InternalServerErrorException(`Missing required storage config: ${configKey}`);
    }

    return value;
  }
}
