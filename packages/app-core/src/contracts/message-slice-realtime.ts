export type MessageSliceRealtimeEvent<TPayload> = {
  key: string
  payload: TPayload
}

export const getChatMessagesRealtimeKey = (chatId: string) => `chat:${chatId}:messages`

export const getChatMessagesUpdateRealtimeKey = (chatId: string) => `chat:${chatId}:messages:update`

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
