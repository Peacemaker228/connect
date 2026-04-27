export type UploadEndpoint = 'messageFile' | 'serverImage'
export type StoredUploadAccessKind = 'backend-redirect'

const STORAGE_VALUE_PREFIX = 'storage://v1?'
const STORED_FILE_TYPE_PATTERN = /\/(application\/pdf|image\/[^/]+)$/
const DEFAULT_STORED_UPLOAD_ACCESS_KIND: StoredUploadAccessKind = 'backend-redirect'

type StoredUploadMetadata = {
  accessKind: StoredUploadAccessKind
  fileKey: string | null
  fileType: string | null
  fileUrl: string
}

type SerializeUploadValueInput = {
  accessKind?: StoredUploadAccessKind
  fileKey: string
  fileType: string
  fileUrl: string
}

const normalizeStoredUploadAccessKind = (value: string | null) => {
  if (!value) {
    return DEFAULT_STORED_UPLOAD_ACCESS_KIND
  }

  if (value === 'backend-redirect') {
    return value
  }

  return null
}

const parseMetadataUploadValue = (value: string): StoredUploadMetadata | null => {
  if (!value.startsWith(STORAGE_VALUE_PREFIX)) {
    return null
  }

  const searchParams = new URLSearchParams(value.slice(STORAGE_VALUE_PREFIX.length))
  const fileUrl = searchParams.get('url')?.trim() ?? ''
  const fileKey = searchParams.get('key')?.trim() ?? ''
  const fileType = searchParams.get('type')?.trim() ?? ''
  const accessKind = normalizeStoredUploadAccessKind(searchParams.get('access'))

  if (!fileUrl || !fileKey || !fileType || !accessKind) {
    return null
  }

  return {
    accessKind,
    fileUrl,
    fileKey,
    fileType,
  }
}

const parseLegacyUploadValue = (value: string, endpoint: UploadEndpoint): StoredUploadMetadata => {
  const fileTypeMatch = value.match(STORED_FILE_TYPE_PATTERN)

  if (fileTypeMatch) {
    return {
      accessKind: DEFAULT_STORED_UPLOAD_ACCESS_KIND,
      fileKey: null,
      fileType: fileTypeMatch[1],
      fileUrl: value.slice(0, -fileTypeMatch[0].length),
    }
  }

  if (endpoint === 'serverImage') {
    return {
      accessKind: DEFAULT_STORED_UPLOAD_ACCESS_KIND,
      fileKey: null,
      fileType: 'image/*',
      fileUrl: value,
    }
  }

  return {
    accessKind: DEFAULT_STORED_UPLOAD_ACCESS_KIND,
    fileKey: null,
    fileType: /\.pdf(?:$|[?#])/i.test(value) ? 'application/pdf' : 'image/*',
    fileUrl: value,
  }
}

export const getUploadValueParts = (value: string, endpoint: UploadEndpoint) => {
  if (!value) {
    return {
      accessKind: DEFAULT_STORED_UPLOAD_ACCESS_KIND,
      fileKey: null,
      fileType: null,
      fileUrl: '',
    }
  }

  return parseMetadataUploadValue(value) ?? parseLegacyUploadValue(value, endpoint)
}

export const buildStorageAccessPath = (value: string, endpoint: UploadEndpoint) => {
  const { accessKind, fileKey, fileUrl } = getUploadValueParts(value, endpoint)

  if (!fileKey && !fileUrl) {
    return ''
  }

  if (accessKind !== 'backend-redirect') {
    return fileUrl
  }

  const searchParams = new URLSearchParams({
    endpoint,
  })

  if (fileKey) {
    searchParams.set('fileKey', fileKey)
  } else if (fileUrl) {
    searchParams.set('fileUrl', fileUrl)
  }

  return `/api/storage/access?${searchParams.toString()}`
}

export const serializeUploadValue = ({
  accessKind = DEFAULT_STORED_UPLOAD_ACCESS_KIND,
  fileKey,
  fileType,
  fileUrl,
}: SerializeUploadValueInput) => {
  const searchParams = new URLSearchParams({
    access: accessKind,
    key: fileKey,
    type: fileType,
    url: fileUrl,
  })

  return `${STORAGE_VALUE_PREFIX}${searchParams.toString()}`
}
