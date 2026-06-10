import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { CHAT_SCROLL_TO_BOTTOM_EVENT } from '@/lib/chat/features/chat-events'

interface IUseChatScroll {
  chatId: string
  chatRef: RefObject<HTMLDivElement>
  bottomRef: RefObject<HTMLDivElement>
  shouldLoadMore: boolean
  loadMore: () => void
  count: number
}

export const useChatScroll = ({ chatId, chatRef, bottomRef, shouldLoadMore, loadMore, count }: IUseChatScroll) => {
  const [hasInitialized, setHasInitialized] = useState(false)
  const isNearBottomRef = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = chatRef.current

    if (!container) {
      return
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    })
    bottomRef.current?.scrollIntoView({ block: 'end', behavior })
  }, [bottomRef, chatRef])

  const scheduleScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => scrollToBottom())
    window.setTimeout(() => scrollToBottom(), 50)
    window.setTimeout(() => scrollToBottom('smooth'), 150)
  }, [scrollToBottom])

  useEffect(() => {
    const topDiv = chatRef?.current

    const updateIsNearBottom = () => {
      if (!topDiv) {
        return
      }

      const distanceFromBottom = topDiv.scrollHeight - topDiv.scrollTop - topDiv.clientHeight

      isNearBottomRef.current = distanceFromBottom <= 160
    }

    const handleScroll = () => {
      const scrollTop = topDiv?.scrollTop

      updateIsNearBottom()

      if (scrollTop === 0 && shouldLoadMore) {
        loadMore()
      }
    }

    topDiv?.addEventListener('scroll', handleScroll)
    updateIsNearBottom()

    return () => {
      topDiv?.removeEventListener('scroll', handleScroll)
    }
  }, [chatRef, loadMore, shouldLoadMore])

  useEffect(() => {
    const topDiv = chatRef?.current

    const shouldAutoScroll = () => {
      if (!hasInitialized) {
        setHasInitialized(true)
        return true
      }

      return isNearBottomRef.current
    }

    if (!topDiv || !shouldAutoScroll()) {
      return
    }

    scheduleScrollToBottom()
  }, [bottomRef, chatRef, count, hasInitialized, scheduleScrollToBottom])

  useEffect(() => {
    const handleForcedScroll = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail?.chatId !== chatId) {
        return
      }

      scheduleScrollToBottom()
    }

    window.addEventListener(CHAT_SCROLL_TO_BOTTOM_EVENT, handleForcedScroll)

    return () => {
      window.removeEventListener(CHAT_SCROLL_TO_BOTTOM_EVENT, handleForcedScroll)
    }
  }, [chatId, scheduleScrollToBottom])
}
