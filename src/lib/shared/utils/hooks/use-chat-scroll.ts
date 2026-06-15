import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { CHAT_SCROLL_TO_BOTTOM_EVENT } from '@/lib/shared/utils/chat-events'

interface IUseChatScroll {
  autoScrollEnabled?: boolean
  chatId: string
  chatRef: RefObject<HTMLDivElement>
  bottomRef: RefObject<HTMLDivElement>
  shouldLoadMore: boolean
  loadMore: () => Promise<void> | void
  loadMoreThreshold?: number
  count: number
  onNearBottomChange?: (isNearBottom: boolean) => void
}

export const useChatScroll = ({
  autoScrollEnabled = true,
  chatId,
  chatRef,
  bottomRef,
  shouldLoadMore,
  loadMore,
  loadMoreThreshold = 240,
  count,
  onNearBottomChange,
}: IUseChatScroll) => {
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const isNearBottomRef = useRef(true)

  const updateNearBottomState = useCallback(
    (nextIsNearBottom: boolean) => {
      if (isNearBottomRef.current === nextIsNearBottom) {
        return
      }

      isNearBottomRef.current = nextIsNearBottom
      setIsNearBottom(nextIsNearBottom)
      onNearBottomChange?.(nextIsNearBottom)
    },
    [onNearBottomChange],
  )

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
    updateNearBottomState(true)
  }, [bottomRef, chatRef, updateNearBottomState])

  const scheduleScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => scrollToBottom())
    window.setTimeout(() => scrollToBottom(), 50)
    window.setTimeout(() => scrollToBottom('smooth'), 150)
  }, [scrollToBottom])

  useEffect(() => {
    setHasInitialized(false)
    updateNearBottomState(true)
  }, [chatId, updateNearBottomState])

  useEffect(() => {
    const topDiv = chatRef?.current

    const updateIsNearBottom = () => {
      if (!topDiv) {
        return
      }

      const distanceFromBottom = topDiv.scrollHeight - topDiv.scrollTop - topDiv.clientHeight

      updateNearBottomState(distanceFromBottom <= 160)
    }

    const handleScroll = () => {
      if (!topDiv) {
        return
      }

      const scrollTop = topDiv.scrollTop

      updateIsNearBottom()

      const effectiveLoadMoreThreshold = Math.max(loadMoreThreshold, topDiv.clientHeight * 0.75)

      if (typeof scrollTop === 'number' && scrollTop <= effectiveLoadMoreThreshold && shouldLoadMore) {
        void loadMore()
      }
    }

    topDiv?.addEventListener('scroll', handleScroll)
    updateIsNearBottom()

    return () => {
      topDiv?.removeEventListener('scroll', handleScroll)
    }
  }, [chatRef, loadMore, loadMoreThreshold, shouldLoadMore, updateNearBottomState])

  useEffect(() => {
    const topDiv = chatRef?.current

    if (!autoScrollEnabled) {
      if (!hasInitialized) {
        setHasInitialized(true)
      }

      return
    }

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
  }, [autoScrollEnabled, bottomRef, chatRef, count, hasInitialized, scheduleScrollToBottom])

  useEffect(() => {
    const handleForcedScroll = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail?.chatId !== chatId) {
        return
      }

      if (!autoScrollEnabled) {
        return
      }

      scheduleScrollToBottom()
    }

    window.addEventListener(CHAT_SCROLL_TO_BOTTOM_EVENT, handleForcedScroll)

    return () => {
      window.removeEventListener(CHAT_SCROLL_TO_BOTTOM_EVENT, handleForcedScroll)
    }
  }, [autoScrollEnabled, chatId, scheduleScrollToBottom])

  return {
    isNearBottom,
  }
}
