'use client'

import { ChannelType, type ChannelDto, type MemberRole, type ServerDto } from '@app-core/contracts'
import React, { FC } from 'react'
import { Edit, Hash, Lock, Mic, Trash, Video } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/shared/utils/utils'
import { EGeneral } from '@/types'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { ERoutes } from '@app-core/routing/routes'
import { useTranslations } from 'next-intl'
import { TModalType, useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { UnreadSoundMuteControl } from '@/lib/server-list/features/unread-sound-mute-control'
import {
  createChannelUnreadNotificationMuteScope,
  useUnreadNotificationMutedScope,
} from '@/lib/shared/data-access/unread/unread-notification-sound'

interface IServerChannelProps {
  channel: ChannelDto
  server: ServerDto
  role?: MemberRole
  unreadCount?: number
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
}

export const ServerChannel: FC<IServerChannelProps> = ({ channel, server, role, unreadCount = 0 }) => {
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('ServerSidebar')

  const Icon = iconMap[channel.type]
  const hasUnread = unreadCount > 0
  const soundMuteScope = createChannelUnreadNotificationMuteScope(server.id, channel.id)
  const { isMuted: isSoundMuted, toggleMuted: toggleSoundMuted } = useUnreadNotificationMutedScope(soundMuteScope)

  const handleClick = () => {
    router.push(`${ERoutes.SERVERS}/${params?.serverId}${ERoutes.CHANNELS}/${channel.id}`)
  }

  const handleAction = (e: React.MouseEvent<SVGSVGElement, MouseEvent>, action: TModalType) => {
    e.stopPropagation()

    onOpen(action, { channel, server })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params?.channelId === channel.id && 'bg-zinc-700/20 dark:bg-zinc-700/60',
      )}>
      {hasUnread && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-zinc-900/80 dark:bg-white"
        />
      )}
      <Icon
        className={cn(
          'flex-shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400',
          hasUnread && 'text-zinc-800 dark:text-zinc-100',
        )}
      />
      <p
        className={cn(
          'line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition',
          hasUnread &&
            'font-bold text-zinc-900 group-hover:text-zinc-900 dark:text-zinc-100 dark:group-hover:text-white',
          params?.channelId === channel.id && 'text-primary dark:text-zinc-200 dark:group-hover:text-white',
        )}>
        {channel.name}
      </p>
      {unreadCount > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-[10px] leading-5 text-white font-semibold text-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <div className={cn('ml-auto flex items-center gap-x-2', unreadCount === 0 && 'ml-auto')}>
        <UnreadSoundMuteControl isMuted={isSoundMuted} onToggle={toggleSoundMuted} />
        {channel.name !== EGeneral.GENERAL && role !== 'GUEST' && (
          <>
            <ActionTooltip label={t('Channels.edit')}>
              <Edit
                onClick={(e) => {
                  handleAction(e, 'editChannel')
                }}
                className="hidden group-hover:block h-4 w-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
            <ActionTooltip label={t('Channels.delete')}>
              <Trash
                onClick={(e) => {
                  handleAction(e, 'deleteChannel')
                }}
                className="hidden group-hover:block h-4 w-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          </>
        )}
      </div>
      {channel.name === EGeneral.GENERAL && <Lock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />}
    </button>
  )
}
