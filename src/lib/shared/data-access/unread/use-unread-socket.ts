import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ServerUnreadSummary } from '@sdk/queries/unread'
import { getUnreadSummaryQueryKey, useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'
import {
  getMemberDirectUnreadRealtimeKey,
  getServerUnreadRealtimeKey,
  type UnreadMessageCreatedRealtimePayload,
} from '@app-core/contracts'
import { useSocket } from '@/lib/shared/providers'

type UseUnreadSocketParams = {
  activeChannelId?: string
  activeMemberId?: string
  currentMemberId?: string
  serverId: string
}

export const useUnreadSocket = ({
  activeChannelId,
  activeMemberId,
  currentMemberId,
  serverId,
}: UseUnreadSocketParams) => {
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const { mutate: markChannelRead } = useMarkChannelRead()
  const { mutate: markConversationRead } = useMarkConversationRead()

  useEffect(() => {
    if (!socket || !serverId || !currentMemberId) {
      return
    }

    const serverUnreadKey = getServerUnreadRealtimeKey(serverId)
    const directUnreadKey = getMemberDirectUnreadRealtimeKey(currentMemberId)

    const handleChannelUnreadMessage = (payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'channel' }>) => {
      if (payload.action !== 'message_created' || payload.senderMemberId === currentMemberId) {
        return
      }

      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          return summary
        }

        if (payload.channelId === activeChannelId) {
          markChannelRead({ serverId, channelId: payload.channelId })
          return summary
        }

        return {
          ...summary,
          channels: summary.channels.map((channel) =>
            channel.channelId === payload.channelId
              ? {
                  ...channel,
                  unreadCount: channel.unreadCount + payload.unreadCount,
                  mentionCount: channel.mentionCount + payload.mentionCount,
                  replyCount: channel.replyCount + payload.replyCount,
                  attentionLevel: payload.attentionLevel,
                }
              : channel,
          ),
        }
      })
    }

    const handleDirectUnreadMessage = (
      payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'conversation' }>,
    ) => {
      if (payload.action !== 'message_created' || payload.senderMemberId === currentMemberId) {
        return
      }

      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          return summary
        }

        if (payload.senderMemberId === activeMemberId) {
          markConversationRead({ serverId, conversationId: payload.conversationId })
          return summary
        }

        const existingConversation = summary.conversations.find(
          (conversation) => conversation.conversationId === payload.conversationId,
        )

        if (!existingConversation) {
          return {
            ...summary,
            conversations: [
              ...summary.conversations,
              {
                conversationId: payload.conversationId,
                memberId: payload.senderMemberId,
                unreadCount: payload.unreadCount,
                mentionCount: payload.mentionCount,
                replyCount: payload.replyCount,
                attentionLevel: payload.attentionLevel,
              },
            ],
          }
        }

        return {
          ...summary,
          conversations: summary.conversations.map((conversation) =>
            conversation.conversationId === payload.conversationId
              ? {
                  ...conversation,
                  unreadCount: conversation.unreadCount + payload.unreadCount,
                  mentionCount: conversation.mentionCount + payload.mentionCount,
                  replyCount: conversation.replyCount + payload.replyCount,
                  attentionLevel: payload.attentionLevel,
                }
              : conversation,
          ),
        }
      })
    }

    socket.on(serverUnreadKey, handleChannelUnreadMessage)
    socket.on(directUnreadKey, handleDirectUnreadMessage)

    return () => {
      socket.off(serverUnreadKey, handleChannelUnreadMessage)
      socket.off(directUnreadKey, handleDirectUnreadMessage)
    }
  }, [
    activeChannelId,
    activeMemberId,
    currentMemberId,
    markChannelRead,
    markConversationRead,
    queryClient,
    serverId,
    socket,
  ])
}
