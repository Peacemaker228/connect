import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ChannelUnreadSummaryItemDto,
  ConversationUnreadSummaryItemDto,
  ServerUnreadSummaryDto,
} from '@app-core/contracts'
import { privateApiInstance } from '../api/http-client'

export type ServerUnreadSummary = ServerUnreadSummaryDto
export type ChannelUnreadSummaryItem = ChannelUnreadSummaryItemDto
export type ConversationUnreadSummaryItem = ConversationUnreadSummaryItemDto

export const getUnreadSummaryQueryKey = (serverId: string) => ['unread-summary', serverId] as const

export const fetchUnreadSummary = (serverId: string) =>
  privateApiInstance.get<ServerUnreadSummary>(`/api/unread/servers/${serverId}/summary`).then((res) => res.data)

export const useUnreadSummary = (serverId: string) => {
  return useQuery({
    queryKey: getUnreadSummaryQueryKey(serverId),
    queryFn: () => fetchUnreadSummary(serverId),
    enabled: Boolean(serverId),
  })
}

export const useMarkChannelRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serverId, channelId }: { serverId: string; channelId: string }) =>
      privateApiInstance
        .patch<ChannelUnreadSummaryItem>(`/api/unread/channels/${channelId}/read?serverId=${serverId}`)
        .then((res) => res.data),
    onSuccess: (readState, { serverId }) => {
      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          return summary
        }

        return {
          ...summary,
          channels: summary.channels.map((channel) =>
            channel.channelId === readState.channelId ? { ...channel, ...readState } : channel,
          ),
        }
      })
    },
  })
}

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string; serverId: string }) =>
      privateApiInstance
        .patch<ConversationUnreadSummaryItem>(`/api/unread/conversations/${conversationId}/read`)
        .then((res) => res.data),
    onSuccess: (readState, { serverId }) => {
      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          return summary
        }

        return {
          ...summary,
          conversations: summary.conversations.map((conversation) =>
            conversation.conversationId === readState.conversationId
              ? { ...conversation, ...readState }
              : conversation,
          ),
        }
      })
    },
  })
}
