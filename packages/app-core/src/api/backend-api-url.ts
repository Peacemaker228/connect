const DEFAULT_DEVELOPMENT_API_PORT = '4000'

export const normalizeBackendApiBaseUrl = (url: string) => url.trim().replace(/\/+$/, '')

export const getConfiguredBackendApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  return configuredUrl ? normalizeBackendApiBaseUrl(configuredUrl) : ''
}

export const getBrowserDevelopmentBackendApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return ''
  }

  const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? DEFAULT_DEVELOPMENT_API_PORT

  return `${window.location.protocol}//${window.location.hostname}:${apiPort}`
}

export const getDefaultDevelopmentBackendApiBaseUrl = () => {
  const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? process.env.API_PORT ?? DEFAULT_DEVELOPMENT_API_PORT

  return `http://127.0.0.1:${apiPort}`
}

export const getPublicBackendApiBaseUrl = () => {
  return (
    getConfiguredBackendApiBaseUrl() ||
    getBrowserDevelopmentBackendApiBaseUrl() ||
    (typeof window === 'undefined' ? getDefaultDevelopmentBackendApiBaseUrl() : '')
  )
}

export const resolveBackendApiUrl = (path: string, baseUrl: string) => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(baseUrl)

  if (!normalizedBaseUrl) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (normalizedBaseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBaseUrl}${normalizedPath.slice('/api'.length)}`
  }

  return `${normalizedBaseUrl}${normalizedPath}`
}
