import en from './messages/en'
import ru from './messages/ru'

declare module '*.svg' {
  import React from 'react'
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}

type Messages = typeof en | typeof ru

declare global {
  type IntlMessages = Messages
}

declare global {
  interface Window {
    electron?: {
      isDesktop: boolean
      openExternal: (url: string) => Promise<boolean>
      writeClipboardText?: (text: string) => Promise<boolean>
      downloadFile?: (payload: { fileName?: string | null; url: string }) => Promise<DesktopFileDownloadResult>
      showDownloadedFile?: (filePath: string) => Promise<boolean>
      checkForUpdate?: () => Promise<DesktopUpdateStatus>
      getBuildInfo?: () => Promise<{
        version: string
        commitHash: string | null
        shortCommitHash: string | null
        branch: string | null
        isDirty: boolean
        builtAt: string
      } | null>
      getUpdateStatus?: () => Promise<DesktopUpdateStatus>
      getWindowState?: () => Promise<{
        focused: boolean
        minimized: boolean
        visible: boolean
      } | null>
      installUpdate?: () => Promise<DesktopUpdateStatus>
      onUpdateStatus?: (callback: (status: DesktopUpdateStatus) => void) => (() => void) | void
      onWindowStateChange?: (
        callback: (state: { focused: boolean; minimized: boolean; visible: boolean }) => void,
      ) => (() => void) | void
      showUnreadNotification?: (payload: {
        attentionLevel: 'mention' | 'reply' | 'unread'
        body: string
        channelId?: string
        conversationId?: string
        messageId: string
        routePath: string
        serverId: string
        title: string
      }) => Promise<{
        error?: string
        status: 'failed' | 'sent' | 'unsupported'
      }>
      onUnreadNotificationNavigate?: (callback: (path: string) => void) => (() => void) | void
      notifyReady?: () => void
      onAuthSession?: (callback: (sessionId: string) => void) => (() => void) | void
    }
  }

  type DesktopUpdateStatus = {
    channel: string
    currentVersion: string
    error?: string | null
    lastCheckedAt?: string | null
    lastErrorAt?: string | null
    lastSuccessfulCheckAt?: string | null
    progressPercent?: number | null
    status: 'unsupported' | 'idle' | 'checking' | 'available' | 'not_available' | 'downloading' | 'downloaded' | 'error'
    supported: boolean
    updateUrl?: string | null
    updateVersion?: string | null
    updatedAt: string
  }

  type DesktopFileDownloadResult =
    | {
        fileName: string
        filePath: string
        status: 'downloaded'
      }
    | {
        error?: string | null
        status: 'failed'
      }
}
