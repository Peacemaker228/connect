'use client'

import type { UnreadMessageCreatedRealtimePayload } from '@app-core/contracts'
import type { ChatVisibilitySnapshot } from '@/lib/shared/data-access/unread/unread-notification-visibility'

const UNREAD_NOTIFICATION_DEBUG_STORAGE_KEY = 'ax-connect:debug-unread-notifications'
const DEBUG_BUFFER_LIMIT = 100

export type UnreadNotificationDecisionReason =
  | 'active_visible_auto_read'
  | 'active_visible_scrolled_up_unread'
  | 'active_visible_suppressed'
  | 'hidden_active_unread_sound_eligible'
  | 'ignored_duplicate'
  | 'ignored_inaccessible_context'
  | 'ignored_own_message'
  | 'read_deferred_not_near_bottom'
  | 'sound_blocked_global'
  | 'sound_blocked_scope'
  | 'sound_deduped'
  | 'sound_failed'
  | 'sound_not_available'
  | 'sound_played'

type UnreadNotificationDebugEntry = {
  activeContext: 'active-hidden' | 'active-visible' | 'inactive'
  channelId?: string
  conversationId?: string
  focusState: boolean
  globalSoundEnabled?: boolean
  memberId?: string
  messageId: string
  mutedScope?: boolean
  reason: UnreadNotificationDecisionReason
  scope: UnreadMessageCreatedRealtimePayload['scope']
  serverId: string
  soundError?: string
  timestamp: string
  visibilityState: ChatVisibilitySnapshot['visibilityState']
}

const debugBuffer: UnreadNotificationDebugEntry[] = []

const isBrowser = () => typeof window !== 'undefined'

const isUnreadNotificationDebugEnabled = () => {
  if (!isBrowser()) {
    return false
  }

  return window.localStorage.getItem(UNREAD_NOTIFICATION_DEBUG_STORAGE_KEY) === '1'
}

const exposeDebugBuffer = () => {
  if (!isBrowser()) {
    return
  }

  const target = window as typeof window & {
    __axUnreadNotificationDebug?: {
      getEntries: () => UnreadNotificationDebugEntry[]
      storageKey: string
    }
  }

  target.__axUnreadNotificationDebug ??= {
    getEntries: () => [...debugBuffer],
    storageKey: UNREAD_NOTIFICATION_DEBUG_STORAGE_KEY,
  }
}

const getActiveContext = (params: {
  isActiveRoute: boolean
  visibility: ChatVisibilitySnapshot
}): UnreadNotificationDebugEntry['activeContext'] => {
  if (!params.isActiveRoute) {
    return 'inactive'
  }

  return params.visibility.isPageVisible ? 'active-visible' : 'active-hidden'
}

export const recordUnreadNotificationDecision = (params: {
  globalSoundEnabled?: boolean
  isActiveRoute: boolean
  mutedScope?: boolean
  payload: UnreadMessageCreatedRealtimePayload
  reason: UnreadNotificationDecisionReason
  soundError?: unknown
  visibility: ChatVisibilitySnapshot
}) => {
  const { payload, visibility } = params
  const entry: UnreadNotificationDebugEntry = {
    activeContext: getActiveContext({
      isActiveRoute: params.isActiveRoute,
      visibility,
    }),
    focusState: visibility.hasFocus,
    globalSoundEnabled: params.globalSoundEnabled,
    memberId: payload.senderMemberId,
    messageId: payload.messageId,
    mutedScope: params.mutedScope,
    reason: params.reason,
    scope: payload.scope,
    serverId: payload.serverId,
    soundError: params.soundError instanceof Error ? params.soundError.name || params.soundError.message : undefined,
    timestamp: new Date().toISOString(),
    visibilityState: visibility.visibilityState,
    ...(payload.scope === 'channel'
      ? { channelId: payload.channelId }
      : { conversationId: payload.conversationId }),
  }

  debugBuffer.push(entry)

  while (debugBuffer.length > DEBUG_BUFFER_LIMIT) {
    debugBuffer.shift()
  }

  exposeDebugBuffer()

  if (isUnreadNotificationDebugEnabled()) {
    console.debug('[UNREAD_NOTIFICATION_DECISION]', entry)
  }
}
