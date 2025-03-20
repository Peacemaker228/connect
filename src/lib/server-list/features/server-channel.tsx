'use client'

import { Channel, ChannelType, MemberRole, Server } from '@prisma/client'
import React, { FC } from 'react'
import { Edit, Hash, Lock, Mic, Trash, Video } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/shared/utils/utils'
import { EGeneral } from '@/types'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { ERoutes } from '@/lib/shared/utils/routes'
import { useTranslations } from 'next-intl'
import { TModalType, useModal } from '@/lib/shared/utils/hooks/use-modal-store'

interface IServerChannelProps {
  channel: Channel
  server: Server
  role?: MemberRole
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
}

export const ServerChannel: FC<IServerChannelProps> = ({ channel, server, role }) => {
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('ServerSidebar')

  const Icon = iconMap[channel.type]

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
        'group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params?.channelId === channel.id && 'bg-zinc-700/20 dark:bg-zinc-700/60',
      )}>
      <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
      <p
        className={cn(
          'line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition',
          params?.channelId === channel.id && 'text-primary dark:text-zinc-200 dark:group-hover:text-white',
        )}>
        {channel.name}
      </p>
      {channel.name !== EGeneral.GENERAL && role !== 'GUEST' && (
        <div className="ml-auto flex items-center gap-x-2">
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
        </div>
      )}
      {channel.name === EGeneral.GENERAL && <Lock className="ml-auto h-4 w-4 text-zinc-500 dark:text-zinc-400 " />}
    </button>
  )
}
