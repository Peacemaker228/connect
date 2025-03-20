'use client'

import { Separator } from '@/lib/shared/ui/separator'
import { ScrollArea } from '@/lib/shared/ui/scroll-area'
import { ThemeToggle } from '@/lib/shared/features/theme-toggle'
import { useParams } from 'next/navigation'
import { LocaleToggle } from '@/lib/shared/ui/locale-toggle'
import { useServersSocket } from '@/lib/shared/data-access/server-list-sidebar/use-servers-socket'
import { useGetServers } from '@/lib/shared/data-access/server/api'
import { NavigationItem, NavigationAction } from '@/lib/navigation/features'

export const NavigationSidebar = () => {
  const params = useParams<{ serverId: string }>()
  const serverId = params?.serverId

  const { data: servers } = useGetServers()

  useServersSocket(serverId)

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary dark:bg-[#2B2D31] bg-[#E3E5E8] py-3 mr-1 mt-1">
      <NavigationAction />
      <Separator className={'h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto'} />
      <ScrollArea className={'flex-1 w-full'}>
        {servers?.map((server) => (
          <div key={server.id} className={'mb-4'}>
            <NavigationItem id={server.id} name={server.name} imageUrl={server.imageUrl} />
          </div>
        ))}
      </ScrollArea>
      <div className={'pb3 mt-auto flex items-center flex-col gap-y-4'}>
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>
  )
}
