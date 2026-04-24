export type UploadEndpoint = 'messageFile' | 'serverImage'

const STORED_FILE_TYPE_PATTERN = /\/(application\/pdf|image\/[^/]+)$/

export const getUploadValueParts = (value: string, endpoint: UploadEndpoint) => {
  if (!value) {
    return {
      fileType: null,
      fileUrl: '',
    }
  }

  const fileTypeMatch = value.match(STORED_FILE_TYPE_PATTERN)

  if (fileTypeMatch) {
    return {
      fileType: fileTypeMatch[1],
      fileUrl: value.slice(0, -fileTypeMatch[0].length),
    }
  }

  if (endpoint === 'serverImage') {
    return {
      fileType: 'image/*',
      fileUrl: value,
    }
  }

  return {
    fileType: /\.pdf(?:$|[?#])/i.test(value) ? 'application/pdf' : 'image/*',
    fileUrl: value,
  }
}

export const serializeUploadValue = (fileUrl: string, fileType: string, endpoint: UploadEndpoint) => {
  return endpoint === 'messageFile' ? `${fileUrl}/${fileType}` : fileUrl
}
