import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  BackendStorageProvider,
  StorageProviderUploadRequest,
  StorageStoredFile,
} from './storage.types';

const DEFAULT_S3_REGION = 'auto';

type ResolvedS3CompatibleConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
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

  private buildObjectKey(folder: string, fileName: string) {
    const { baseName, extension } = sanitizeFileNamePart(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    return `${folder}/${datePrefix}/${randomUUID()}-${baseName}${extension}`;
  }

  private createPublicUrl(publicBaseUrl: string, objectKey: string) {
    return `${publicBaseUrl}/${encodeStorageKey(objectKey)}`;
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

  private getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unknown storage error';
  }

  private requireConfigValue(configKey: string) {
    const value = this.configService.get<string>(configKey)?.trim();

    if (!value) {
      throw new InternalServerErrorException(`Missing required storage config: ${configKey}`);
    }

    return value;
  }
}
