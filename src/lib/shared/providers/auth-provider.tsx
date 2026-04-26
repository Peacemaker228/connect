'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'

function BackendSessionBridge() {
  const { isLoaded, userId } = useAuth()
  const lastSyncKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    const syncKey = userId ?? 'anonymous'

    if (lastSyncKeyRef.current === syncKey) {
      return
    }

    lastSyncKeyRef.current = syncKey

    const abortController = new AbortController()
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
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/">
      <BackendSessionBridge />
      {children}
    </ClerkProvider>
  )
}
