import axios, { type AxiosResponse } from 'axios'

import { privateApiInstance } from '../api/http-client'

export type AuthLoginPayload = {
  email: string
  password: string
}

export type AuthRegisterPayload = AuthLoginPayload & {
  name?: string
}

export class AuthActionError extends Error {
  status?: number
  payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'AuthActionError'
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_AUTH_ERROR_MESSAGE = 'Request failed'

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim()
  }

  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
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

const toAuthActionError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return new AuthActionError('Unable to complete authentication right now')
  }

  const payload = error.response?.data
  const message = getPayloadMessage(payload) || error.message || DEFAULT_AUTH_ERROR_MESSAGE

  return new AuthActionError(message, error.response?.status, payload)
}

export const loginWithPassword = async (payload: AuthLoginPayload) => {
  try {
    const response = await privateApiInstance.post('/api/auth/login/password', payload)

    return response.data
  } catch (error) {
    throw toAuthActionError(error)
  }
}

export const registerWithPassword = async (payload: AuthRegisterPayload) => {
  try {
    const response = await privateApiInstance.post('/api/auth/register/password', payload)

    return response.data
  } catch (error) {
    throw toAuthActionError(error)
  }
}

export const logoutSession = async () => {
  try {
    const response = await privateApiInstance.post('/api/auth/session/logout')

    return response.data
  } catch (error) {
    throw toAuthActionError(error)
  }
}

let refreshSessionRequest: Promise<AxiosResponse> | null = null

export const refreshSession = async () => {
  try {
    refreshSessionRequest ??= privateApiInstance.post('/api/auth/session/refresh').finally(() => {
      refreshSessionRequest = null
    })

    const response = await refreshSessionRequest

    return response.data
  } catch (error) {
    throw toAuthActionError(error)
  }
}
