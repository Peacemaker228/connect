import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

export const AUTH_PUBLIC_ROUTE_PATTERNS = [
  '/',
  '/invite(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
]

const isPublicRoute = createRouteMatcher(AUTH_PUBLIC_ROUTE_PATTERNS)

export const authMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
