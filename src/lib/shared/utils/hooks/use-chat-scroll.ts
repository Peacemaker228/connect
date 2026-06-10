import { RefObject, useEffect, useRef, useState } from 'react'

interface IUseChatScroll {
  chatRef: RefObject<HTMLDivElement>
  bottomRef: RefObject<HTMLDivElement>
  shouldLoadMore: boolean
  loadMore: () => void
  count: number
}

export const useChatScroll = ({ chatRef, bottomRef, shouldLoadMore, loadMore, count }: IUseChatScroll) => {
  const [hasInitialized, setHasInitialized] = useState(false)
  const isNearBottomRef = useRef(true)

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

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      const container = chatRef.current

      if (!container) {
        return
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      })
      bottomRef.current?.scrollIntoView({ block: 'end', behavior })
    }

    requestAnimationFrame(() => scrollToBottom())
    window.setTimeout(() => scrollToBottom(), 50)
    window.setTimeout(() => scrollToBottom('smooth'), 150)
  }, [bottomRef, chatRef, count, hasInitialized])
}
