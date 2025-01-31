'use server'

import { FC } from 'react'
import { currentProfile } from '@/lib/current-profile'
import { redirect } from 'next/navigation'
import { ERoutes } from '@/lib/routes'
import { db } from '@/lib/db'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannelType } from '@prisma/client'
import { Hash, Mic, Video } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  ServerSection,
  ServerChannel,
  ServerMember,
  ServerHeader,
  ServerSearch,
  IServerData,
} from '@/components/server'
import { roleIconMap } from '@/lib/role-icon-map'

interface IServerSidebarProps {
  serverId: string
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
}

export const ServerSidebar: FC<IServerSidebarProps> = async ({ serverId }) => {
  const profile = await currentProfile()

  if (!profile) {
    redirect(ERoutes.MAIN_PAGE)
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      channels: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: 'asc',
        },
      },
    },
  })

  if (!server) {
    redirect(ERoutes.MAIN_PAGE)
  }

  const textChannels = server.channels.filter(({ type }) => type === ChannelType.TEXT)
  const audioChannels = server.channels.filter(({ type }) => type === ChannelType.AUDIO)
  const videoChannels = server.channels.filter(({ type }) => type === ChannelType.VIDEO)
  //
  const members = server.members.filter(({ profileId }) => profileId !== profile.id)

  const role = server.members.find(({ profileId }) => profileId === profile.id)?.role

  const searchData: IServerData[] = [
    {
      label: 'Text Channels',
      type: 'channel',
      data: textChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.TEXT] })),
    },
    {
      label: 'Voice Channels',
      type: 'channel',
      data: audioChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.AUDIO] })),
    },
    {
      label: 'Video Channels',
      type: 'channel',
      data: videoChannels.map(({ id, name }) => ({ id, name, icon: iconMap[ChannelType.VIDEO] })),
    },
    {
      label: 'Members',
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
                label={'Text Channels'}
                server={server}
              />
              {textChannels.map((c) => (
                <ServerChannel key={c.id} channel={c} role={role} server={server} />
              ))}
            </div>
          )}
          {!!audioChannels.length && (
            <div className="mb-2">
              <ServerSection
                channelType={'AUDIO'}
                sectionType={'channel'}
                role={role}
                label={'Voice Channels'}
                server={server}
              />
              {audioChannels.map((c) => (
                <ServerChannel key={c.id} channel={c} role={role} server={server} />
              ))}
            </div>
          )}
          {!!videoChannels.length && (
            <div className="mb-2">
              <ServerSection
                channelType={'VIDEO'}
                sectionType={'channel'}
                role={role}
                label={'Video Channels'}
                server={server}
              />
              {videoChannels.map((c) => (
                <ServerChannel key={c.id} channel={c} role={role} server={server} />
              ))}
            </div>
          )}
          {!!members.length && (
            <div className="mb-2">
              <ServerSection sectionType={'member'} role={role} label={'Members'} server={server} />
              {members.map((m) => (
                <ServerMember key={m.id} member={m} server={server} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
