'use client'

import { ChannelType, MemberRole } from '@prisma/client'
import { TSearchType, TServerMembersProfiles } from '@/types'
import { FC } from 'react'
import { ActionTooltip } from '@/components/action-tooltip'
import { Plus, Settings } from 'lucide-react'
import { useModal } from '@/hooks/use-modal-store'

interface IServerSectionProps {
  label: string
  role?: MemberRole
  sectionType: TSearchType
  channelType?: ChannelType
  server?: TServerMembersProfiles
}

export const ServerSection: FC<IServerSectionProps> = ({ label, sectionType, channelType, server, role }) => {
  const { onOpen } = useModal()

  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
      {role !== 'GUEST' && sectionType === 'channel' && (
        <ActionTooltip label={'Create channel'}>
          <button
            onClick={() => {
              onOpen('createChannel', { channelType })
            }}
            className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition">
            <Plus className="h-4 w-4" />
          </button>
        </ActionTooltip>
      )}
      {role === 'ADMIN' && sectionType === 'member' && (
        <ActionTooltip label={'Manege members'}>
          <button
            onClick={() => {
              onOpen('members', { server })
            }}
            className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition">
            <Settings className="h-4 w-4" />
          </button>
        </ActionTooltip>
      )}
    </div>
  )
}
