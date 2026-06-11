import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { GlobalServerUnreadSummaryItem, GlobalUnreadSummary } from '@sdk/queries/unread'
import { getGlobalUnreadSummaryQueryKey } from '@sdk/queries/unread'
import {
  getMemberDirectUnreadRealtimeKey,
  getServerUnreadRealtimeKey,
  type UnreadMessageCreatedRealtimePayload,
} from '@app-core/contracts'
import { useSocket } from '@/lib/shared/providers'
import {
  getUnreadNotificationMuteScopeForPayload,
  isUnreadNotificationScopeMuted,
  playUnreadNotificationSoundOnce,
  type UnreadNotificationSoundResult,
  useUnreadNotificationSoundPreference,
} from '@/lib/shared/data-access/unread/unread-notification-sound'
import {
  recordUnreadNotificationDecision,
  type UnreadNotificationDecisionReason,
} from '@/lib/shared/data-access/unread/unread-notification-diagnostics'
import { getChatVisibilitySnapshot } from '@/lib/shared/data-access/unread/unread-notification-visibility'

const PROCESSED_GLOBAL_UNREAD_EVENT_TTL_MS = 5 * 60 * 1000
const PROCESSED_GLOBAL_UNREAD_EVENT_MAX_SIZE = 500

const processedGlobalUnreadEvents = new Map<string, number>()

type UseGlobalUnreadSocketParams = {
  activeChannelId?: string
  activeMemberId?: string
  activeServerId?: string
  servers?: GlobalServerUnreadSummaryItem[]
}

const pruneProcessedGlobalUnreadEvents = (now: number) => {
  for (const [eventId, processedAt] of processedGlobalUnreadEvents) {
    if (now - processedAt > PROCESSED_GLOBAL_UNREAD_EVENT_TTL_MS) {
      processedGlobalUnreadEvents.delete(eventId)
    }
  }

  while (processedGlobalUnreadEvents.size > PROCESSED_GLOBAL_UNREAD_EVENT_MAX_SIZE) {
    const oldestEventId = processedGlobalUnreadEvents.keys().next().value

    if (!oldestEventId) {
      return
    }

    processedGlobalUnreadEvents.delete(oldestEventId)
  }
}

const shouldProcessGlobalUnreadEvent = (eventId: string) => {
  const now = Date.now()

  pruneProcessedGlobalUnreadEvents(now)

  if (processedGlobalUnreadEvents.has(eventId)) {
    return false
  }

  processedGlobalUnreadEvents.set(eventId, now)
  pruneProcessedGlobalUnreadEvents(now)

  return true
}

const getGlobalUnreadEventId = (payload: UnreadMessageCreatedRealtimePayload) =>
  `${payload.serverId}:${payload.scope}:${payload.messageId}`

const isPayloadForActiveRoute = (
  payload: UnreadMessageCreatedRealtimePayload,
  params: {
    activeChannelId?: string
    activeMemberId?: string
    activeServerId?: string
  },
) => {
  if (payload.serverId !== params.activeServerId) {
    return false
  }

  if (payload.scope === 'channel') {
    return payload.channelId === params.activeChannelId
  }

  return payload.senderMemberId === params.activeMemberId
}

const getSoundResultDecisionReason = (
  result: UnreadNotificationSoundResult,
): UnreadNotificationDecisionReason => {
  if (result.status === 'deduped') {
    return 'sound_deduped'
  }

  if (result.status === 'failed') {
    return 'sound_failed'
  }

  if (result.status === 'not_available') {
    return 'sound_not_available'
  }

  if (result.status === 'disabled') {
    return 'sound_blocked_global'
  }

  return 'sound_played'
}

