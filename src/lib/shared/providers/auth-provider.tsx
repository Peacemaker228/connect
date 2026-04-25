'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { PropsWithChildren } from 'react'

export function AuthProvider({ children }: PropsWithChildren) {
  const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

  return (
    <ClerkProvider
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/">
      {children}
    </ClerkProvider>
  )
}
