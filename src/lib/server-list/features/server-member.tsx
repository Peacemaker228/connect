'use client'

import type { MemberWithProfileDto, ServerDto } from '@app-core/contracts'
import { FC } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/shared/utils/utils'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import { ERoutes } from '@app-core/routing/routes'

interface IServerMemberProps {
  member: MemberWithProfileDto
  server: ServerDto
}

export const ServerMember: FC<IServerMemberProps> = ({ member }) => {
  const params = useParams()
  const router = useRouter()

  const icon = roleIconMap()[member.role]

  const handleClick = () => {
    router.push(`${ERoutes.SERVERS}/${params?.serverId}${ERoutes.CONVERSATIONS}/${member.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
        params?.memberId === member.id && 'bg-zinc-700/20 dark:bg-zinc-700',
      )}>
      <UserAvatar name={member.profile.name} src={member.profile.imageUrl} className="h-8 w-8 md:h-8 md:w-8" />
      <p
        className={cn(
          'font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition',
          params?.memberId === member.id && 'text-primary dark:text-zinc-200 dark:group-hover:text-white',
        )}>
        {member.profile.name}
      </p>
      {icon}
    </button>
  )
}
