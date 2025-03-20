'use client'

import { TServerMembersProfiles } from '@/types'
import { FC } from 'react'
import { MemberRole } from '@prisma/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/lib/shared/ui/dropdown-menu'
import { ChevronDown, LogOut, PlusCircle, Settings, Trash, UserPlus, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'

interface IServerHeaderProps {
  server: TServerMembersProfiles
  role?: MemberRole
}

export const ServerHeader: FC<IServerHeaderProps> = ({ server, role }) => {
  const { onOpen } = useModal()
  const t = useTranslations('ServerSidebar')

  const isAdmin = role === MemberRole.ADMIN
  const isModerator = isAdmin || role === MemberRole.MODERATOR

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="focus:outline-none">
        <button className="w-full text-sm font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
          {server.name}
          <ChevronDown className="h-5 w-5 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px] dark:bg-gray1E">
        {isModerator && (
          <DropdownMenuItem
            className="text-mainOrange px-3 py-2 text-sm cursor-pointer"
            onClick={() => {
              onOpen('invite', { server })
            }}>
            {t('Menu.invite')}
            <UserPlus className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
            onClick={() => {
              onOpen('editServer', { server })
            }}>
            {t('Menu.setting')}
            <Settings className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
            onClick={() => {
              onOpen('members', { server })
            }}>
            {t('Menu.members')}
            <Users className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isModerator && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
            onClick={() => onOpen('createChannel', { server })}>
            {t('Menu.createChannel')}
            <PlusCircle className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isModerator && <DropdownMenuSeparator />}
        {isAdmin && (
          <DropdownMenuItem
            className="text-red4F px-3 py-2 text-sm cursor-pointer"
            onClick={() => {
              onOpen('deleteServer', { server })
            }}>
            {t('Menu.deleteServer')}
            <Trash className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {!isAdmin && (
          <DropdownMenuItem
            className="text-red4F px-3 py-2 text-sm cursor-pointer"
            onClick={() => {
              onOpen('leaveServer', { server })
            }}>
            {t('Menu.leaveServer')}
            <LogOut className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
