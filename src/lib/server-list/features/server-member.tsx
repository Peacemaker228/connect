'use client'

import type { MemberWithProfileDto, ServerDto, UnreadAttentionLevel } from '@app-core/contracts'
import { FC } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/shared/utils/utils'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import { ERoutes } from '@app-core/routing/routes'
import { UnreadSoundMuteControl } from '@/lib/server-list/features/unread-sound-mute-control'
import {
  createConversationUnreadNotificationMuteScope,
  useUnreadNotificationMutedScope,
} from '@/lib/shared/data-access/unread/unread-notification-sound'

interface IServerMemberProps {
  member: MemberWithProfileDto
  server: ServerDto
  unreadCount?: number
  attentionLevel?: UnreadAttentionLevel
}

export const ServerMember: FC<IServerMemberProps> = ({ member, unreadCount = 0, attentionLevel = 'none' }) => {
  const params = useParams()
  const router = useRouter()

  const icon = roleIconMap()[member.role]
  const hasUnread = unreadCount > 0
  const hasMentionAttention = hasUnread && attentionLevel === 'mention'
  const hasReplyAttention = hasUnread && attentionLevel === 'reply'
  const soundMuteScope = createConversationUnreadNotificationMuteScope(member.serverId, member.id)
  const { isMuted: isSoundMuted, toggleMuted: toggleSoundMuted } = useUnreadNotificationMutedScope(soundMuteScope)

  const handleClick = () => {
    router.push(`${ERoutes.SERVERS}/${params?.serverId}${ERoutes.CONVERSATIONS}/${member.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params?.memberId === member.id && 'bg-zinc-700/20 dark:bg-zinc-700',
      )}>
      {hasUnread && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full',
            hasMentionAttention ? 'bg-amber-500' : hasReplyAttention ? 'bg-sky-500' : 'bg-zinc-900/80 dark:bg-white',
          )}
        />
      )}
      <UserAvatar name={member.profile.name} src={member.profile.imageUrl} className="h-8 w-8 md:h-8 md:w-8" />
      <p
        className={cn(
          'font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition line-clamp-1',
          hasUnread &&
            'font-bold text-zinc-900 group-hover:text-zinc-900 dark:text-zinc-100 dark:group-hover:text-white',
          hasMentionAttention &&
            'text-amber-700 group-hover:text-amber-700 dark:text-amber-300 dark:group-hover:text-amber-200',
          hasReplyAttention &&
            'text-sky-700 group-hover:text-sky-700 dark:text-sky-300 dark:group-hover:text-sky-200',
          params?.memberId === member.id && 'text-primary dark:text-zinc-200 dark:group-hover:text-white',
        )}>
        {member.profile.name}
      </p>
      {icon}
      {unreadCount > 0 && (
        <span
          className={cn(
            'min-w-5 h-5 px-1.5 rounded-full text-[10px] leading-5 text-white font-semibold text-center',
            hasMentionAttention ? 'bg-amber-500' : hasReplyAttention ? 'bg-sky-500' : 'bg-rose-500',
          )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <UnreadSoundMuteControl className={cn('ml-auto')} isMuted={isSoundMuted} onToggle={toggleSoundMuted} />
    </button>
  )
}
