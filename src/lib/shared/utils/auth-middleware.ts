import { getSignInRedirectUrl } from '@app-core/routing/routes'
import { NextRequest, NextResponse } from 'next/server'

export const AUTH_PUBLIC_ROUTE_PATTERNS = ['/', '/invite(.*)', '/sign-in(.*)', '/sign-up(.*)']

const BACKEND_ACCESS_TOKEN_COOKIE = 'ax-access-token'
const BACKEND_REFRESH_TOKEN_COOKIE = 'ax-refresh-token'
const DEFAULT_INTERNAL_API_URL = `http://127.0.0.1:${process.env.API_PORT ?? '4000'}`

const AUTH_PUBLIC_ROUTE_REGEXES = [/^\/$/, /^\/invite(?:\/.*)?$/, /^\/sign-in(?:\/.*)?$/, /^\/sign-up(?:\/.*)?$/]

const isPublicRoute = (pathname: string) => {
  return AUTH_PUBLIC_ROUTE_REGEXES.some((pattern) => pattern.test(pathname))
}

const isApiRoute = (pathname: string) => {
  return pathname.startsWith('/api') || pathname.startsWith('/trpc')
}

const getInternalApiUrl = () => {
  return process.env.API_INTERNAL_URL ?? DEFAULT_INTERNAL_API_URL
}

const splitSetCookieHeader = (headerValue: string) => {
  return headerValue.split(/,(?=\s*[^;,\s]+=)/).map((value) => value.trim())
}

const getSetCookieHeaders = (response: Response) => {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookieHeaders = responseHeaders.getSetCookie?.()

  if (setCookieHeaders && setCookieHeaders.length > 0) {
    return setCookieHeaders
  }

  const singleHeader = response.headers.get('set-cookie')

  return singleHeader ? splitSetCookieHeader(singleHeader) : []
}

const getCookiePairFromSetCookie = (setCookie: string) => {
  return setCookie.split(';')[0]?.trim() || null
}

const mergeCookieHeader = (cookieHeader: string, cookiePairs: string[]) => {
  const cookies = new Map<string, string>()

  cookieHeader
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name, ...valueParts] = cookie.split('=')

      if (name) {
        cookies.set(name, valueParts.join('='))
      }
    })

  cookiePairs.forEach((cookie) => {
    const [name, ...valueParts] = cookie.split('=')

    if (name) {
      cookies.set(name, valueParts.join('='))
    }
  })

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

const refreshBackendSession = async (cookieHeader: string) => {
  try {
    const response = await fetch(new URL('/api/auth/session/refresh', getInternalApiUrl()), {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    return getSetCookieHeaders(response)
  } catch {
    return []
  }
}

export const authMiddleware = async (request: NextRequest) => {
  const { pathname, search } = request.nextUrl

  if (isPublicRoute(pathname) || isApiRoute(pathname)) {
    return NextResponse.next()
  }

  if (request.cookies.has(BACKEND_ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next()
  }

  if (request.cookies.has(BACKEND_REFRESH_TOKEN_COOKIE)) {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const setCookieHeaders = await refreshBackendSession(cookieHeader)

    if (setCookieHeaders.length > 0) {
      const cookiePairs = setCookieHeaders
        .map(getCookiePairFromSetCookie)
        .filter((cookiePair): cookiePair is string => Boolean(cookiePair))
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('cookie', mergeCookieHeader(cookieHeader, cookiePairs))
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      setCookieHeaders.forEach((setCookie) => response.headers.append('set-cookie', setCookie))

      return response
    }
  }

  const redirectPath = `${pathname}${search}`
  const signInUrl = new URL(getSignInRedirectUrl(redirectPath), request.url)

  return NextResponse.redirect(signInUrl)
}
