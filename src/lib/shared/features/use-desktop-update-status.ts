'use client'

import { useEffect, useState } from 'react'

export const isDesktopUpdateBridgeAvailable = () => {
  return typeof window !== 'undefined' && Boolean(window.electron?.isDesktop && window.electron.getUpdateStatus)
}

export const useDesktopUpdateStatus = () => {
  const [isBridgeAvailable, setIsBridgeAvailable] = useState(false)
  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null)

  useEffect(() => {
    const hasBridge = isDesktopUpdateBridgeAvailable()
    setIsBridgeAvailable(hasBridge)

    if (!hasBridge) {
      setStatus(null)
      return
    }

    let isMounted = true
    const cleanupUpdateStatus = window.electron?.onUpdateStatus?.((nextStatus) => {
      setStatus(nextStatus)
    })

    void window.electron?.getUpdateStatus?.().then((nextStatus) => {
      if (isMounted) {
        setStatus(nextStatus)
      }
    })

    return () => {
      isMounted = false
      cleanupUpdateStatus?.()
    }
  }, [])

  return {
    isBridgeAvailable,
    setStatus,
    status,
  }
}
