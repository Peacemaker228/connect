import { useCallback, useEffect, useRef } from 'react'
import { useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'
import { isPageActuallyVisibleForChat } from '@/lib/shared/data-access/unread/unread-notification-visibility'

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

  const markActiveChatRead = useCallback(() => {
    if (!enabled || !serverId || !paramValue) {
      return
    }

    if (!isPageActuallyVisibleForChat()) {
      return
    }

    beforeMarkReadRef.current?.()

    if (paramKey === 'channelId') {
      markChannelRead({ serverId, channelId: paramValue })
      return
    }

    markConversationRead({ serverId, conversationId: paramValue })
  }, [enabled, markChannelRead, markConversationRead, paramKey, paramValue, serverId])

  useEffect(() => {
    markActiveChatRead()

    const handleVisibleFocus = () => {
      markActiveChatRead()
    }

    window.addEventListener('focus', handleVisibleFocus)
    document.addEventListener('visibilitychange', handleVisibleFocus)

    return () => {
      window.removeEventListener('focus', handleVisibleFocus)
      document.removeEventListener('visibilitychange', handleVisibleFocus)
    }
  }, [markActiveChatRead])
}
