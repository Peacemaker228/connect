import { createRequire } from 'module'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const require = createRequire(import.meta.url)
const { version } = require('./package.json')

const resolveStorageImagePattern = () => {
  const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL?.trim()

  if (!publicBaseUrl) {
    return null
  }

  try {
    const { protocol, hostname } = new URL(publicBaseUrl)

    return {
      protocol: protocol.replace(':', ''),
      hostname,
    }
  } catch {
    return null
  }
}

const storageImagePattern = resolveStorageImagePattern()

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
    ],
  },
}

export default withNextIntl(nextConfig)
