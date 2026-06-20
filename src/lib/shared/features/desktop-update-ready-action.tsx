'use client'

import { useState } from 'react'
import { Download, RefreshCw, RotateCw } from 'lucide-react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { Button } from '@/lib/shared/ui/button'
import { useDesktopUpdateStatus } from '@/lib/shared/features/use-desktop-update-status'
import { cn } from '@/lib/shared/utils/utils'

type DesktopUpdateReadyActionProps = {
  className?: string
}

const getUpdateVersionSuffix = (status: DesktopUpdateStatus) => {
  return status.updateVersion ? ` to ${status.updateVersion}` : ''
}

export const DesktopUpdateReadyAction = ({ className }: DesktopUpdateReadyActionProps) => {
  const { isBridgeAvailable, setStatus, status } = useDesktopUpdateStatus()
  const [isInstallPending, setIsInstallPending] = useState(false)

  if (!isBridgeAvailable || !status?.supported) {
    return null
  }

  if (status.status === 'downloading') {
    const progressPercent =
      typeof status.progressPercent === 'number' ? Math.max(0, Math.min(100, Math.round(status.progressPercent))) : null
    const label = progressPercent === null ? 'Downloading update' : `Downloading update ${progressPercent}%`

    return (
      <ActionTooltip align="center" label={label} preserveCase side="top">
        <div
          aria-label={label}
          className={cn(
            'inline-flex h-9 min-w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white/70 px-2 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200',
            className,
          )}
          role="status">
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>{progressPercent === null ? 'Update' : `${progressPercent}%`}</span>
        </div>
      </ActionTooltip>
    )
  }

  if (status.status !== 'downloaded') {
    return null
  }

  const label = `Restart and update${getUpdateVersionSuffix(status)}`

  const handleInstallUpdate = async () => {
    if (isInstallPending) {
      return
    }

    setIsInstallPending(true)

    try {
      const nextStatus = await window.electron?.installUpdate?.()

      if (nextStatus) {
        setStatus(nextStatus)
      }
    } finally {
      setIsInstallPending(false)
    }
  }

  return (
    <ActionTooltip align="center" label={label} preserveCase side="top">
      <Button
        aria-label={label}
        className={cn(
          'inline-flex h-9 min-w-[86px] shrink-0 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-wait disabled:opacity-75',
          className,
        )}
        disabled={isInstallPending}
        onClick={() => void handleInstallUpdate()}
        type="button">
        {isInstallPending ? (
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RotateCw className="h-4 w-4" aria-hidden="true" />
        )}
        <span>Restart</span>
      </Button>
    </ActionTooltip>
  )
}
