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
      getBuildInfo?: () => Promise<{
        version: string
        commitHash: string | null
        shortCommitHash: string | null
        branch: string | null
        isDirty: boolean
        builtAt: string
      } | null>
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
}
