'use client'

import type { FC, KeyboardEvent, MouseEvent } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { cn } from '@/lib/shared/utils/utils'

type UnreadSoundMuteControlProps = {
  className?: string
  isMuted: boolean
  onToggle: () => void
}

export const UnreadSoundMuteControl: FC<UnreadSoundMuteControlProps> = ({ className, isMuted, onToggle }) => {
  const Icon = isMuted ? VolumeX : Volume2
  const label = isMuted ? 'Unmute notification sound' : 'Mute notification sound'

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onToggle()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onToggle()
  }

  return (
    <ActionTooltip label={label}>
      <span
        aria-label={label}
        aria-pressed={isMuted}
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-zinc-500 transition hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mainOrange dark:text-zinc-400 dark:hover:text-zinc-200',
          !isMuted && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100',
          isMuted && 'text-mainOrange opacity-100 dark:text-mainOrange',
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </ActionTooltip>
  )
}
