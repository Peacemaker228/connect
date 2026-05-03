import React, { FC } from 'react'
import { ERoutes } from '@app-core/routing/routes'
import { redirect } from 'next/navigation'
import { getOrCreateConversation } from '@/lib/shared/utils/conversation'
import { ChatHeader, ChatInput, ChatMessages } from '@/lib/chat/features'
import { MediaRoom } from '@/lib/shared/features/media-room'
import { getServerRouteGuardAuth, getServerRouteGuardServer } from '@/lib/shared/utils/server-route-guard'

interface IMemberIdPageProps {
  params: Promise<{
    memberId: string
    serverId: string
  }>
  searchParams: Promise<{
    video?: boolean
  }>
}

const MemberIdPage: FC<IMemberIdPageProps> = async ({ params, searchParams }) => {
  const auth = await getServerRouteGuardAuth()

  if (!auth) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { memberId, serverId } = await params
  const { video } = await searchParams

  if (!memberId || !serverId) {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const serverResult = await getServerRouteGuardServer(serverId, auth.headers)

  if (serverResult.status === 'unauthorized') {
    return redirect(ERoutes.SIGN_IN)
  }

  if (serverResult.status !== 'ok') {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const currentMember = serverResult.server.members.find(
    (member) => member.profileId === auth.profileId && member.serverId === serverId,
  )

  if (!currentMember) {
    return redirect(ERoutes.MAIN_PAGE)
  }

  if (currentMember.id === memberId) {
    return redirect(`${ERoutes.SERVERS}/${serverId}`)
  }

  const conversationResult = await getOrCreateConversation({
    authHeaders: auth.headers,
    memberId,
    serverId,
  })

  if (conversationResult.status === 'unauthorized') {
    return redirect(ERoutes.SIGN_IN)
  }

  if (conversationResult.status !== 'ok') {
    return redirect(`${ERoutes.SERVERS}/${serverId}`)
  }

  const { conversation } = conversationResult
  const { memberOne, memberTwo } = conversation

  const otherMember = memberOne.profileId === auth.profileId ? memberTwo : memberOne
  const messageApiUrl = '/api/direct-messages'
  const messageQuery = {
    conversationId: conversation.id,
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.profile.imageUrl}
        name={otherMember.profile.name}
        serverId={serverId}
        type={'conversation'}
      />
      {video && (
        <MediaRoom
          chatId={conversation.id}
          leaveRedirectHref={`${ERoutes.SERVERS}/${serverId}${ERoutes.CONVERSATIONS}/${memberId}`}
          serverId={serverId}
          video={true}
          audio={true}
        />
      )}
      {!video && (
        <>
          <ChatMessages
            name={otherMember.profile.name}
            member={currentMember}
            chatId={conversation.id}
            messageApiUrl={messageApiUrl}
            messageQuery={messageQuery}
            paramKey={'conversationId'}
            paramValue={conversation.id}
            type={'conversation'}
          />
          <ChatInput
            messageApiUrl={messageApiUrl}
            messageQuery={messageQuery}
            name={otherMember.profile.name}
            type={'conversation'}
          />
        </>
      )}
    </div>
  )
}

export default MemberIdPage
