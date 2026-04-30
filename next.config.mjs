import { createRequire } from 'module'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const require = createRequire(import.meta.url)
const { version } = require('./package.json')

const resolveRemoteImagePattern = (baseUrl, pathname) => {
  if (!baseUrl) {
    return null
  }

  try {
    const { protocol, hostname, port } = new URL(baseUrl)

    return {
      protocol: protocol.replace(':', ''),
      hostname,
      ...(port ? { port } : {}),
      ...(pathname ? { pathname } : {}),
    }
  } catch {
    return null
  }
}

const resolveApiStorageAccessPathname = (baseUrl) => {
  try {
    const { pathname } = new URL(baseUrl)
    const normalizedPathname = pathname.replace(/\/+$/, '')

    if (!normalizedPathname || normalizedPathname === '/') {
      return '/api/storage/access'
    }

    if (normalizedPathname.endsWith('/api')) {
      return `${normalizedPathname}/storage/access`
    }

    return `${normalizedPathname}/api/storage/access`
  } catch {
    return '/api/storage/access'
  }
}

const resolveStorageImagePattern = () => {
  return resolveRemoteImagePattern(process.env.STORAGE_PUBLIC_BASE_URL?.trim())
}

const resolveApiImagePattern = () => {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_EXTERNAL_URL)?.trim()

  if (!apiBaseUrl) {
    return null
  }

  return resolveRemoteImagePattern(apiBaseUrl, resolveApiStorageAccessPathname(apiBaseUrl))
}

const storageImagePattern = resolveStorageImagePattern()
const apiImagePattern = resolveApiImagePattern()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || version,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'production' ? 'prod' : 'local'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh',
      },
      ...(storageImagePattern ? [storageImagePattern] : []),
      ...(apiImagePattern ? [apiImagePattern] : []),
    ],
  },
}

export default withNextIntl(nextConfig)
