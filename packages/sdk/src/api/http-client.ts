import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  getBrowserDevelopmentBackendApiBaseUrl,
  getConfiguredBackendApiBaseUrl,
  resolveBackendApiUrl,
} from '@app-core/api/backend-api-url'

export const getBackendApiBaseUrl = () => {
  return getConfiguredBackendApiBaseUrl() || getBrowserDevelopmentBackendApiBaseUrl()
}

const isAbsoluteUrl = (url: string) => {
  return /^https?:\/\//i.test(url)
}

const applyBackendApiBaseUrl = (config: InternalAxiosRequestConfig, withCredentials: boolean) => {
  const baseUrl = getBackendApiBaseUrl()

  if (!baseUrl || !config.url || isAbsoluteUrl(config.url)) {
    return config
  }

  config.url = resolveBackendApiUrl(config.url, baseUrl)
  config.withCredentials = withCredentials

  return config
}

export const publicApiInstance = axios.create()

export const privateApiInstance = axios.create()

const authRefreshApiInstance = axios.create()

type AuthRetryRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
}

let authRefreshRequest: Promise<unknown> | null = null

const isAuthRefreshEligibleRequest = (config: InternalAxiosRequestConfig | undefined) => {
  const url = config?.url

  if (!url) {
    return false
  }

  return (
    !url.includes('/api/auth/login/password') &&
    !url.includes('/api/auth/register/password') &&
    !url.includes('/api/auth/session/logout') &&
    !url.includes('/api/auth/session/refresh')
  )
}

publicApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, false))

privateApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, true))

authRefreshApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, true))

privateApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error
    }

    const originalConfig = error.config as AuthRetryRequestConfig | undefined

    if (!originalConfig || originalConfig._authRetry || !isAuthRefreshEligibleRequest(originalConfig)) {
      throw error
    }

    originalConfig._authRetry = true
    authRefreshRequest ??= authRefreshApiInstance.post('/api/auth/session/refresh').finally(() => {
      authRefreshRequest = null
    })

    await authRefreshRequest

    return privateApiInstance(originalConfig)
  },
)
