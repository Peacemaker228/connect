'use client'

import type { UnreadAttentionLevel, UnreadMessageCreatedRealtimePayload } from '@app-core/contracts'
import { ERoutes } from '@app-core/routing/routes'

export type NativeUnreadNotificationResult =
  | { status: 'failed'; error?: string }
  | { status: 'sent' }
  | { status: 'skipped_not_desktop' }
  | { status: 'unsupported' }

const NOTIFICATION_BODY_MAX_LENGTH = 140

const isDesktopNotificationBridgeAvailable = () => {
  return typeof window !== 'undefined' && Boolean(window.electron?.isDesktop && window.electron.showUnreadNotification)
}

export const canUseNativeUnreadNotifications = isDesktopNotificationBridgeAvailable

const sanitizeNotificationText = (value: string) => {
  return value.replace(/\s+/g, ' ').trim()
}

const truncateNotificationText = (value: string, maxLength: number) => {
  const normalized = sanitizeNotificationText(value)

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

const getNativeNotificationTitle = (attentionLevel: Exclude<UnreadAttentionLevel, 'none'>) => {
  if (attentionLevel === 'mention') {
    return 'New mention'
  }

  if (attentionLevel === 'reply') {
    return 'New reply'
  }

  return 'New message'
}

const getNativeNotificationBody = (params: { attentionLevel: Exclude<UnreadAttentionLevel, 'none'>; serverName?: string }) => {
  const target = params.serverName ? ` in ${params.serverName}` : ''

  if (params.attentionLevel === 'mention') {
    return truncateNotificationText(`You were mentioned${target}.`, NOTIFICATION_BODY_MAX_LENGTH)
  }

  if (params.attentionLevel === 'reply') {
    return truncateNotificationText(`Someone replied to you${target}.`, NOTIFICATION_BODY_MAX_LENGTH)
  }

  return truncateNotificationText(`Open AxConnect to view the new message${target}.`, NOTIFICATION_BODY_MAX_LENGTH)
}

export const getNativeUnreadNotificationRoutePath = (payload: UnreadMessageCreatedRealtimePayload) => {
  if (payload.scope === 'channel') {
    return `${ERoutes.SERVERS}/${payload.serverId}${ERoutes.CHANNELS}/${payload.channelId}`
  }

  return `${ERoutes.SERVERS}/${payload.serverId}${ERoutes.CONVERSATIONS}/${payload.senderMemberId}`
}

export const showNativeUnreadNotification = async (params: {
  attentionLevel: Exclude<UnreadAttentionLevel, 'none'>
  payload: UnreadMessageCreatedRealtimePayload
  serverName?: string
}): Promise<NativeUnreadNotificationResult> => {
  if (!isDesktopNotificationBridgeAvailable()) {
    return { status: 'skipped_not_desktop' }
  }

  const routePath = getNativeUnreadNotificationRoutePath(params.payload)
  const result = await window.electron?.showUnreadNotification?.({
    attentionLevel: params.attentionLevel,
    body: getNativeNotificationBody({
      attentionLevel: params.attentionLevel,
      serverName: params.serverName,
    }),
    ...(params.payload.scope === 'channel'
      ? { channelId: params.payload.channelId }
      : { conversationId: params.payload.conversationId }),
    messageId: params.payload.messageId,
    routePath,
    serverId: params.payload.serverId,
    title: getNativeNotificationTitle(params.attentionLevel),
  })

  if (!result) {
    return { status: 'failed', error: 'missing_bridge_result' }
  }

  return result
}
