'use client'

export type ChatVisibilitySnapshot = {
  hasFocus: boolean
  isActuallyVisible: boolean
  isPageVisible: boolean
  visibilityState: DocumentVisibilityState | 'unknown'
}

export const getChatVisibilitySnapshot = (): ChatVisibilitySnapshot => {
  if (typeof document === 'undefined') {
    return {
      hasFocus: false,
      isActuallyVisible: false,
      isPageVisible: false,
      visibilityState: 'unknown',
    }
  }

  const visibilityState = document.visibilityState
  const hasFocus = document.hasFocus()
  const isPageVisible = visibilityState === 'visible'

  return {
    hasFocus,
    isActuallyVisible: isPageVisible && hasFocus,
    isPageVisible,
    visibilityState,
  }
}

export const isPageActuallyVisibleForChat = () => getChatVisibilitySnapshot().isActuallyVisible
export const isPageVisibleForChatRead = () => getChatVisibilitySnapshot().isPageVisible
