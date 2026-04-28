import axios from 'axios'

import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

export type StorageUploadEndpoint = 'messageFile' | 'serverImage'

export type StorageUploadResponse = {
  accessKind: 'backend-redirect'
  key: string
  name: string
  size: number
  type: string
  url: string
}

export type DeleteStorageFileInput = {
  endpoint: StorageUploadEndpoint
  fileKey?: string | null
  fileUrl?: string | null
}

export class StorageActionError extends Error {
  status?: number
  payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'StorageActionError'
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_STORAGE_ERROR_MESSAGE = 'Storage request failed'

const getStorageUploadPath = () => {
  return getBackendApiBaseUrl() ? '/api/storage/upload' : '/api/server-upload'
}

const getStorageDeletePath = () => {
  return getBackendApiBaseUrl() ? '/api/storage/file' : '/api/server-upload'
}

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim()
  }

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error.trim()
  }

  if (!('message' in payload)) {
    return ''
  }

  const message = (payload as { message?: unknown }).message

  if (Array.isArray(message)) {
    const firstMessage = message.find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )

    return firstMessage?.trim() ?? ''
  }

  return typeof message === 'string' ? message.trim() : ''
}

const toStorageActionError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return new StorageActionError(DEFAULT_STORAGE_ERROR_MESSAGE)
  }

  const payload = error.response?.data
  const message = getPayloadMessage(payload) || error.message || DEFAULT_STORAGE_ERROR_MESSAGE

  return new StorageActionError(message, error.response?.status, payload)
}

export const uploadStorageFile = async (endpoint: StorageUploadEndpoint, file: File) => {
  const formData = new FormData()
  formData.append('endpoint', endpoint)
  formData.append('file', file)

  try {
    const response = await privateApiInstance.post<StorageUploadResponse>(getStorageUploadPath(), formData)

    return response.data
  } catch (error) {
    throw toStorageActionError(error)
  }
}

export const deleteStorageFile = async ({ endpoint, fileKey, fileUrl }: DeleteStorageFileInput) => {
  if (!fileKey && !fileUrl) {
    return
  }

  try {
    await privateApiInstance.delete(getStorageDeletePath(), {
      data: {
        endpoint,
        fileKey,
        fileUrl,
      },
    })
  } catch (error) {
    throw toStorageActionError(error)
  }
}
