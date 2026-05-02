'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/lib/shared/ui/dialog'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { Check, GavelIcon, Loader2, MoreVertical, Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { TServerMembersProfiles } from '@/types'
import { ScrollArea } from '@/lib/shared/ui/scroll-area'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { MemberRole } from '@app-core/contracts'
import { ReactNode, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/lib/shared/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useKickMember, useUpdateMemberRole } from '@sdk/mutations/membership'

const roleIconMap: Record<MemberRole, ReactNode | null> = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 text-rose-500" />,
}

export const MembersModal = () => {
  const [loadingId, setLoadingId] = useState('')
  const { isOpen, onClose, type, data, onOpen } = useModal()
  const router = useRouter()
  const { mutateAsync: kickMember } = useKickMember()
  const { mutateAsync: updateMemberRole } = useUpdateMemberRole()
  const t = useTranslations('Modals.MembersModal')
  const commonTrans = useTranslations('Common')

  const { server } = data as { server: TServerMembersProfiles }

  const isModalOpen = isOpen && type === 'members'

  const handleKick = async (memberId: string) => {
    if (!server?.id) {
      return
    }

    try {
      setLoadingId(memberId)

      const updatedServer = await kickMember({ serverId: server.id, memberId, currentServer: server })

      router.refresh()
      onOpen('members', { server: updatedServer })
    } catch (err) {
      console.log(err)
    } finally {
      setLoadingId('')
    }
  }

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    if (!server?.id) {
      return
    }

    try {
      setLoadingId(memberId)

      const updatedServer = await updateMemberRole({ serverId: server.id, memberId, role, currentServer: server })

      router.refresh()
      onOpen('members', { server: updatedServer })
    } catch (err) {
      console.log(err)
    } finally {
      setLoadingId('')
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">{t('title')}</DialogTitle>
          <DialogDescription className="text-center text-zinc-500 dark:text-grayBD">
            {t('description')}: {server?.members?.length}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {server?.members?.map((m) => (
            <div key={m.id} className="flex items-center gap-x-2 mb-6">
              <UserAvatar name={m.profile.name} src={m.profile.imageUrl} />
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1">
                  {m.profile.name}
                  {roleIconMap[m.role]}
                </div>
                <p className="text-xs text-zinc-500 dark:text-grayBD">{m.profile.email}</p>
              </div>
              {server.profileId !== m.profileId && loadingId !== m.id && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-4 w-4 text-zinc-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side={'left'} className="dark:bg-[#212121]">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center">
                          <ShieldQuestion className="w-4 h-4 mr-2" />
                          <span>{commonTrans('role.title')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className={'dark:bg-[#212121]'}>
                            <DropdownMenuItem
                              onClick={() => {
                                return handleRoleChange(m.id, MemberRole.GUEST)
                              }}>
                              <Shield className="h-4 w-4 mr-2" />
                              {commonTrans('role.GUEST')}
                              {m.role === MemberRole.GUEST && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                return handleRoleChange(m.id, MemberRole.MODERATOR)
                              }}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              {commonTrans('role.MODERATOR')}
                              {m.role === MemberRole.MODERATOR && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          return handleKick(m.id)
                        }}>
                        <GavelIcon className="h-4 w-4 mr-2" /> {t('kick')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {loadingId === m.id && <Loader2 className="animate-spin h-4 w-4 text-zinc-500 ml-auto" />}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
