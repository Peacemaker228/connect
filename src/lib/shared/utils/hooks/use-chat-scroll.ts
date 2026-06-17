import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { CHAT_SCROLL_TO_BOTTOM_EVENT } from '@/lib/shared/utils/chat-events'

const OLDER_HISTORY_LOAD_DEBOUNCE_MS = 80

interface IUseChatScroll {
  autoScrollEnabled?: boolean
  chatId: string
  chatRef: RefObject<HTMLDivElement>
  shouldLoadMore: boolean
  loadMore: () => Promise<void> | void
  loadMoreThreshold?: number
  count: number
  onNearBottomChange?: (isNearBottom: boolean) => void
  onScrollPositionChange?: (scrollTop: number) => void
}

export const useChatScroll = ({
  autoScrollEnabled = true,
  chatId,
  chatRef,
  shouldLoadMore,
  loadMore,
  loadMoreThreshold = 240,
  count,
  onNearBottomChange,
  onScrollPositionChange,
}: IUseChatScroll) => {
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const isNearBottomRef = useRef(true)
  const lastScrollTopRef = useRef<number | null>(null)
  const pendingLoadMoreTimeoutRef = useRef<number | null>(null)

  const clearPendingLoadMore = useCallback(() => {
    if (pendingLoadMoreTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(pendingLoadMoreTimeoutRef.current)
    pendingLoadMoreTimeoutRef.current = null
  }, [])

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
    updateNearBottomState(true)
  }, [chatRef, updateNearBottomState])

  const scheduleScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => scrollToBottom())
    window.setTimeout(() => scrollToBottom(), 50)
    window.setTimeout(() => scrollToBottom('smooth'), 150)
  }, [scrollToBottom])

  useEffect(() => {
    setHasInitialized(false)
    lastScrollTopRef.current = null
    clearPendingLoadMore()
    updateNearBottomState(true)
  }, [chatId, clearPendingLoadMore, updateNearBottomState])

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
      const previousScrollTop = lastScrollTopRef.current
      const isScrollingTowardOlderHistory = previousScrollTop === null || scrollTop <= previousScrollTop
      lastScrollTopRef.current = scrollTop
      onScrollPositionChange?.(scrollTop)

      updateIsNearBottom()

      const effectiveLoadMoreThreshold = Math.max(loadMoreThreshold, topDiv.clientHeight * 0.75)
      const shouldRequestOlderHistory =
        typeof scrollTop === 'number' &&
        scrollTop <= effectiveLoadMoreThreshold &&
        shouldLoadMore &&
        isScrollingTowardOlderHistory

      if (!shouldRequestOlderHistory) {
        clearPendingLoadMore()
        return
      }

      if (pendingLoadMoreTimeoutRef.current !== null) {
        return
      }

      pendingLoadMoreTimeoutRef.current = window.setTimeout(() => {
        pendingLoadMoreTimeoutRef.current = null

        const latestScrollTop = topDiv.scrollTop
        const isStillAtOlderBoundary = latestScrollTop <= effectiveLoadMoreThreshold
        const didNotReverseTowardLatest = latestScrollTop <= (lastScrollTopRef.current ?? latestScrollTop)

        if (isStillAtOlderBoundary && didNotReverseTowardLatest && shouldLoadMore) {
          void loadMore()
        }
      }, OLDER_HISTORY_LOAD_DEBOUNCE_MS)
    }

    topDiv?.addEventListener('scroll', handleScroll)
    lastScrollTopRef.current = topDiv?.scrollTop ?? null
    updateIsNearBottom()

    return () => {
      topDiv?.removeEventListener('scroll', handleScroll)
      clearPendingLoadMore()
    }
  }, [
    chatRef,
    clearPendingLoadMore,
    loadMore,
    loadMoreThreshold,
    onScrollPositionChange,
    shouldLoadMore,
    updateNearBottomState,
  ])

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
  }, [autoScrollEnabled, chatRef, count, hasInitialized, scheduleScrollToBottom])

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
