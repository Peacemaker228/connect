'use client'

import { getUploadValueParts, type UploadEndpoint } from '@app-core/files/upload-file'

export const deleteUploadedFile = async (value: string, endpoint: UploadEndpoint) => {
  const { fileUrl } = getUploadValueParts(value, endpoint)

  if (!fileUrl) {
    return
  }

  const response = await fetch('/api/server-upload', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      endpoint,
      fileUrl,
    }),
  })

  if (response.ok) {
    return
  }

  let errorMessage = 'Delete failed'

  try {
    const json = await response.json()
    errorMessage = typeof json.error === 'string' ? json.error : errorMessage
  } catch {
    // Ignore non-JSON error bodies and fall back to the generic message.
  }

  throw new Error(errorMessage)
}
