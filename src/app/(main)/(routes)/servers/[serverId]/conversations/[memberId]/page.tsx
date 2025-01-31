import React, { FC } from 'react'
import { currentProfile } from '@/lib/current-profile'
import { ERoutes } from '@/lib/routes'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrCreateConversation } from '@/lib/conversation'
import { ChatHeader, ChatInput, ChatMessages } from '@/components/chat'
import { MediaRoom } from '@/components/media-room'

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
  const profile = await currentProfile()

  if (!profile) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { memberId, serverId } = await params
  const { video } = await searchParams

  if (!memberId || !serverId) {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId,
      profileId: profile.id,
    },
    include: {
      profile: true,
    },
  })

  if (!currentMember) {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const conversation = await getOrCreateConversation(currentMember.id, memberId)

  if (!conversation) {
    return redirect(`${ERoutes.SERVERS}/${serverId}`)
  }

  const { memberOne, memberTwo } = conversation

  const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.profile.imageUrl}
        name={otherMember.profile.name}
        serverId={serverId}
        type={'conversation'}
      />
      {video && <MediaRoom chatId={conversation.id} video={true} audio={true} />}
      {!video && (
        <>
          <ChatMessages
            name={otherMember.profile.name}
            member={currentMember}
            chatId={conversation.id}
            apiUrl={`/api/direct-messages`}
            socketUrl={'/api/socket/direct-messages'}
            socketQuery={{
              conversationId: conversation.id,
            }}
            paramKey={'conversationId'}
            paramValue={conversation.id}
            type={'conversation'}
          />
          <ChatInput
            apiUrl={'/api/socket/direct-messages'}
            query={{
              conversationId: conversation.id,
            }}
            name={otherMember.profile.name}
            type={'conversation'}
          />
        </>
      )}
    </div>
  )
}

export default MemberIdPage
