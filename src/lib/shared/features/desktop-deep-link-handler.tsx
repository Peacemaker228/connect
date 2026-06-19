'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const DesktopDeepLinkHandler = () => {
  const router = useRouter()

  useEffect(() => {
    void window.electron?.getBuildInfo?.().then((buildInfo) => {
      if (!buildInfo) {
        return
      }

      console.log('[desktop][renderer-build-info]', buildInfo)
    })

    const cleanupNavigation = window.electron?.onUnreadNotificationNavigate?.((path) => {
      if (path.startsWith('/') && !path.startsWith('//')) {
        router.push(path)
      }
    })

    window.electron?.notifyReady?.()

    return () => {
      cleanupNavigation?.()
    }
  }, [router])

  return null
}
