import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ServerUnreadSummary } from '@sdk/queries/unread'
import { getUnreadSummaryQueryKey, useMarkChannelRead, useMarkConversationRead } from '@sdk/queries/unread'
import {
  getMemberDirectUnreadRealtimeKey,
  getServerUnreadRealtimeKey,
  type UnreadMessageCreatedRealtimePayload,
} from '@app-core/contracts'
import { useSocket } from '@/lib/shared/providers'
import { getChatVisibilitySnapshot } from '@/lib/shared/data-access/unread/unread-notification-visibility'
import { isUnreadPayloadAtActiveChatReadBoundary } from '@/lib/shared/data-access/unread/active-chat-read-state'
import { recordUnreadNotificationDecision } from '@/lib/shared/data-access/unread/unread-notification-diagnostics'
import { canUseNativeUnreadNotifications } from '@/lib/shared/data-access/unread/unread-native-notification'
import {
  useDesktopWindowStateSnapshot,
  type DesktopWindowStateSnapshot,
} from '@/lib/shared/data-access/unread/unread-desktop-window-state'
import { isForegroundActiveChatReadable } from '@/lib/shared/data-access/unread/unread-foreground-state'
import {
  getUnreadAttentionLevel,
  getUnreadMentionCountForMember,
  getUnreadReplyCountForMember,
} from '@/lib/shared/data-access/unread/unread-attention'

const PROCESSED_UNREAD_EVENT_TTL_MS = 5 * 60 * 1000
const PROCESSED_UNREAD_EVENT_MAX_SIZE = 500

const processedUnreadEvents = new Map<string, number>()

const pruneProcessedUnreadEvents = (now: number) => {
  for (const [eventId, processedAt] of processedUnreadEvents) {
    if (now - processedAt > PROCESSED_UNREAD_EVENT_TTL_MS) {
      processedUnreadEvents.delete(eventId)
    }
  }

  while (processedUnreadEvents.size > PROCESSED_UNREAD_EVENT_MAX_SIZE) {
    const oldestEventId = processedUnreadEvents.keys().next().value

    if (!oldestEventId) {
      return
    }

    processedUnreadEvents.delete(oldestEventId)
  }
}

const shouldProcessUnreadEvent = (eventId: string) => {
  const now = Date.now()

  pruneProcessedUnreadEvents(now)

  if (processedUnreadEvents.has(eventId)) {
    return false
  }

  processedUnreadEvents.set(eventId, now)
  pruneProcessedUnreadEvents(now)

  return true
}

