import { getSignInRedirectUrl } from '@app-core/routing/routes'
import { NextRequest, NextResponse } from 'next/server'

export const AUTH_PUBLIC_ROUTE_PATTERNS = [
  '/',
  '/invite(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]

const BACKEND_ACCESS_TOKEN_COOKIE = 'ax-access-token'

const AUTH_PUBLIC_ROUTE_REGEXES = [
  /^\/$/,
  /^\/invite(?:\/.*)?$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/sign-up(?:\/.*)?$/,
]

const isPublicRoute = (pathname: string) => {
  return AUTH_PUBLIC_ROUTE_REGEXES.some((pattern) => pattern.test(pathname))
}

const isApiRoute = (pathname: string) => {
  return pathname.startsWith('/api') || pathname.startsWith('/trpc')
}

export const authMiddleware = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl

  if (isPublicRoute(pathname) || isApiRoute(pathname)) {
    return NextResponse.next()
  }

  if (request.cookies.has(BACKEND_ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next()
  }

  const redirectPath = `${pathname}${search}`
  const signInUrl = new URL(getSignInRedirectUrl(redirectPath), request.url)

  return NextResponse.redirect(signInUrl)
}
