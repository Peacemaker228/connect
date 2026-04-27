import axios, { type InternalAxiosRequestConfig } from 'axios'

const DEFAULT_DEVELOPMENT_API_PORT = '4000'

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '')

const getConfiguredApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  return configuredUrl ? normalizeBaseUrl(configuredUrl) : ''
}

const getDevelopmentApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return ''
  }

  const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? DEFAULT_DEVELOPMENT_API_PORT

  return `${window.location.protocol}//${window.location.hostname}:${apiPort}`
}

export const getBackendApiBaseUrl = () => {
  return getConfiguredApiBaseUrl() || getDevelopmentApiBaseUrl()
}

const resolveApiUrl = (path: string, baseUrl: string) => {
  if (!baseUrl) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (baseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${baseUrl}${normalizedPath.slice('/api'.length)}`
  }

  return `${baseUrl}${normalizedPath}`
}

const isAbsoluteUrl = (url: string) => {
  return /^https?:\/\//i.test(url)
}

const applyBackendApiBaseUrl = (config: InternalAxiosRequestConfig, withCredentials: boolean) => {
  const baseUrl = getBackendApiBaseUrl()

  if (!baseUrl || !config.url || isAbsoluteUrl(config.url)) {
    return config
  }

  config.url = resolveApiUrl(config.url, baseUrl)
  config.withCredentials = withCredentials

  return config
}

export const publicApiInstance = axios.create()

export const privateApiInstance = axios.create()

publicApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, false))

privateApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, true))
