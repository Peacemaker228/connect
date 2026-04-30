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

publicApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, false))

privateApiInstance.interceptors.request.use((config) => applyBackendApiBaseUrl(config, true))
