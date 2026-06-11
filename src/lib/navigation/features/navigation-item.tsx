'use client'

import { FC, useEffect, useMemo, useState } from 'react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { cn } from '@/lib/shared/utils/utils'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { buildStorageAccessPath } from '@/lib/shared/utils/upload-file'
import { usePrefetchServerEntry } from '@/lib/shared/data-access/navigation-sidebar/use-prefetch-server-entry'
import type { UnreadAttentionLevel } from '@app-core/contracts'

const SERVER_AVATAR_COLOR_CLASSES = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
] as const

const getServerAvatarInitials = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return 'SV'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const getColorIndex = (value: string) => {
  const hash = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return hash % SERVER_AVATAR_COLOR_CLASSES.length
}

interface INavigationItemProps {
  id: string
  imageUrl: string
  initialChannelId?: string | null
  name: string
  unreadCount?: number
  attentionLevel?: UnreadAttentionLevel
}

export const NavigationItem: FC<INavigationItemProps> = ({
  id,
  imageUrl,
  initialChannelId,
  name,
  unreadCount = 0,
  attentionLevel = 'none',
}) => {
  const params = useParams<{ serverId?: string }>()
  const router = useRouter()
  const currentServerId = params?.serverId
  const [hasImageError, setHasImageError] = useState(false)
  const fileAccessPath = buildStorageAccessPath(imageUrl, 'serverImage')
  const avatarInitials = useMemo(() => getServerAvatarInitials(name), [name])
  const avatarColorClassName = useMemo(() => SERVER_AVATAR_COLOR_CLASSES[getColorIndex(`${name}:${id}`)], [name, id])
  const shouldShowImage = Boolean(fileAccessPath) && !hasImageError
  const { prefetchServerEntry, waitForServerEntryPrefetch } = usePrefetchServerEntry({
    currentServerId,
    initialChannelId,
    serverId: id,
  })
  const hasUnread = unreadCount > 0
  const hasMentionAttention = hasUnread && attentionLevel === 'mention'

  useEffect(() => {
    setHasImageError(false)
  }, [fileAccessPath])

  const handleServerClick = async () => {
    await waitForServerEntryPrefetch()
    router.push(initialChannelId ? `/servers/${id}/channels/${initialChannelId}` : `/servers/${id}`)
  }

  return (
    <ActionTooltip side="right" align={'center'} label={name}>
      <button
        className="group relative flex items-center"
        onClick={handleServerClick}
        onFocus={() => void prefetchServerEntry()}
        onPointerEnter={() => void prefetchServerEntry()}>
        <div
          className={cn(
            'absolute left-0 rounded-r-full transition-all w-[4px]',
            hasMentionAttention ? 'bg-amber-500' : 'bg-mainOrange',
            params?.serverId !== id && 'group-hover:h-[20px]',
            params?.serverId === id ? 'h-[36px]' : hasUnread ? 'h-[16px]' : 'h-[8px]',
          )}
        />
        <div
          className={cn(
            'relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] overflow-hidden group-hover:rounded-[16px] transition-all',
          )}>
          {shouldShowImage ? (
            <Image src={fileAccessPath} fill alt={name} unoptimized onError={() => setHasImageError(true)} />
          ) : (
            <div
              className={cn(
                'h-full w-full flex items-center justify-center text-white font-semibold text-sm select-none',
                avatarColorClassName,
              )}>
              {avatarInitials}
            </div>
          )}
        </div>
        {hasUnread && (
          <span
            className={cn(
              'absolute right-2 top-0 min-w-5 h-5 px-1 rounded-full border-2 border-[#E3E5E8] dark:border-[#2B2D31] text-[10px] leading-4 text-white font-bold text-center',
              hasMentionAttention ? 'bg-amber-500' : 'bg-rose-500',
            )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </ActionTooltip>
  )
}