const getUnreadEventId = (currentMemberId: string, serverId: string, payload: UnreadMessageCreatedRealtimePayload) =>
  `${currentMemberId}:${serverId}:${payload.scope}:${payload.messageId}`

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
  const reconcileTimeoutRef = useRef<number | null>(null)
  const { mutate: markChannelRead } = useMarkChannelRead()
  const { mutate: markConversationRead } = useMarkConversationRead()
  const desktopWindowState = useDesktopWindowStateSnapshot()
  const desktopWindowStateRef = useRef<DesktopWindowStateSnapshot | null>(desktopWindowState)

  const scheduleUnreadSummaryReconcile = useCallback(
    (delayMs = 500) => {
      if (!serverId) {
        return
      }

      if (reconcileTimeoutRef.current) {
        window.clearTimeout(reconcileTimeoutRef.current)
      }

      reconcileTimeoutRef.current = window.setTimeout(() => {
        reconcileTimeoutRef.current = null
        void queryClient.invalidateQueries({ queryKey: getUnreadSummaryQueryKey(serverId) })
      }, delayMs)
    },
    [queryClient, serverId],
  )

  useEffect(() => {
    return () => {
      if (reconcileTimeoutRef.current) {
        window.clearTimeout(reconcileTimeoutRef.current)
        reconcileTimeoutRef.current = null
      }
    }
  }, [serverId])

  useEffect(() => {
    desktopWindowStateRef.current = desktopWindowState
  }, [desktopWindowState])

  useEffect(() => {
    if (!socket || !serverId || !currentMemberId) {
      return
    }

    const serverUnreadKey = getServerUnreadRealtimeKey(serverId)
    const directUnreadKey = getMemberDirectUnreadRealtimeKey(currentMemberId)

    const handleChannelUnreadMessage = (
      payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'channel' }>,
    ) => {
      if (payload.action !== 'message_created' || payload.senderMemberId === currentMemberId) {
        return
      }

      if (!shouldProcessUnreadEvent(getUnreadEventId(currentMemberId, serverId, payload))) {
        scheduleUnreadSummaryReconcile()
        return
      }

      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          scheduleUnreadSummaryReconcile(0)
          return summary
        }

        const visibility = getChatVisibilitySnapshot()
        const canUseNativeNotifications = canUseNativeUnreadNotifications()
        const desktopWindowStateSnapshot = desktopWindowStateRef.current
        const isActiveChatForeground = isForegroundActiveChatReadable({
          canUseNativeNotifications,
          desktopWindowState: desktopWindowStateSnapshot,
          visibility,
        })
        const isActiveChannel = payload.channelId === activeChannelId

        if (isActiveChannel && isActiveChatForeground && isUnreadPayloadAtActiveChatReadBoundary(payload)) {
          recordUnreadNotificationDecision({
            desktopWindowState: desktopWindowStateSnapshot,
            isActiveRoute: true,
            payload,
            reason: 'active_visible_auto_read',
            visibility,
          })
          markChannelRead({ serverId, channelId: payload.channelId })
          scheduleUnreadSummaryReconcile(1000)
          return summary
        }

        if (isActiveChannel && isActiveChatForeground) {
          recordUnreadNotificationDecision({
            desktopWindowState: desktopWindowStateSnapshot,
            isActiveRoute: true,
            payload,
            reason: 'read_deferred_not_near_bottom',
            visibility,
          })
        }

        scheduleUnreadSummaryReconcile()
        const mentionCount = getUnreadMentionCountForMember(payload, currentMemberId)
        const replyCount = getUnreadReplyCountForMember(payload, currentMemberId)

        return {
          ...summary,
          channels: summary.channels.map((channel) => {
            if (channel.channelId !== payload.channelId) {
              return channel
            }

            const nextMentionCount = channel.mentionCount + mentionCount
            const nextReplyCount = channel.replyCount + replyCount
            const nextUnreadCount = channel.unreadCount + payload.unreadCount

            return {
              ...channel,
              unreadCount: nextUnreadCount,
              mentionCount: nextMentionCount,
              replyCount: nextReplyCount,
              attentionLevel: getUnreadAttentionLevel({
                mentionCount: nextMentionCount,
                replyCount: nextReplyCount,
                unreadCount: nextUnreadCount,
              }),
            }
          }),
        }
      })
    }

    const handleDirectUnreadMessage = (
      payload: Extract<UnreadMessageCreatedRealtimePayload, { scope: 'conversation' }>,
    ) => {
      if (payload.action !== 'message_created' || payload.senderMemberId === currentMemberId) {
        return
      }

      if (!shouldProcessUnreadEvent(getUnreadEventId(currentMemberId, serverId, payload))) {
        scheduleUnreadSummaryReconcile()
        return
      }

      queryClient.setQueryData<ServerUnreadSummary>(getUnreadSummaryQueryKey(serverId), (summary) => {
        if (!summary) {
          scheduleUnreadSummaryReconcile(0)
          return summary
        }

        const visibility = getChatVisibilitySnapshot()
        const canUseNativeNotifications = canUseNativeUnreadNotifications()
        const desktopWindowStateSnapshot = desktopWindowStateRef.current
        const isActiveChatForeground = isForegroundActiveChatReadable({
          canUseNativeNotifications,
          desktopWindowState: desktopWindowStateSnapshot,
          visibility,
        })
        const isActiveConversation = payload.senderMemberId === activeMemberId

        if (isActiveConversation && isActiveChatForeground && isUnreadPayloadAtActiveChatReadBoundary(payload)) {
          recordUnreadNotificationDecision({
            desktopWindowState: desktopWindowStateSnapshot,
            isActiveRoute: true,
            payload,
            reason: 'active_visible_auto_read',
            visibility,
          })
          markConversationRead({ serverId, conversationId: payload.conversationId })
          scheduleUnreadSummaryReconcile(1000)
          return summary
        }

        if (isActiveConversation && isActiveChatForeground) {
          recordUnreadNotificationDecision({
            desktopWindowState: desktopWindowStateSnapshot,
            isActiveRoute: true,
            payload,
            reason: 'read_deferred_not_near_bottom',
            visibility,
          })
        }

        const mentionCount = getUnreadMentionCountForMember(payload, currentMemberId)
        const replyCount = getUnreadReplyCountForMember(payload, currentMemberId)
        const attentionLevel = getUnreadAttentionLevel({
          mentionCount,
          replyCount,
          unreadCount: payload.unreadCount,
        })
        const existingConversation = summary.conversations.find(
          (conversation) => conversation.conversationId === payload.conversationId,
        )

        if (!existingConversation) {
          scheduleUnreadSummaryReconcile()

          return {
            ...summary,
            conversations: [
              ...summary.conversations,
              {
                conversationId: payload.conversationId,
                memberId: payload.senderMemberId,
                lastReadAt: new Date(new Date(payload.createdAt).getTime() - 1),
                unreadCount: payload.unreadCount,
                mentionCount,
                replyCount,
                attentionLevel,
              },
            ],
          }
        }

        scheduleUnreadSummaryReconcile()

        return {
          ...summary,
          conversations: summary.conversations.map((conversation) => {
            if (conversation.conversationId !== payload.conversationId) {
              return conversation
            }

            const nextMentionCount = conversation.mentionCount + mentionCount
            const nextReplyCount = conversation.replyCount + replyCount
            const nextUnreadCount = conversation.unreadCount + payload.unreadCount

            return {
              ...conversation,
              unreadCount: nextUnreadCount,
              mentionCount: nextMentionCount,
              replyCount: nextReplyCount,
              attentionLevel: getUnreadAttentionLevel({
                mentionCount: nextMentionCount,
                replyCount: nextReplyCount,
                unreadCount: nextUnreadCount,
              }),
            }
          }),
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
    scheduleUnreadSummaryReconcile,
    serverId,
    socket,
  ])

  useEffect(() => {
    if (!socket || !serverId || !currentMemberId) {
      return
    }

    const reconcileFromBackend = () => {
      scheduleUnreadSummaryReconcile(0)
    }

    const reconcileWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleUnreadSummaryReconcile(150)
      }
    }

    socket.on('connect', reconcileFromBackend)
    socket.io.on('reconnect', reconcileFromBackend)
    window.addEventListener('focus', reconcileFromBackend)
    document.addEventListener('visibilitychange', reconcileWhenVisible)

    if (socket.connected) {
      scheduleUnreadSummaryReconcile(0)
    }

    return () => {
      socket.off('connect', reconcileFromBackend)
      socket.io.off('reconnect', reconcileFromBackend)
      window.removeEventListener('focus', reconcileFromBackend)
      document.removeEventListener('visibilitychange', reconcileWhenVisible)
    }
  }, [currentMemberId, scheduleUnreadSummaryReconcile, serverId, socket])
}
