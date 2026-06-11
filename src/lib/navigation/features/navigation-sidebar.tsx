'use client'

import { useEffect } from 'react'
import { Separator } from '@/lib/shared/ui/separator'
import { ScrollArea } from '@/lib/shared/ui/scroll-area'
import { DesktopDownloadButton } from '@/lib/shared/features/desktop-download-button'
import { ThemeToggle } from '@/lib/shared/features/theme-toggle'
import { useParams, useRouter } from 'next/navigation'
import { LocaleToggle } from '@/lib/shared/ui/locale-toggle'
import { useServersSocket } from '@/lib/shared/data-access/server-list-sidebar/use-servers-socket'
import { useGetServers } from '@sdk/queries/server'
import { useGlobalUnreadSummary } from '@sdk/queries/unread'
import { NavigationItem, NavigationAction } from '@/lib/navigation/features'
import { ERoutes } from '@app-core/routing/routes'
import { useGlobalUnreadSocket } from '@/lib/shared/data-access/unread/use-global-unread-socket'

export const NavigationSidebar = () => {
  const router = useRouter()
  const params = useParams<{ channelId?: string; memberId?: string; serverId: string }>()
  const serverId = params?.serverId

  const { data: servers } = useGetServers()
  const { data: globalUnreadSummary } = useGlobalUnreadSummary()

  useServersSocket(serverId, servers)
  useGlobalUnreadSocket({
    activeChannelId: params?.channelId,
    activeMemberId: params?.memberId,
    activeServerId: serverId,
    servers: globalUnreadSummary?.servers,
  })

  useEffect(() => {
    if (!serverId || !servers) {
      return
    }

    const hasCurrentServer = servers.some((server) => server.id === serverId)

    if (!hasCurrentServer) {
      router.replace(ERoutes.MAIN_PAGE)
    }
  }, [router, serverId, servers])

  const unreadCountByServerId = new Map(
    globalUnreadSummary?.servers.map((server) => [server.serverId, server.unreadCount]) ?? [],
  )
  const attentionLevelByServerId = new Map(
    globalUnreadSummary?.servers.map((server) => [server.serverId, server.attentionLevel]) ?? [],
  )

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary dark:bg-[#2B2D31] bg-[#E3E5E8] py-3 border-r-2 border-neutral-200 dark:border-neutral-800">
      <NavigationAction />
      <Separator className={'h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto'} />
      <ScrollArea className={'flex-1 w-full'}>
        {servers?.map((server) => (
          <div key={server.id} className={'mb-4'}>
            <NavigationItem
              id={server.id}
              initialChannelId={server.initialChannelId}
              name={server.name}
              imageUrl={server.imageUrl}
              unreadCount={unreadCountByServerId.get(server.id) ?? 0}
              attentionLevel={attentionLevelByServerId.get(server.id)}
            />
          </div>
        ))}
      </ScrollArea>
      <div className={'pb3 mt-auto flex items-center flex-col gap-y-4'}>
        <DesktopDownloadButton compact />
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>
  )
}
