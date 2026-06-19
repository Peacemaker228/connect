'use client'

import type { ChatVisibilitySnapshot } from '@/lib/shared/data-access/unread/unread-notification-visibility'
import {
  isDesktopWindowFocusedVisible,
  type DesktopWindowStateSnapshot,
} from '@/lib/shared/data-access/unread/unread-desktop-window-state'

export type UnreadForegroundStateParams = {
  canUseNativeNotifications?: boolean
  desktopWindowState?: DesktopWindowStateSnapshot | null
  visibility: ChatVisibilitySnapshot
}

export const isForegroundActiveChatReadable = ({
  canUseNativeNotifications = false,
  desktopWindowState,
  visibility,
}: UnreadForegroundStateParams) => {
  if (canUseNativeNotifications && desktopWindowState) {
    return isDesktopWindowFocusedVisible(desktopWindowState)
  }

  return visibility.isActuallyVisible
}
