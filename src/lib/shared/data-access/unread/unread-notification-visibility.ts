'use client'

export type ChatVisibilitySnapshot = {
  hasFocus: boolean
  isActuallyVisible: boolean
  visibilityState: DocumentVisibilityState | 'unknown'
}

export const getChatVisibilitySnapshot = (): ChatVisibilitySnapshot => {
  if (typeof document === 'undefined') {
    return {
      hasFocus: false,
      isActuallyVisible: false,
      visibilityState: 'unknown',
    }
  }

  const visibilityState = document.visibilityState
  const hasFocus = document.hasFocus()

  return {
    hasFocus,
    isActuallyVisible: visibilityState === 'visible' && hasFocus,
    visibilityState,
  }
}

export const isPageActuallyVisibleForChat = () => getChatVisibilitySnapshot().isActuallyVisible
