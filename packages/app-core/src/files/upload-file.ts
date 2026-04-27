export type UploadEndpoint = 'messageFile' | 'serverImage'

const STORAGE_VALUE_PREFIX = 'storage://v1?'
const STORED_FILE_TYPE_PATTERN = /\/(application\/pdf|image\/[^/]+)$/

type StoredUploadMetadata = {
  fileKey: string | null
  fileType: string | null
  fileUrl: string
}

type SerializeUploadValueInput = {
  fileKey: string
  fileType: string
  fileUrl: string
}

const parseMetadataUploadValue = (value: string): StoredUploadMetadata | null => {
  if (!value.startsWith(STORAGE_VALUE_PREFIX)) {
    return null
  }

  const searchParams = new URLSearchParams(value.slice(STORAGE_VALUE_PREFIX.length))
  const fileUrl = searchParams.get('url')?.trim() ?? ''
  const fileKey = searchParams.get('key')?.trim() ?? ''
  const fileType = searchParams.get('type')?.trim() ?? ''

  if (!fileUrl || !fileKey || !fileType) {
    return null
  }

  return {
    fileUrl,
    fileKey,
    fileType,
  }
}

const parseLegacyUploadValue = (value: string, endpoint: UploadEndpoint): StoredUploadMetadata => {
  const fileTypeMatch = value.match(STORED_FILE_TYPE_PATTERN)

  if (fileTypeMatch) {
    return {
      fileKey: null,
      fileType: fileTypeMatch[1],
      fileUrl: value.slice(0, -fileTypeMatch[0].length),
    }
  }

  if (endpoint === 'serverImage') {
    return {
      fileKey: null,
      fileType: 'image/*',
      fileUrl: value,
    }
  }

  return {
    fileKey: null,
    fileType: /\.pdf(?:$|[?#])/i.test(value) ? 'application/pdf' : 'image/*',
    fileUrl: value,
  }
}

export const getUploadValueParts = (value: string, endpoint: UploadEndpoint) => {
  if (!value) {
    return {
      fileKey: null,
      fileType: null,
      fileUrl: '',
    }
  }

  return parseMetadataUploadValue(value) ?? parseLegacyUploadValue(value, endpoint)
}

export const serializeUploadValue = ({ fileKey, fileType, fileUrl }: SerializeUploadValueInput) => {
  const searchParams = new URLSearchParams({
    key: fileKey,
    type: fileType,
    url: fileUrl,
  })

  return `${STORAGE_VALUE_PREFIX}${searchParams.toString()}`
}
