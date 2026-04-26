import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

export const AUTH_PUBLIC_ROUTE_PATTERNS = [
  '/',
  '/invite(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth/login(.*)',
  '/api/auth/register(.*)',
  '/api/uploadthing(.*)',
]

const BACKEND_ACCESS_TOKEN_COOKIE = 'ax-access-token'

const isPublicRoute = createRouteMatcher(AUTH_PUBLIC_ROUTE_PATTERNS)

export const authMiddleware = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return
  }

  if (request.cookies.has(BACKEND_ACCESS_TOKEN_COOKIE)) {
    return
  }

  await auth.protect()
})
