'use client'

import { useEffect } from 'react'

export const DesktopDeepLinkHandler = () => {
  useEffect(() => {
    window.electron?.notifyReady?.()

    return undefined
  }, [])

  return null
}
