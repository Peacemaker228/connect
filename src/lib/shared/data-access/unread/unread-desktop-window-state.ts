'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type DesktopWindowStateSnapshot = {
  focused: boolean
  minimized: boolean
  visible: boolean
}

const subscribers = new Set<() => void>()
let desktopWindowState: DesktopWindowStateSnapshot | null = null
let bridgeSubscriberCount = 0
let bridgeCleanup: (() => void) | null = null

const isDesktopWindowState = (value: unknown): value is DesktopWindowStateSnapshot => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as Partial<DesktopWindowStateSnapshot>

  return (
    typeof state.focused === 'boolean' &&
    typeof state.minimized === 'boolean' &&
    typeof state.visible === 'boolean'
  )
}

const setDesktopWindowState = (state: unknown) => {
  if (!isDesktopWindowState(state)) {
    return
  }

  desktopWindowState = state
  subscribers.forEach((subscriber) => subscriber())
}

const subscribe = (subscriber: () => void) => {
  subscribers.add(subscriber)

  return () => {
    subscribers.delete(subscriber)
  }
}

const getSnapshot = () => desktopWindowState

const subscribeToDesktopWindowStateBridge = () => {
  if (typeof window === 'undefined' || !window.electron?.isDesktop) {
    return () => {}
  }

  bridgeSubscriberCount += 1

  if (bridgeSubscriberCount === 1) {
    let disposed = false
    const cleanupWindowStateChange = window.electron.onWindowStateChange?.((state) => {
      setDesktopWindowState(state)
    })

    void window.electron.getWindowState?.().then((state) => {
      if (!disposed) {
        setDesktopWindowState(state)
      }
    })

    bridgeCleanup = () => {
      disposed = true
      cleanupWindowStateChange?.()
      bridgeCleanup = null
    }
  }

  return () => {
    bridgeSubscriberCount = Math.max(0, bridgeSubscriberCount - 1)

    if (bridgeSubscriberCount === 0) {
      bridgeCleanup?.()
      desktopWindowState = null
      subscribers.forEach((subscriber) => subscriber())
    }
  }
}

export const getDesktopWindowStateSnapshot = () => desktopWindowState

export const isDesktopWindowFocusedVisible = (state: DesktopWindowStateSnapshot | null) => {
  return Boolean(state?.focused && state.visible && !state.minimized)
}

export const useDesktopWindowStateSnapshot = () => {
  useEffect(() => subscribeToDesktopWindowStateBridge(), [])

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
