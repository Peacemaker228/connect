'use client'

import { useSyncExternalStore } from 'react'

const UNREAD_NOTIFICATION_SOUND_STORAGE_KEY = 'ax-connect:unread-notification-sound-enabled'
const UNREAD_NOTIFICATION_SOUND_SRC = '/sounds/that-was-quick-606.mp3'
const UNREAD_NOTIFICATION_SOUND_VOLUME = 0.4
const DEFAULT_UNREAD_NOTIFICATION_SOUND_ENABLED = true
const PROCESSED_SOUND_EVENT_TTL_MS = 5 * 60 * 1000
const PROCESSED_SOUND_EVENT_MAX_SIZE = 500

const subscribers = new Set<() => void>()
const processedSoundEvents = new Map<string, number>()
let notificationAudio: HTMLAudioElement | null = null

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
    if (event.key === UNREAD_NOTIFICATION_SOUND_STORAGE_KEY) {
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

const playUnreadNotificationSound = async () => {
  const audio = getNotificationAudio()

  if (!audio) {
    return
  }

  try {
    audio.pause()
    audio.currentTime = 0
    audio.volume = UNREAD_NOTIFICATION_SOUND_VOLUME
    await audio.play()
  } catch {
    // Browsers can block audio before a user gesture. Unread state must keep working.
  }
}

export const playUnreadNotificationSoundOnce = (messageId: string, enabled = readUnreadNotificationSoundEnabled()) => {
  if (!shouldPlaySoundForMessage(messageId) || !enabled) {
    return
  }

  void playUnreadNotificationSound().catch(() => undefined)
}
