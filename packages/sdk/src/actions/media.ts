import axios from 'axios'

import { privateApiInstance } from '../api/http-client'

export type LiveKitTokenRequest = {
  room: string
  username: string
}

export type LiveKitTokenResponse = {
  token: string
}

export class MediaActionError extends Error {
  status?: number
  payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'MediaActionError'
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_MEDIA_ERROR_MESSAGE = 'Media request failed'

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

const toMediaActionError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return new MediaActionError(DEFAULT_MEDIA_ERROR_MESSAGE)
  }

  const payload = error.response?.data
  const message = getPayloadMessage(payload) || error.message || DEFAULT_MEDIA_ERROR_MESSAGE

  return new MediaActionError(message, error.response?.status, payload)
}

export const getLiveKitToken = async ({ room, username }: LiveKitTokenRequest) => {
  try {
    const response = await privateApiInstance.get<LiveKitTokenResponse>('/api/media/livekit-token', {
      params: {
        room,
        username,
      },
    })

    return response.data
  } catch (error) {
    throw toMediaActionError(error)
  }
}
