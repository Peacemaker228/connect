import { createRequire } from 'module'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const require = createRequire(import.meta.url)
const { version } = require('./package.json')

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
    ],
  },
}

export default withNextIntl(nextConfig)
