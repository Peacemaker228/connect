'use client'

import { getUploadValueParts, type UploadEndpoint } from '@app-core/files/upload-file'
import { deleteStorageFile } from '@sdk/actions/storage'

export const deleteUploadedFile = async (value: string, endpoint: UploadEndpoint) => {
  const { fileKey, fileUrl } = getUploadValueParts(value, endpoint)

  if (!fileUrl && !fileKey) {
    return
  }

  await deleteStorageFile({ endpoint, fileKey, fileUrl })
}
