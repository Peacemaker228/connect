'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, RefreshCw, RotateCw } from 'lucide-react'
import { DropdownMenuItem } from '@/lib/shared/ui/dropdown-menu'

const isDesktopUpdateBridgeAvailable = () => {
  return typeof window !== 'undefined' && Boolean(window.electron?.isDesktop && window.electron.getUpdateStatus)
}

const getUpdateStatusLabel = (status: DesktopUpdateStatus) => {
  if (status.status === 'checking') {
    return 'Checking for updates...'
  }

  if (status.status === 'available') {
    return `Update ${status.updateVersion ?? ''} found`.trim()
  }

  if (status.status === 'downloading') {
    const progress = typeof status.progressPercent === 'number' ? ` ${Math.round(status.progressPercent)}%` : ''

    return `Downloading update${progress}`
  }

  if (status.status === 'downloaded') {
    return `Restart and update${status.updateVersion ? ` to ${status.updateVersion}` : ''}`
  }

  if (status.status === 'not_available') {
    return 'App is up to date'
  }

  if (status.status === 'error') {
    return 'Update check failed'
  }

  return 'Check for updates'
}

const getUpdateStatusIcon = (status?: DesktopUpdateStatus | null) => {
  if (!status || status.status === 'idle') {
    return <RefreshCw className="mr-2 h-4 w-4" />
  }

  if (status.status === 'checking') {
    return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
  }

  if (status.status === 'available' || status.status === 'downloading') {
    return <Download className="mr-2 h-4 w-4" />
  }

  if (status.status === 'downloaded') {
    return <RotateCw className="mr-2 h-4 w-4" />
  }

  if (status.status === 'error') {
    return <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
  }

  return <CheckCircle2 className="mr-2 h-4 w-4" />
}

export const DesktopUpdateMenuItem = () => {
  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  useEffect(() => {
    if (!isDesktopUpdateBridgeAvailable()) {
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

  if (!isDesktopUpdateBridgeAvailable() || !status?.supported) {
    return null
  }

  const isBusy = isActionPending || status.status === 'checking' || status.status === 'downloading'
  const label = getUpdateStatusLabel(status)

  const handleSelect = async () => {
    if (isBusy) {
      return
    }

    setIsActionPending(true)

    try {
      const nextStatus =
        status.status === 'downloaded'
          ? await window.electron?.installUpdate?.()
          : await window.electron?.checkForUpdate?.()

      if (nextStatus) {
        setStatus(nextStatus)
      }
    } finally {
      setIsActionPending(false)
    }
  }

  return (
    <DropdownMenuItem
      className="cursor-pointer dark:focus:bg-gray21"
      disabled={isBusy}
      onSelect={(event) => {
        event.preventDefault()
        void handleSelect()
      }}>
      {getUpdateStatusIcon(status)}
      {label}
    </DropdownMenuItem>
  )
}
