'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'

function BackendSessionBridge() {
  const { isLoaded, userId } = useAuth()
  const lastResolvedUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (lastResolvedUserIdRef.current === userId) {
      return
    }

    const previousUserId = lastResolvedUserIdRef.current
    lastResolvedUserIdRef.current = userId

    const abortController = new AbortController()

    if (!userId && !previousUserId) {
      return () => {
        abortController.abort()
      }
    }

    const path = userId ? '/api/auth/session/bootstrap' : '/api/auth/session/logout'

    fetch(path, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      signal: abortController.signal,
    }).catch(() => {})

    return () => {
      abortController.abort()
    }
  }, [isLoaded, userId])

  return null
}

export function AuthProvider({ children }: PropsWithChildren) {
  const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

  return (
    <ClerkProvider
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/">
      <BackendSessionBridge />
      {children}
    </ClerkProvider>
  )
}
