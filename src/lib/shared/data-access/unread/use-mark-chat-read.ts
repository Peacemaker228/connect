import { useEffect, useRef } from 'react'
import { useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'

type UseMarkChatReadParams = {
  beforeMarkRead?: () => void
  enabled?: boolean
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  serverId: string
}

export const useMarkChatRead = ({
  beforeMarkRead,
  enabled = true,
  paramKey,
  paramValue,
  serverId,
}: UseMarkChatReadParams) => {
  const { mutate: markChannelRead } = useMarkChannelRead()
  const { mutate: markConversationRead } = useMarkConversationRead()
  const beforeMarkReadRef = useRef(beforeMarkRead)

  useEffect(() => {
    beforeMarkReadRef.current = beforeMarkRead
  }, [beforeMarkRead])

  useEffect(() => {
    if (!enabled || !serverId || !paramValue) {
      return
    }

    beforeMarkReadRef.current?.()

    if (paramKey === 'channelId') {
      markChannelRead({ serverId, channelId: paramValue })
      return
    }

    markConversationRead({ serverId, conversationId: paramValue })
  }, [enabled, markChannelRead, markConversationRead, paramKey, paramValue, serverId])
}
