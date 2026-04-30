import { buildStorageAccessRequestPath, getUploadValueParts, serializeUploadValue } from '@app-core/files/upload-file'
import type { UploadEndpoint } from '@app-core/files/upload-file'
import { getPublicBackendApiBaseUrl, resolveBackendApiUrl } from '@app-core/api/backend-api-url'

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url)

export const buildStorageAccessPath = (value: string, endpoint: UploadEndpoint) => {
  const requestPath = buildStorageAccessRequestPath(value, endpoint)

  if (!requestPath || isAbsoluteUrl(requestPath)) {
    return requestPath
  }

  return resolveBackendApiUrl(requestPath, getPublicBackendApiBaseUrl())
}

export { buildStorageAccessRequestPath, getUploadValueParts, serializeUploadValue }
export type { UploadEndpoint } from '@app-core/files/upload-file'
