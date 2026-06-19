import { useCallback, useEffect, useRef } from 'react'
import { useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'
import { getChatVisibilitySnapshot } from '@/lib/shared/data-access/unread/unread-notification-visibility'
import { canUseNativeUnreadNotifications } from '@/lib/shared/data-access/unread/unread-native-notification'
import {
  useDesktopWindowStateSnapshot,
  type DesktopWindowStateSnapshot,
} from '@/lib/shared/data-access/unread/unread-desktop-window-state'
import { isForegroundActiveChatReadable } from '@/lib/shared/data-access/unread/unread-foreground-state'

type UseMarkChatReadParams = {
  beforeMarkRead?: () => void
  enabled?: boolean
  isNearBottom?: boolean
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  serverId: string
}

export const useMarkChatRead = ({
  beforeMarkRead,
  enabled = true,
  isNearBottom = true,
  paramKey,
  paramValue,
  serverId,
}: UseMarkChatReadParams) => {
  const { mutate: markChannelRead } = useMarkChannelRead()
  const { mutate: markConversationRead } = useMarkConversationRead()
  const beforeMarkReadRef = useRef(beforeMarkRead)
  const desktopWindowState = useDesktopWindowStateSnapshot()
  const desktopWindowStateRef = useRef<DesktopWindowStateSnapshot | null>(desktopWindowState)

  useEffect(() => {
    beforeMarkReadRef.current = beforeMarkRead
  }, [beforeMarkRead])

  useEffect(() => {
    desktopWindowStateRef.current = desktopWindowState
  }, [desktopWindowState])

  const markActiveChatRead = useCallback(() => {
    if (!enabled || !isNearBottom || !serverId || !paramValue) {
      return
    }

    const visibility = getChatVisibilitySnapshot()

    if (
      !isForegroundActiveChatReadable({
        canUseNativeNotifications: canUseNativeUnreadNotifications(),
        desktopWindowState: desktopWindowStateRef.current,
        visibility,
      })
    ) {
      return
    }

    beforeMarkReadRef.current?.()

    if (paramKey === 'channelId') {
      markChannelRead({ serverId, channelId: paramValue })
      return
    }

    markConversationRead({ serverId, conversationId: paramValue })
  }, [enabled, isNearBottom, markChannelRead, markConversationRead, paramKey, paramValue, serverId])

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
  }, [desktopWindowState, markActiveChatRead])
}
