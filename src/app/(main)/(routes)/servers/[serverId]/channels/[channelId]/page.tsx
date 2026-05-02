import React, { FC } from 'react'
import { ERoutes } from '@app-core/routing/routes'
import { redirect } from 'next/navigation'
import { ChatHeader, ChatInput, ChatMessages } from '@/lib/chat/features'
import { MediaRoom } from '@/lib/shared/features/media-room'
import { getServerRouteGuardAuth, getServerRouteGuardServer } from '@/lib/shared/utils/server-route-guard'

interface IChannelIdPageProps {
  params: Promise<{
    serverId: string
    channelId: string
  }>
}

const ChannelIdPage: FC<IChannelIdPageProps> = async ({ params }) => {
  const auth = await getServerRouteGuardAuth()

  if (!auth) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { serverId, channelId } = await params

  const serverResult = await getServerRouteGuardServer(serverId, auth.headers)

  if (serverResult.status === 'unauthorized') {
    return redirect(ERoutes.SIGN_IN)
  }

  if (serverResult.status !== 'ok') {
    redirect(ERoutes.MAIN_PAGE)
  }

  const { server } = serverResult
  const channel = server.channels.find((item) => item.id === channelId && item.serverId === serverId)
  const member = server.members.find((item) => item.profileId === auth.profileId && item.serverId === serverId)

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
