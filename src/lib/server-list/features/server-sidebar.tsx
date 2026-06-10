'use client'

import { FC, useEffect } from 'react'
import { ScrollArea } from '@/lib/shared/ui/scroll-area'
import { ChannelType } from '@app-core/contracts'
import { Hash, Mic, Settings, Video } from 'lucide-react'
import { Separator } from '@/lib/shared/ui/separator'
import {
  ServerSection,
  ServerChannel,
  ServerMember,
  ServerHeader,
  ServerSearch,
  IServerData,
} from '@/lib/server-list/features/index'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { useTranslations } from 'next-intl'
import { useGetServer, useGetServers } from '@sdk/queries/server'
import { useSidebarSocket } from '@/lib/shared/data-access/navigation-sidebar/use-sidebar-socket'
import { useGetProfile } from '@sdk/queries/profile'
import { useParams, useRouter } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { BackendUserMenu } from '@/lib/shared/features/backend-user-menu'
import { useUnreadSummary } from '@sdk/queries/unread'
import { useUnreadSocket } from '@/lib/shared/data-access/unread/use-unread-socket'

interface IServerSidebarProps {
  serverId: string
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
}

export const ServerSidebar: FC<IServerSidebarProps> = ({ serverId }) => {
  const router = useRouter()
  const params = useParams<{ channelId?: string; memberId?: string }>()
  const { data: server, isLoading, isError } = useGetServer(serverId)
  const { data: servers, isLoading: isServersLoading } = useGetServers()
  const { data: unreadSummary } = useUnreadSummary(serverId)
  const t = useTranslations('ServerSidebar')

  useSidebarSocket(serverId)

  const { profile } = useGetProfile()

  useEffect(() => {
    if (!serverId || isServersLoading || !servers) {
      return
    }

    const hasCurrentServer = servers.some((item) => item.id === serverId)

    if (hasCurrentServer) {
      return
    }

    const fallbackServerId = servers[0]?.id
    router.replace(fallbackServerId ? `${ERoutes.SERVERS}/${fallbackServerId}` : ERoutes.MAIN_PAGE)
  }, [router, serverId, servers, isServersLoading])

  const textChannels = server?.channels.filter(({ type }) => type === ChannelType.TEXT)
  const audioChannels = server?.channels.filter(({ type }) => type === ChannelType.AUDIO)
  const videoChannels = server?.channels.filter(({ type }) => type === ChannelType.VIDEO)

  const members = server?.members.filter(({ profileId }) => profileId !== profile?.id)
  const currentMember = server?.members.find(({ profileId }) => profileId === profile?.id)
  const role = currentMember?.role

  useUnreadSocket({
    activeChannelId: params?.channelId,
    activeMemberId: params?.memberId,
    currentMemberId: currentMember?.id,
    serverId,
  })

  const unreadCountByChannelId = new Map(
    unreadSummary?.channels.map((channel) => [channel.channelId, channel.unreadCount]) ?? [],
  )
  const unreadCountByMemberId = new Map(
    unreadSummary?.conversations.map((conversation) => [conversation.memberId, conversation.unreadCount]) ?? [],
  )

  const searchData: IServerData[] = [
    {
      label: t(`Channels.channels`, { type: t('Channels.text') }),
      type: 'channel',
      data: textChannels?.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.TEXT] })),
    },
    {
      label: t(`Channels.channels`, { type: t('Channels.voice') }),
      type: 'channel',
      data: audioChannels?.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.AUDIO] })),
    },
    {
      label: t(`Channels.channels`, { type: t('Channels.video') }),
      type: 'channel',
      data: videoChannels?.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.VIDEO] })),
    },
    {
      label: t('Members'),
      type: 'member',
      data: members?.map(({ id, profile, role }) => ({ id, name: profile?.name, icon: roleIconMap()[role] })),
    },
  ]

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      {isLoading && !server && <Spinner />}
      {isError && !server && <ErrorComponent />}
      {server && (
        <>
          <ServerHeader server={server} role={role} />
          <ScrollArea className="flex-1 px-3">
            <div className="mt-2">
              <ServerSearch data={searchData} />
            </div>
            <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
            <div className="space-y-[2px]">
              {!!textChannels?.length && (
                <div className="mb-2">
                  <ServerSection
                    channelType={'TEXT'}
                    sectionType={'channel'}
                    role={role}
                    label={t(`Channels.channels`, { type: t('Channels.text') })}
                    server={server}
                  />
                  {textChannels.map((c) => (
                    <ServerChannel
                      key={c.id}
                      channel={c}
                      role={role}
                      server={server}
                      unreadCount={params?.channelId === c.id ? 0 : (unreadCountByChannelId.get(c.id) ?? 0)}
                    />
                  ))}
                </div>
              )}
              {!!audioChannels?.length && (
                <div className="mb-2">
                  <ServerSection
                    channelType={'AUDIO'}
                    sectionType={'channel'}
                    role={role}
                    label={t(`Channels.channels`, { type: t('Channels.voice') })}
                    server={server}
                  />
                  {audioChannels.map((c) => (
                    <ServerChannel key={c.id} channel={c} role={role} server={server} unreadCount={0} />
                  ))}
                </div>
              )}
              {!!videoChannels?.length && (
                <div className="mb-2">
                  <ServerSection
                    channelType={'VIDEO'}
                    sectionType={'channel'}
                    role={role}
                    label={t(`Channels.channels`, { type: t('Channels.video') })}
                    server={server}
                  />
                  {videoChannels.map((c) => (
                    <ServerChannel key={c.id} channel={c} role={role} server={server} unreadCount={0} />
                  ))}
                </div>
              )}
              {!!members?.length && (
                <div className="mb-2">
                  <ServerSection sectionType={'member'} role={role} label={t('Members')} server={server} />
                  {members.map((m) => (
                    <ServerMember
                      key={m.id}
                      member={m}
                      server={server}
                      unreadCount={params?.memberId === m.id ? 0 : (unreadCountByMemberId.get(m.id) ?? 0)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <Separator className={'h-[2px] bg-white dark:bg-[#232428] rounded-md'} />
          <div className="px-[16px] py-[12px] flex justify-between items-center dark:bg-[#2B2D31] bg-[#E3E5E8]">
            <BackendUserMenu email={profile?.email} imageUrl={profile?.imageUrl} name={profile?.name} />
            <div
              className={
                'flex justify-center items-center mx-3 h-[36px] w-[36px] rounded-[24px] cursor-pointer bg-background dark:bg-neutral-700'
              }>
              <Settings className={'w-5 h-5'} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
