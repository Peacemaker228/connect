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
      notifyReady?: () => void
      onDeepLink?: (callback: (payload: { url: string; sessionId: string | null }) => void) => (() => void) | void
      onClerkSession?: (callback: (sessionId: string) => void) => (() => void) | void
    }
  }
}
