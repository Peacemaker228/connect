'use client'

import type { MessageReplyPreviewDto } from '@app-core/contracts'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ChatReplyContextValue = {
  clearReply: () => void
  replyTo: MessageReplyPreviewDto | null
  setReplyTo: (message: MessageReplyPreviewDto) => void
}

const ChatReplyContext = createContext<ChatReplyContextValue | null>(null)

interface ChatReplyProviderProps extends PropsWithChildren {
  chatId: string
}

export const ChatReplyProvider = ({ chatId, children }: ChatReplyProviderProps) => {
  const [replyTo, setReplyToState] = useState<MessageReplyPreviewDto | null>(null)

  const clearReply = useCallback(() => {
    setReplyToState(null)
  }, [])

  const setReplyTo = useCallback((message: MessageReplyPreviewDto) => {
    setReplyToState(message)
  }, [])

  useEffect(() => {
    setReplyToState(null)
  }, [chatId])

  const value = useMemo(
    () => ({
      clearReply,
      replyTo,
      setReplyTo,
    }),
    [clearReply, replyTo, setReplyTo],
  )

  return <ChatReplyContext.Provider value={value}>{children}</ChatReplyContext.Provider>
}

export const useChatReply = () => {
  const context = useContext(ChatReplyContext)

  if (!context) {
    throw new Error('useChatReply must be used inside ChatReplyProvider')
  }

  return context
}
