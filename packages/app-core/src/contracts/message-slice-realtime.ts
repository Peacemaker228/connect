import type { UnreadAttentionLevel } from './domain'

export type MessageSliceRealtimeEvent<TPayload> = {
  key: string
  payload: TPayload
}

export type UnreadMessageCreatedRealtimePayload =
  | {
      action: 'message_created'
      scope: 'channel'
      serverId: string
      channelId: string
      messageId: string
      senderMemberId: string
      createdAt: string
      unreadCount: number
      mentionCount: number
      mentionedMemberIds?: string[]
      repliedToMemberId?: string | null
      replyCount: number
      attentionLevel: UnreadAttentionLevel
    }
  | {
      action: 'message_created'
      scope: 'conversation'
      serverId: string
      conversationId: string
      messageId: string
      senderMemberId: string
      createdAt: string
      unreadCount: number
      mentionCount: number
      repliedToMemberId?: string | null
      replyCount: number
      attentionLevel: UnreadAttentionLevel
    }

export const getChatMessagesRealtimeKey = (chatId: string) => `chat:${chatId}:messages`

export const getChatMessagesUpdateRealtimeKey = (chatId: string) => `chat:${chatId}:messages:update`

export const getServerUnreadRealtimeKey = (serverId: string) => `server:${serverId}:unread`

export const getMemberDirectUnreadRealtimeKey = (memberId: string) => `member:${memberId}:direct-unread`

export const createChatMessageCreatedRealtimeEvent = <TPayload>(
  chatId: string,
  payload: TPayload,
): MessageSliceRealtimeEvent<TPayload> => ({
  key: getChatMessagesRealtimeKey(chatId),
  payload,
})

export const createChatMessageUpdatedRealtimeEvent = <TPayload>(
  chatId: string,
  payload: TPayload,
): MessageSliceRealtimeEvent<TPayload> => ({
  key: getChatMessagesUpdateRealtimeKey(chatId),
  payload,
})

export const createUnreadMessageCreatedRealtimeEvent = (
  serverId: string,
  payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'channel' }>,
): MessageSliceRealtimeEvent<Extract<UnreadMessageCreatedRealtimePayload, { scope: 'channel' }>> => ({
  key: getServerUnreadRealtimeKey(serverId),
  payload,
})

export const createDirectUnreadMessageCreatedRealtimeEvent = (
  recipientMemberId: string,
  payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'conversation' }>,
): MessageSliceRealtimeEvent<Extract<UnreadMessageCreatedRealtimePayload, { scope: 'conversation' }>> => ({
  key: getMemberDirectUnreadRealtimeKey(recipientMemberId),
  payload,
})
