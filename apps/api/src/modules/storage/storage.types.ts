export type StorageUploadEndpoint = 'messageFile' | 'serverImage';

export type StorageProviderKind = 's3-compatible';

export type StorageVisibility = 'public' | 'private';

export type UploadedStorageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export interface StorageUploadPolicy {
  allowedContentTypes: readonly string[];
  folder: string;
  maxFileSizeBytes?: number;
  visibility: StorageVisibility;
}

export interface StorageProviderUploadRequest {
  buffer: Buffer;
  contentType: string;
  endpoint: StorageUploadEndpoint;
  fileName: string;
  folder: string;
  profileId: string;
  size: number;
  visibility: StorageVisibility;
}

export interface StorageProviderDeleteRequest {
  endpoint: StorageUploadEndpoint;
  fileKey?: string | null;
  fileUrl?: string | null;
  folder: string;
  profileId: string;
}

export interface StorageStoredFile {
  contentType: string;
  key: string;
  name: string;
  provider: StorageProviderKind;
  size: number;
  url: string;
  visibility: StorageVisibility;
}

export interface BackendStorageProvider {
  readonly kind: StorageProviderKind;
  uploadFile(request: StorageProviderUploadRequest): Promise<StorageStoredFile>;
  deleteFile(request: StorageProviderDeleteRequest): Promise<void>;
}
