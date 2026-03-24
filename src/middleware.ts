import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/uploadthing(.*)'])

const useFrontendApiProxy = !!process.env.NEXT_PUBLIC_CLERK_PROXY_URL

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  },
  useFrontendApiProxy
    ? {
        frontendApiProxy: {
          enabled: true,
        },
      }
    : {},
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc|__clerk)(.*)',
  ],
}
