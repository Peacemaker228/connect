'use client'

import { useEffect } from 'react'

export const DesktopDeepLinkHandler = () => {
  useEffect(() => {
    void window.electron?.getBuildInfo?.().then((buildInfo) => {
      if (!buildInfo) {
        return
      }

      console.log('[desktop][renderer-build-info]', buildInfo)
    })

    window.electron?.notifyReady?.()

    return undefined
  }, [])

  return null
}
