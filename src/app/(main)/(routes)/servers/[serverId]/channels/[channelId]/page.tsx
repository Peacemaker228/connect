import React, { FC } from 'react'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { ERoutes } from '@app-core/routing/routes'
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

  const messageApiUrl = '/api/messages'
  const messageQuery = {
    channelId: channel.id,
    serverId: channel.serverId,
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
            messageApiUrl={messageApiUrl}
            paramKey={'channelId'}
            paramValue={channel.id}
            messageQuery={messageQuery}
          />
          <ChatInput
            messageApiUrl={messageApiUrl}
            type={'channel'}
            messageQuery={messageQuery}
            name={channel.name}
          />
        </>
      )}
      {channel.type === 'AUDIO' && <MediaRoom chatId={channel.id} serverId={serverId} video={false} audio={true} />}
      {channel.type === 'VIDEO' && <MediaRoom chatId={channel.id} serverId={serverId} video={true} audio={true} />}
    </div>
  )
}

export default ChannelIdPage
