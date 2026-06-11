'use client'

import { useSyncExternalStore } from 'react'
import type { UnreadMessageCreatedRealtimePayload } from '@app-core/contracts'

const UNREAD_NOTIFICATION_SOUND_STORAGE_KEY = 'ax-connect:unread-notification-sound-enabled'
const UNREAD_NOTIFICATION_MUTED_SCOPES_STORAGE_KEY = 'ax-connect:unread-notification-muted-scopes'
const UNREAD_NOTIFICATION_SOUND_SRC = '/sounds/that-was-quick-606.mp3'
const UNREAD_NOTIFICATION_SOUND_VOLUME = 0.4
const DEFAULT_UNREAD_NOTIFICATION_SOUND_ENABLED = true
const PROCESSED_SOUND_EVENT_TTL_MS = 5 * 60 * 1000
const PROCESSED_SOUND_EVENT_MAX_SIZE = 500

const subscribers = new Set<() => void>()
const processedSoundEvents = new Map<string, number>()
let notificationAudio: HTMLAudioElement | null = null

export type UnreadNotificationSoundResult =
  | { status: 'deduped' }
  | { status: 'disabled' }
  | { status: 'failed'; error: unknown }
  | { status: 'not_available' }
  | { status: 'played' }

const isBrowser = () => typeof window !== 'undefined'

const readUnreadNotificationSoundEnabled = () => {
  if (!isBrowser()) {
    return DEFAULT_UNREAD_NOTIFICATION_SOUND_ENABLED
  }

  const storedValue = window.localStorage.getItem(UNREAD_NOTIFICATION_SOUND_STORAGE_KEY)

  if (storedValue === null) {
    return DEFAULT_UNREAD_NOTIFICATION_SOUND_ENABLED
  }

  return storedValue === 'true'
}

const readMutedScopesSnapshot = () => {
  if (!isBrowser()) {
    return '[]'
  }

  return window.localStorage.getItem(UNREAD_NOTIFICATION_MUTED_SCOPES_STORAGE_KEY) ?? '[]'
}

const parseMutedScopes = (snapshot: string) => {
  try {
    const parsed = JSON.parse(snapshot)

    if (!Array.isArray(parsed)) {
      return new Set<string>()
    }

    return new Set(parsed.filter((scope): scope is string => typeof scope === 'string' && scope.length > 0))
  } catch {
    return new Set<string>()
  }
}

const notifySubscribers = () => {
  subscribers.forEach((subscriber) => subscriber())
}

const subscribeToUnreadNotificationSoundPreference = (subscriber: () => void) => {
  subscribers.add(subscriber)

  if (!isBrowser()) {
    return () => {
      subscribers.delete(subscriber)
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === UNREAD_NOTIFICATION_SOUND_STORAGE_KEY ||
      event.key === UNREAD_NOTIFICATION_MUTED_SCOPES_STORAGE_KEY
    ) {
      subscriber()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    subscribers.delete(subscriber)
    window.removeEventListener('storage', handleStorage)
  }
}

export const setUnreadNotificationSoundEnabled = (enabled: boolean) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(UNREAD_NOTIFICATION_SOUND_STORAGE_KEY, String(enabled))
  notifySubscribers()
}

const writeMutedScopes = (mutedScopes: Set<string>) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(
    UNREAD_NOTIFICATION_MUTED_SCOPES_STORAGE_KEY,
    JSON.stringify(Array.from(mutedScopes).sort()),
  )
  notifySubscribers()
}

export const createChannelUnreadNotificationMuteScope = (serverId: string, channelId: string) =>
  `channel:${serverId}:${channelId}`

export const createConversationUnreadNotificationMuteScope = (serverId: string, memberId: string) =>
  `conversation:${serverId}:${memberId}`

export const getUnreadNotificationMuteScopeForPayload = (payload: UnreadMessageCreatedRealtimePayload) => {
  if (payload.scope === 'channel') {
    return createChannelUnreadNotificationMuteScope(payload.serverId, payload.channelId)
  }

  return createConversationUnreadNotificationMuteScope(payload.serverId, payload.senderMemberId)
}

export const isUnreadNotificationScopeMuted = (scope: string) => parseMutedScopes(readMutedScopesSnapshot()).has(scope)

export const setUnreadNotificationScopeMuted = (scope: string, muted: boolean) => {
  const mutedScopes = parseMutedScopes(readMutedScopesSnapshot())

  if (muted) {
    mutedScopes.add(scope)
  } else {
    mutedScopes.delete(scope)
  }

  writeMutedScopes(mutedScopes)
}

export const useUnreadNotificationSoundPreference = () => {
  const enabled = useSyncExternalStore(
    subscribeToUnreadNotificationSoundPreference,
    readUnreadNotificationSoundEnabled,
    () => DEFAULT_UNREAD_NOTIFICATION_SOUND_ENABLED,
  )

  return {
    enabled,
    setEnabled: setUnreadNotificationSoundEnabled,
  }
}

export const useUnreadNotificationMutedScope = (scope: string) => {
  const mutedScopesSnapshot = useSyncExternalStore(
    subscribeToUnreadNotificationSoundPreference,
    readMutedScopesSnapshot,
    () => '[]',
  )
  const isMuted = parseMutedScopes(mutedScopesSnapshot).has(scope)

  return {
    isMuted,
    setMuted: (muted: boolean) => setUnreadNotificationScopeMuted(scope, muted),
    toggleMuted: () => setUnreadNotificationScopeMuted(scope, !isMuted),
  }
}

const pruneProcessedSoundEvents = (now: number) => {
  for (const [eventId, processedAt] of processedSoundEvents) {
    if (now - processedAt > PROCESSED_SOUND_EVENT_TTL_MS) {
      processedSoundEvents.delete(eventId)
    }
  }

  while (processedSoundEvents.size > PROCESSED_SOUND_EVENT_MAX_SIZE) {
    const oldestEventId = processedSoundEvents.keys().next().value

    if (!oldestEventId) {
      return
    }

    processedSoundEvents.delete(oldestEventId)
  }
}

const shouldPlaySoundForMessage = (messageId: string) => {
  const now = Date.now()

  pruneProcessedSoundEvents(now)

  if (processedSoundEvents.has(messageId)) {
    return false
  }

  processedSoundEvents.set(messageId, now)
  pruneProcessedSoundEvents(now)

  return true
}

const getNotificationAudio = () => {
  if (!isBrowser()) {
    return null
  }

  if (!notificationAudio) {
    notificationAudio = new Audio(UNREAD_NOTIFICATION_SOUND_SRC)
    notificationAudio.preload = 'auto'
    notificationAudio.volume = UNREAD_NOTIFICATION_SOUND_VOLUME
  }

  return notificationAudio
}

const playUnreadNotificationSound = async (): Promise<UnreadNotificationSoundResult> => {
  const audio = getNotificationAudio()

  if (!audio) {
    return { status: 'not_available' }
  }

  try {
    audio.pause()
    audio.currentTime = 0
    audio.volume = UNREAD_NOTIFICATION_SOUND_VOLUME
    await audio.play()
    return { status: 'played' }
  } catch (error) {
    return { status: 'failed', error }
  }
}

export const playUnreadNotificationSoundOnce = async (
  messageId: string,
  enabled = readUnreadNotificationSoundEnabled(),
): Promise<UnreadNotificationSoundResult> => {
  if (!shouldPlaySoundForMessage(messageId)) {
    return { status: 'deduped' }
  }

  if (!enabled) {
    return { status: 'disabled' }
  }

  return playUnreadNotificationSound()
}
