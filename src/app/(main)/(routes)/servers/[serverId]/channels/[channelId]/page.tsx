import React, { FC } from 'react'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { ERoutes } from '@/lib/shared/utils/routes'
import { redirect } from 'next/navigation'
import { db } from '@/lib/shared/utils/db'
import { ChatHeader, ChatInput, ChatMessages } from '@/lib/chat/features'
import { MediaRoom } from '@/lib/shared/features/media-room'

interface IChannelIdPageProps {
  params: Promise<{
    serverId: string
    channelId: string
  }>
}

const ChannelIdPage: FC<IChannelIdPageProps> = async ({ params }) => {
  const profile = await currentProfile()

  if (!profile) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { serverId, channelId } = await params

  const channel = await db.channel.findUnique({
    where: {
      id: channelId,
    },
  })

  const member = await db.member.findFirst({
    where: {
      serverId,
      profileId: profile.id,
    },
  })

  if (!channel || !member) {
    redirect(ERoutes.MAIN_PAGE)
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader name={channel.name} serverId={channel.serverId} type={'channel'} />
      {channel.type === 'TEXT' && (
        <>
          <ChatMessages
            member={member}
            name={channel.name}
            chatId={channel.id}
            type={'channel'}
            apiUrl={'/api/messages'}
            paramKey={'channelId'}
            paramValue={channel.id}
            socketUrl={'/api/socket/messages'}
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
          <ChatInput
            apiUrl={'/api/socket/messages'}
            type={'channel'}
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            name={channel.name}
          />
        </>
      )}
      {channel.type === 'AUDIO' && <MediaRoom chatId={channel.id} video={false} audio={true} />}
      {channel.type === 'VIDEO' && <MediaRoom chatId={channel.id} video={true} audio={true} />}
    </div>
  )
}

export default ChannelIdPage
