'use client'

import { type FC, type ReactNode, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { getServerQueryKey, getServersQueryKey, useGetServer, useGetServers } from '@sdk/queries/server'
import { useSidebarSocket } from '@/lib/shared/data-access/navigation-sidebar/use-sidebar-socket'
import { useGetProfile } from '@sdk/queries/profile'
import { useParams, useRouter } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { BackendUserMenu } from '@/lib/shared/features/backend-user-menu'
import { DesktopUpdateReadyAction } from '@/lib/shared/features/desktop-update-ready-action'
import { getGlobalUnreadSummaryQueryKey, getUnreadSummaryQueryKey, useUnreadSummary } from '@sdk/queries/unread'
import { useUnreadSocket } from '@/lib/shared/data-access/unread/use-unread-socket'
import { useActiveChatReadStateSnapshot } from '@/lib/shared/data-access/unread/active-chat-read-state'

interface IServerSidebarProps {
  serverId: string
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
}

const ServerSidebarAuthExpiredState = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <button
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        onClick={onSignIn}
        type="button">
        Sign in
      </button>
    </div>
  )
}

export const ServerSidebar: FC<IServerSidebarProps> = ({ serverId }) => {
  const router = useRouter()
  const params = useParams<{ channelId?: string; memberId?: string }>()
  const queryClient = useQueryClient()
  const {
    data: server,
    isFetching: isServerFetching,
    isLoading: isServerLoading,
    isError: isServerError,
  } = useGetServer(serverId)
  const { data: servers, isLoading: isServersLoading } = useGetServers()
  const { data: unreadSummary } = useUnreadSummary(serverId)
  const activeChatReadState = useActiveChatReadStateSnapshot()
  const t = useTranslations('ServerSidebar')

  useSidebarSocket(serverId)

  const {
    profile,
    isError: isProfileError,
    isFetching: isProfileFetching,
    isLoading: isProfileLoading,
  } = useGetProfile()

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

  const currentMember = profile ? server?.members.find(({ profileId }) => profileId === profile.id) : undefined
  const role = currentMember?.role

  useUnreadSocket({
    activeChannelId: params?.channelId,
    activeMemberId: params?.memberId,
    currentMemberId: currentMember?.id,
    serverId,
  })

  useEffect(() => {
    if (!currentMember?.id) {
      return
    }

    void queryClient.invalidateQueries({ queryKey: getUnreadSummaryQueryKey(serverId) })
    void queryClient.invalidateQueries({ queryKey: getGlobalUnreadSummaryQueryKey() })
    void queryClient.invalidateQueries({ queryKey: getServersQueryKey() })
    void queryClient.invalidateQueries({ queryKey: getServerQueryKey(serverId) })
  }, [currentMember?.id, queryClient, serverId])

  const renderSidebarState = (content: ReactNode) => {
    return <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">{content}</div>
  }

  if (isServerLoading && !server) {
    return renderSidebarState(<Spinner />)
  }

  if (isServerError && !server) {
    return renderSidebarState(<ErrorComponent />)
  }

  if (!server) {
    return renderSidebarState(<Spinner />)
  }

  if (isProfileError && !profile) {
    return renderSidebarState(<ErrorComponent />)
  }

  if (profile === undefined || (profile === null && (isProfileLoading || isProfileFetching))) {
    return renderSidebarState(<Spinner />)
  }

  if (profile === null) {
    return renderSidebarState(<ServerSidebarAuthExpiredState onSignIn={() => router.replace(ERoutes.SIGN_IN)} />)
  }

  if (!currentMember) {
    return renderSidebarState(isServerFetching ? <Spinner /> : <ErrorComponent />)
  }

  const textChannels = server.channels.filter(({ type }) => type === ChannelType.TEXT)
  const audioChannels = server.channels.filter(({ type }) => type === ChannelType.AUDIO)
  const videoChannels = server.channels.filter(({ type }) => type === ChannelType.VIDEO)
  const members = server.members.filter(({ profileId }) => profileId !== profile.id)

  const unreadCountByChannelId = new Map(
    unreadSummary?.channels.map((channel) => [channel.channelId, channel.unreadCount]) ?? [],
  )
  const attentionLevelByChannelId = new Map(
    unreadSummary?.channels.map((channel) => [channel.channelId, channel.attentionLevel]) ?? [],
  )
  const unreadCountByMemberId = new Map(
    unreadSummary?.conversations.map((conversation) => [conversation.memberId, conversation.unreadCount]) ?? [],
  )
  const attentionLevelByMemberId = new Map(
    unreadSummary?.conversations.map((conversation) => [conversation.memberId, conversation.attentionLevel]) ?? [],
  )
  const conversationIdByMemberId = new Map(
    unreadSummary?.conversations.map((conversation) => [conversation.memberId, conversation.conversationId]) ?? [],
  )

  const shouldHideActiveChannelUnread = (channelId: string) => {
    return (
      params?.channelId === channelId &&
      activeChatReadState?.serverId === serverId &&
      activeChatReadState.paramKey === 'channelId' &&
      activeChatReadState.paramValue === channelId &&
      activeChatReadState.isNearBottom
    )
  }

  const shouldHideActiveMemberUnread = (memberId: string) => {
    const conversationId = conversationIdByMemberId.get(memberId)

    return (
      params?.memberId === memberId &&
      !!conversationId &&
      activeChatReadState?.serverId === serverId &&
      activeChatReadState.paramKey === 'conversationId' &&
      activeChatReadState.paramValue === conversationId &&
      activeChatReadState.isNearBottom
    )
  }

  const searchData: IServerData[] = [
    {
      label: t(`Channels.channels`, { type: t('Channels.text') }),
      type: 'channel',
      data: textChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.TEXT] })),
    },
    {
      label: t(`Channels.channels`, { type: t('Channels.voice') }),
      type: 'channel',
      data: audioChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.AUDIO] })),
    },
    {
      label: t(`Channels.channels`, { type: t('Channels.video') }),
      type: 'channel',
      data: videoChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.VIDEO] })),
    },
    {
      label: t('Members'),
      type: 'member',
      data: members.map(({ id, profile, role }) => ({ id, name: profile?.name, icon: roleIconMap()[role] })),
    },
  ]

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch data={searchData} />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        <div className="space-y-[2px]">
          {!!textChannels.length && (
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
                  unreadCount={shouldHideActiveChannelUnread(c.id) ? 0 : (unreadCountByChannelId.get(c.id) ?? 0)}
                  attentionLevel={shouldHideActiveChannelUnread(c.id) ? 'none' : attentionLevelByChannelId.get(c.id)}
                />
              ))}
            </div>
          )}
          {!!audioChannels.length && (
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
          {!!videoChannels.length && (
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
          {!!members.length && (
            <div className="mb-2">
              <ServerSection sectionType={'member'} role={role} label={t('Members')} server={server} />
              {members.map((m) => (
                <ServerMember
                  key={m.id}
                  member={m}
                  server={server}
                  unreadCount={shouldHideActiveMemberUnread(m.id) ? 0 : (unreadCountByMemberId.get(m.id) ?? 0)}
                  attentionLevel={shouldHideActiveMemberUnread(m.id) ? 'none' : attentionLevelByMemberId.get(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      <Separator className={'h-[2px] bg-white dark:bg-[#232428] rounded-md'} />
      <div className="px-[16px] py-[12px] flex items-center gap-3 dark:bg-[#2B2D31] bg-[#E3E5E8]">
        <BackendUserMenu email={profile.email} imageUrl={profile.imageUrl} name={profile.name} />
        <DesktopUpdateReadyAction />
        <div
          className={
            'ml-auto flex justify-center items-center h-[36px] w-[36px] rounded-[24px] cursor-pointer bg-background dark:bg-neutral-700'
          }>
          <Settings className={'w-5 h-5'} />
        </div>
      </div>
    </div>
  )
}
