export type StorageVisibility = 'public' | 'private'

export interface StorageFileMetadata {
  id: string
  key: string
  fileName: string
  contentType: string
  size: number
  visibility: StorageVisibility
  checksum?: string | null
  uploadedAt?: Date | null
}

export interface StorageUploadRequest {
  fileName: string
  contentType: string
  size: number
  visibility?: StorageVisibility
  folder?: string
  metadata?: Record<string, string>
}

export interface StorageUploadTarget {
  method: 'POST' | 'PUT'
  url: string
  fields?: Record<string, string>
  headers?: Record<string, string>
  file: StorageFileMetadata
}

export interface StorageAccessRequest {
  fileId?: string
  key?: string
  expiresInSeconds?: number
}

export interface StorageFileAccess {
  url: string
  expiresAt?: Date | null
}

export interface StorageProvider {
  createUploadTarget(request: StorageUploadRequest): Promise<StorageUploadTarget>
  getFileMetadata(request: Pick<StorageAccessRequest, 'fileId' | 'key'>): Promise<StorageFileMetadata | null>
  createFileAccess(request: StorageAccessRequest): Promise<StorageFileAccess>
}
