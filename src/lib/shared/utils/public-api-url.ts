import { headers } from 'next/headers'

const DEFAULT_PUBLIC_API_URL = `http://127.0.0.1:${process.env.API_PORT ?? '4000'}`

const normalizeUrl = (url: string) => url.replace(/\/$/, '')

export const getPublicApiUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_EXTERNAL_URL

  if (configuredUrl) {
    return normalizeUrl(configuredUrl)
  }

  const headerStore = headers()
  const forwardedHost = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const forwardedProto = headerStore.get('x-forwarded-proto') ?? 'http'

  if (!forwardedHost) {
    return DEFAULT_PUBLIC_API_URL
  }

  try {
    const apiUrl = new URL(`${forwardedProto}://${forwardedHost}`)
    apiUrl.port = process.env.API_PORT ?? '4000'

    return normalizeUrl(apiUrl.origin)
  } catch {
    return DEFAULT_PUBLIC_API_URL
  }
}
