'use client'

import { useEffect, type PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'
import { refreshSession } from '@sdk/actions/auth'

const AUTH_REFRESH_INTERVAL_MS = 60_000
const AUTH_PUBLIC_ROUTE_REGEXES = [/^\/$/, /^\/invite(?:\/.*)?$/, /^\/sign-in(?:\/.*)?$/, /^\/sign-up(?:\/.*)?$/]

const isPublicRoute = (pathname: string | null) => {
  return AUTH_PUBLIC_ROUTE_REGEXES.some((pattern) => pattern.test(pathname ?? '/'))
}

export function AuthProvider({ children }: PropsWithChildren) {
  const pathname = usePathname()

  useEffect(() => {
    if (isPublicRoute(pathname)) {
      return
    }

    let isMounted = true

    const refreshCurrentSession = async () => {
      try {
        await refreshSession()
      } catch (error) {
        if (isMounted) {
          console.debug('[AUTH_SESSION_REFRESH]', error)
        }
      }
    }

    void refreshCurrentSession()

    const intervalId = window.setInterval(() => {
      void refreshCurrentSession()
    }, AUTH_REFRESH_INTERVAL_MS)

    window.addEventListener('focus', refreshCurrentSession)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshCurrentSession)
    }
  }, [pathname])

  return children
}
