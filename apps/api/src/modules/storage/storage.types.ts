export type StorageUploadEndpoint = 'messageFile' | 'serverImage';

export type StorageProviderKind = 's3-compatible';

export type StorageVisibility = 'public' | 'private';
export type StorageFileAccessKind = 'backend-redirect' | 'signed-url' | 'proxy-stream';
export type StorageFileAccessUpstream = 'public-url' | 'signed-url' | 'backend-stream';

export type UploadedStorageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export interface StorageUploadPolicy {
  accessKind: StorageFileAccessKind;
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

export interface StorageProviderFinalizeRequest {
  endpoint: StorageUploadEndpoint;
  fileKey?: string | null;
  fileUrl?: string | null;
  folder: string;
  profileId: string;
}

export interface StorageProviderResolveAccessRequest {
  endpoint: StorageUploadEndpoint;
  fileKey?: string | null;
  fileUrl?: string | null;
  folder: string;
}

export interface StorageProviderSweepStagedRequest {
  cutoff: Date;
  folders: string[];
  maxObjects: number;
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

export interface ResolvedStorageFileAccess {
  kind: StorageFileAccessKind;
  upstream: StorageFileAccessUpstream;
  isLegacyCompatibility: boolean;
  provider: StorageProviderKind;
  visibility: StorageVisibility;
  url: string;
}

export interface StorageStagedSweepResult {
  deletedObjects: number;
  keptObjects: number;
  scannedObjects: number;
}

export interface BackendStorageProvider {
  readonly kind: StorageProviderKind;
  uploadFile(request: StorageProviderUploadRequest): Promise<StorageStoredFile>;
  deleteFile(request: StorageProviderDeleteRequest): Promise<void>;
  finalizeFile(request: StorageProviderFinalizeRequest): Promise<StorageStoredFile>;
  resolveFileAccess(request: StorageProviderResolveAccessRequest): Promise<ResolvedStorageFileAccess>;
  sweepStagedUploads(request: StorageProviderSweepStagedRequest): Promise<StorageStagedSweepResult>;
}