export const useGlobalUnreadSocket = ({
  activeChannelId,
  activeMemberId,
  activeServerId,
  servers,
}: UseGlobalUnreadSocketParams) => {
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const reconcileTimeoutRef = useRef<number | null>(null)
  const { enabled: isUnreadNotificationSoundEnabled } = useUnreadNotificationSoundPreference()
  const soundEnabledRef = useRef(isUnreadNotificationSoundEnabled)

  const serverUnreadKeys = useMemo(
    () => Array.from(new Set(servers?.map((server) => getServerUnreadRealtimeKey(server.serverId)) ?? [])),
    [servers],
  )
  const directUnreadKeys = useMemo(
    () => Array.from(new Set(servers?.map((server) => getMemberDirectUnreadRealtimeKey(server.memberId)) ?? [])),
    [servers],
  )

  const scheduleGlobalUnreadReconcile = useCallback(
    (delayMs = 500) => {
      if (reconcileTimeoutRef.current) {
        window.clearTimeout(reconcileTimeoutRef.current)
      }

      reconcileTimeoutRef.current = window.setTimeout(() => {
        reconcileTimeoutRef.current = null
        void queryClient.invalidateQueries({ queryKey: getGlobalUnreadSummaryQueryKey() })
      }, delayMs)
    },
    [queryClient],
  )

  const incrementGlobalUnreadCache = useCallback(
    (payload: UnreadMessageCreatedRealtimePayload) => {
      queryClient.setQueryData<GlobalUnreadSummary>(getGlobalUnreadSummaryQueryKey(), (summary) => {
        if (!summary?.servers.some((server) => server.serverId === payload.serverId)) {
          return summary
        }

        return {
          ...summary,
          totalUnreadCount: summary.totalUnreadCount + payload.unreadCount,
          servers: summary.servers.map((server) =>
            server.serverId === payload.serverId
              ? {
                  ...server,
                  unreadCount: server.unreadCount + payload.unreadCount,
                  mentionCount: server.mentionCount + payload.mentionCount,
                  replyCount: server.replyCount + payload.replyCount,
                  attentionLevel: payload.attentionLevel,
                }
              : server,
          ),
        }
      })
    },
    [queryClient],
  )

  useEffect(() => {
    return () => {
      if (reconcileTimeoutRef.current) {
        window.clearTimeout(reconcileTimeoutRef.current)
        reconcileTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    soundEnabledRef.current = isUnreadNotificationSoundEnabled
  }, [isUnreadNotificationSoundEnabled])

  useEffect(() => {
    if (!socket || serverUnreadKeys.length === 0) {
      return
    }

    const handleGlobalUnreadMessage = (payload: UnreadMessageCreatedRealtimePayload) => {
      if (payload.action !== 'message_created') {
        return
      }

      const visibility = getChatVisibilitySnapshot()
      const isActiveRoute = isPayloadForActiveRoute(payload, {
        activeChannelId,
        activeMemberId,
        activeServerId,
      })
      const targetServer = servers?.find((server) => server.serverId === payload.serverId)

      if (!targetServer) {
        recordUnreadNotificationDecision({
          isActiveRoute,
          payload,
          reason: 'ignored_inaccessible_context',
          visibility,
        })
        scheduleGlobalUnreadReconcile()
        return
      }

      if (payload.senderMemberId === targetServer.memberId) {
        recordUnreadNotificationDecision({
          isActiveRoute,
          payload,
          reason: 'ignored_own_message',
          visibility,
        })
        return
      }

      if (!shouldProcessGlobalUnreadEvent(getGlobalUnreadEventId(payload))) {
        recordUnreadNotificationDecision({
          isActiveRoute,
          payload,
          reason: 'ignored_duplicate',
          visibility,
        })
        scheduleGlobalUnreadReconcile()
        return
      }

      if (isActiveRoute && visibility.isActuallyVisible) {
        recordUnreadNotificationDecision({
          globalSoundEnabled: soundEnabledRef.current,
          isActiveRoute,
          mutedScope: false,
          payload,
          reason: 'active_visible_suppressed',
          visibility,
        })
        scheduleGlobalUnreadReconcile(1000)
        return
      }

      const muteScope = getUnreadNotificationMuteScopeForPayload(payload)
      const isScopeMuted = isUnreadNotificationScopeMuted(muteScope)
      const isSoundEnabled = soundEnabledRef.current

      void playUnreadNotificationSoundOnce(payload.messageId, isSoundEnabled && !isScopeMuted).then((result) => {
        const reason =
          !isSoundEnabled ? 'sound_blocked_global' : isScopeMuted ? 'sound_blocked_scope' : getSoundResultDecisionReason(result)

        recordUnreadNotificationDecision({
          globalSoundEnabled: isSoundEnabled,
          isActiveRoute,
          mutedScope: isScopeMuted,
          payload,
          reason,
          soundError: result.status === 'failed' ? result.error : undefined,
          visibility,
        })
      })

      incrementGlobalUnreadCache(payload)
      scheduleGlobalUnreadReconcile()
    }

    serverUnreadKeys.forEach((key) => {
      socket.on(key, handleGlobalUnreadMessage)
    })
    directUnreadKeys.forEach((key) => {
      socket.on(key, handleGlobalUnreadMessage)
    })

    return () => {
      serverUnreadKeys.forEach((key) => {
        socket.off(key, handleGlobalUnreadMessage)
      })
      directUnreadKeys.forEach((key) => {
        socket.off(key, handleGlobalUnreadMessage)
      })
    }
  }, [
    activeChannelId,
    activeMemberId,
    activeServerId,
    directUnreadKeys,
    incrementGlobalUnreadCache,
    scheduleGlobalUnreadReconcile,
    serverUnreadKeys,
    servers,
    socket,
  ])

  useEffect(() => {
    if (!socket) {
      return
    }

    const reconcileFromBackend = () => {
      scheduleGlobalUnreadReconcile(0)
    }

    const reconcileWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleGlobalUnreadReconcile(150)
      }
    }

    socket.on('connect', reconcileFromBackend)
    socket.io.on('reconnect', reconcileFromBackend)
    window.addEventListener('focus', reconcileFromBackend)
    document.addEventListener('visibilitychange', reconcileWhenVisible)

    if (socket.connected) {
      scheduleGlobalUnreadReconcile(0)
    }

    return () => {
      socket.off('connect', reconcileFromBackend)
      socket.io.off('reconnect', reconcileFromBackend)
      window.removeEventListener('focus', reconcileFromBackend)
      document.removeEventListener('visibilitychange', reconcileWhenVisible)
    }
  }, [scheduleGlobalUnreadReconcile, socket])
}
