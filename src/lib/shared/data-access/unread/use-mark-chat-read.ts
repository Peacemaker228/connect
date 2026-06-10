import { useEffect } from 'react'
import { useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'

type UseMarkChatReadParams = {
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  serverId: string
}

export const useMarkChatRead = ({ paramKey, paramValue, serverId }: UseMarkChatReadParams) => {
  const { mutate: markChannelRead } = useMarkChannelRead()
  const { mutate: markConversationRead } = useMarkConversationRead()

  useEffect(() => {
    if (!serverId || !paramValue) {
      return
    }

    if (paramKey === 'channelId') {
      markChannelRead({ serverId, channelId: paramValue })
      return
    }

    markConversationRead({ serverId, conversationId: paramValue })
  }, [markChannelRead, markConversationRead, paramKey, paramValue, serverId])
}
