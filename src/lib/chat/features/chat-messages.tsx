'use client'

import type { ChatMessageDto, MemberDto } from '@app-core/contracts'
import { fetchChatReplyTargetContext, type ChatHistoryDirection } from '@sdk/queries/chat'
import {
  getChatMessagesRealtimeKey,
  getChatMessagesUpdateRealtimeKey,
} from '@app-core/contracts/message-slice-realtime'
import { ElementRef, FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TChannelConversation } from '@/types'
import { ArrowDown, Loader2, ServerCrash } from 'lucide-react'
import { ChatItem, ChatWelcome } from '@/lib/chat/features/index'
import { format } from 'date-fns'
import { EDateFormat } from '@/lib/shared/utils/dateFormat'
import { useTranslations } from 'next-intl'
import { useChatSocket } from '@/lib/shared/data-access/chat/use-chat-socket'
import { useChatQuery } from '@/lib/shared/data-access/chat/use-chat-query'
import { useChatScroll } from '@/lib/shared/utils/hooks/use-chat-scroll'
import { useMarkChatRead } from '@/lib/shared/data-access/unread/use-mark-chat-read'
import { useUnreadSummary } from '@sdk/queries/unread'
import {
  clearActiveChatReadState,
  setActiveChatReadState,
} from '@/lib/shared/data-access/unread/active-chat-read-state'
import { useGetServer } from '@sdk/queries/server'
import { createMentionSuggestions } from '@/lib/chat/features/mention-picker-utils'
import { useChatReply } from '@/lib/chat/features/chat-reply-context'
import { CHAT_COMPOSER_FOCUS_EVENT } from '@/lib/shared/utils/chat-events'
import { patchChatMessagesPages } from '@/lib/shared/data-access/chat/chat-message-page-patch'
import { Button } from '@/lib/shared/ui/button'
import { cn } from '@/lib/shared/utils/utils'

type MessageWithMemberWithProfile = ChatMessageDto

type UnreadAnchor = {
  chatKey: string
  lastReadAt: Date | string
}

type AnchoredHistoryState = {
  items: MessageWithMemberWithProfile[]
  newerCursor: string | null
  olderCursor: string | null
  targetMessageId: string
}

type ReplyTargetScrollOptions = {
  fakeSmooth?: boolean
  preferSmooth?: boolean
}

const REPLY_NAVIGATION_HIGHLIGHT_MS = 1800
const LOCAL_SMOOTH_SCROLL_DISTANCE_MULTIPLIER = 3
const HISTORY_LOAD_MORE_THRESHOLD_PX = 480
const VIEWPORT_AUTO_FILL_MULTIPLIER = 1.35
const FAKE_SMOOTH_SCROLL_OFFSET_MULTIPLIER = 0.55

const getTimestampValue = (value: Date | string) => new Date(value).getTime()

const getMessageSortValue = (message: MessageWithMemberWithProfile) => getTimestampValue(message.createdAt)

const mergeChatMessagesByDescendingTime = (
  currentMessages: MessageWithMemberWithProfile[],
  nextMessages: MessageWithMemberWithProfile[],
) => {
  const seenMessageIds = new Set<string>()

  return [...currentMessages, ...nextMessages]
    .filter((message) => {
      if (seenMessageIds.has(message.id)) {
        return false
      }

      seenMessageIds.add(message.id)
      return true
    })
    .sort((leftMessage, rightMessage) => {
      const timestampDiff = getMessageSortValue(rightMessage) - getMessageSortValue(leftMessage)

      return timestampDiff || rightMessage.id.localeCompare(leftMessage.id)
    })
}

const NewMessagesDivider = () => (
  <div className="flex items-center gap-x-3 px-4 py-2 select-none" aria-label="Новые сообщения">
    <div className="h-px flex-1 bg-rose-500/70" />
    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-normal text-white">
      Новое
    </span>
    <div className="h-px flex-1 bg-rose-500/70" />
  </div>
)

interface IChatMessagesProps {
  name: string
  member: MemberDto
  chatId: string
  messageApiUrl: string
  messageQuery: Record<string, string>
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  serverId: string
  type: TChannelConversation
}

export const ChatMessages: FC<IChatMessagesProps> = ({
  chatId,
  messageApiUrl,
  messageQuery,
  paramKey,
  paramValue,
  serverId,
  type,
  member,
  name,
}) => {
  const queryKey = `chat:${chatId}`
  const addKey = getChatMessagesRealtimeKey(chatId)
  const updateKey = getChatMessagesUpdateRealtimeKey(chatId)

  const chatRef = useRef<ElementRef<'div'>>(null)
  const bottomRef = useRef<ElementRef<'div'>>(null)
  const capturedChatKeyRef = useRef<string | null>(null)
  const messageElementByIdRef = useRef(new Map<string, HTMLDivElement>())
  const anchoredHistoryLoadingDirectionRef = useRef<ChatHistoryDirection | null>(null)
  const olderHistoryLoadInFlightRef = useRef(false)
  const viewportFillInFlightRef = useRef(false)
  const replyNavigationHighlightTimeoutRef = useRef<number | null>(null)
  const pendingReplyTargetContextIdRef = useRef<string | null>(null)
  const [unreadAnchor, setUnreadAnchor] = useState<UnreadAnchor | null>(null)
  const [anchoredHistory, setAnchoredHistory] = useState<AnchoredHistoryState | null>(null)
  const [anchoredHistoryLoadingDirection, setAnchoredHistoryLoadingDirection] =
    useState<ChatHistoryDirection | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [replyNavigationHighlightedMessageId, setReplyNavigationHighlightedMessageId] = useState<string | null>(null)
  const { setReplyTo } = useChatReply()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useChatQuery({
    queryKey,
    apiUrl: messageApiUrl,
    paramKey,
    paramValue,
  })
  const mentionServerId = type === 'channel' ? serverId : ''
  const { data: mentionServer } = useGetServer(mentionServerId)
  const mentionServerMembers = mentionServer?.id === mentionServerId ? mentionServer.members : null
  const mentionSuggestions = useMemo(
    () => (mentionServerId && mentionServerMembers ? createMentionSuggestions(mentionServerMembers) : []),
    [mentionServerId, mentionServerMembers],
  )
  const { data: unreadSummary, status: unreadSummaryStatus } = useUnreadSummary(serverId)
  const chatReadKey = `${serverId}:${paramKey}:${paramValue}`
  const currentUnreadItem = useMemo(() => {
    if (paramKey === 'channelId') {
      return unreadSummary?.channels.find((channel) => channel.channelId === paramValue)
    }

    return unreadSummary?.conversations.find((conversation) => conversation.conversationId === paramValue)
  }, [paramKey, paramValue, unreadSummary])
  const captureUnreadAnchor = useCallback(() => {
    if (capturedChatKeyRef.current === chatReadKey) {
      return
    }

    capturedChatKeyRef.current = chatReadKey

    if (!currentUnreadItem || currentUnreadItem.unreadCount <= 0) {
      setUnreadAnchor(null)
      return
    }

    setUnreadAnchor({
      chatKey: chatReadKey,
      lastReadAt: currentUnreadItem.lastReadAt,
    })
  }, [chatReadKey, currentUnreadItem])

  useEffect(() => {
    capturedChatKeyRef.current = null
    anchoredHistoryLoadingDirectionRef.current = null
    setAnchoredHistory(null)
    setAnchoredHistoryLoadingDirection(null)
    setUnreadAnchor(null)
    setEditingMessageId(null)
    setReplyNavigationHighlightedMessageId(null)
  }, [chatReadKey])

  useEffect(() => {
    return () => {
      if (replyNavigationHighlightTimeoutRef.current) {
        window.clearTimeout(replyNavigationHighlightTimeoutRef.current)
        replyNavigationHighlightTimeoutRef.current = null
      }
    }
  }, [])

  const registerMessageElement = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (!element) {
      messageElementByIdRef.current.delete(messageId)
      return
    }

    messageElementByIdRef.current.set(messageId, element)
  }, [])

  const scrollToLoadedReplyTarget = useCallback((messageId: string, options: ReplyTargetScrollOptions = {}) => {
    const container = chatRef.current
    const targetElement = messageElementByIdRef.current.get(messageId)

    if (!container || !targetElement || !container.contains(targetElement)) {
      return false
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const centeredTop =
      container.scrollTop + targetRect.top - containerRect.top - (container.clientHeight - targetRect.height) / 2
    const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0)
    const nextScrollTop = Math.max(0, Math.min(centeredTop, maxScrollTop))
    const distance = Math.abs(nextScrollTop - container.scrollTop)
    const canUseNativeSmooth =
      options.preferSmooth && distance <= container.clientHeight * LOCAL_SMOOTH_SCROLL_DISTANCE_MULTIPLIER

    if (options.fakeSmooth && !canUseNativeSmooth && maxScrollTop > 0) {
      const direction = nextScrollTop >= container.scrollTop ? -1 : 1
      const fakeOffset = Math.min(
        container.clientHeight * FAKE_SMOOTH_SCROLL_OFFSET_MULTIPLIER,
        Math.max(distance, container.clientHeight * 0.35),
      )
      const fakeStartTop = Math.max(0, Math.min(nextScrollTop + direction * fakeOffset, maxScrollTop))

      container.scrollTo({
        top: fakeStartTop,
        behavior: 'auto',
      })

      window.requestAnimationFrame(() => {
        container.scrollTo({
          top: nextScrollTop,
          behavior: 'smooth',
        })
      })
    } else {
      container.scrollTo({
        top: nextScrollTop,
        behavior: canUseNativeSmooth ? 'smooth' : 'auto',
      })
    }
    setReplyNavigationHighlightedMessageId(messageId)

    if (replyNavigationHighlightTimeoutRef.current) {
      window.clearTimeout(replyNavigationHighlightTimeoutRef.current)
    }

    replyNavigationHighlightTimeoutRef.current = window.setTimeout(() => {
      setReplyNavigationHighlightedMessageId((currentMessageId) =>
        currentMessageId === messageId ? null : currentMessageId,
      )
      replyNavigationHighlightTimeoutRef.current = null
    }, REPLY_NAVIGATION_HIGHLIGHT_MS)

    return true
  }, [])

  const scheduleReplyTargetScroll = useCallback(
    (messageId: string, options: ReplyTargetScrollOptions = {}) => {
      const tryScrollToTarget = () => scrollToLoadedReplyTarget(messageId, options)

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (tryScrollToTarget()) {
            window.setTimeout(() => {
              tryScrollToTarget()
            }, 120)
          }

          window.setTimeout(() => {
            if (tryScrollToTarget()) {
              window.setTimeout(() => {
                tryScrollToTarget()
              }, 120)
            }
          }, 50)
        })
      })
    },
    [scrollToLoadedReplyTarget],
  )

  const navigateToReplyTarget = useCallback(
    async (messageId: string) => {
      if (scrollToLoadedReplyTarget(messageId, { fakeSmooth: true, preferSmooth: true })) {
        return
      }

      if (pendingReplyTargetContextIdRef.current === messageId) {
        return
      }

      pendingReplyTargetContextIdRef.current = messageId

      try {
        const contextPage = await fetchChatReplyTargetContext({
          apiUrl: messageApiUrl,
          messageId,
          query: messageQuery,
        })

        setAnchoredHistory({
          items: contextPage.items,
          newerCursor: contextPage.newerCursor ?? null,
          olderCursor: contextPage.olderCursor ?? null,
          targetMessageId: messageId,
        })
        scheduleReplyTargetScroll(messageId, { fakeSmooth: true, preferSmooth: false })
      } catch {
        // Failing to load a reply target context must not move the user to the wrong message.
      } finally {
        pendingReplyTargetContextIdRef.current = null
      }
    },
    [messageApiUrl, messageQuery, scheduleReplyTargetScroll, scrollToLoadedReplyTarget],
  )

  const loadAnchoredHistoryMessages = useCallback(
    async (direction: ChatHistoryDirection) => {
      const cursorMessageId = direction === 'older' ? anchoredHistory?.olderCursor : anchoredHistory?.newerCursor

      if (!anchoredHistory || !cursorMessageId || anchoredHistoryLoadingDirectionRef.current) {
        return
      }

      anchoredHistoryLoadingDirectionRef.current = direction
      setAnchoredHistoryLoadingDirection(direction)

      try {
        const contextPage = await fetchChatReplyTargetContext({
          apiUrl: messageApiUrl,
          direction,
          messageId: cursorMessageId,
          query: messageQuery,
        })

        setAnchoredHistory((currentHistory) => {
          if (!currentHistory) {
            return currentHistory
          }

          return {
            ...currentHistory,
            items: mergeChatMessagesByDescendingTime(currentHistory.items, contextPage.items),
            newerCursor: direction === 'newer' ? (contextPage.newerCursor ?? null) : currentHistory.newerCursor,
            olderCursor: direction === 'older' ? (contextPage.olderCursor ?? null) : currentHistory.olderCursor,
          }
        })
      } catch {
        // Adjacent history loading is best-effort; failed loads should not jump or corrupt the current range.
      } finally {
        anchoredHistoryLoadingDirectionRef.current = null
        setAnchoredHistoryLoadingDirection(null)
      }
    },
    [anchoredHistory, messageApiUrl, messageQuery],
  )

  const loadOlderMessagesPreservingViewport = useCallback(
    async (loadMessages: () => Promise<unknown> | void) => {
      if (olderHistoryLoadInFlightRef.current) {
        return
      }

      const container = chatRef.current
      const previousScrollHeight = container?.scrollHeight ?? 0
      const previousScrollTop = container?.scrollTop ?? 0

      olderHistoryLoadInFlightRef.current = true

      try {
        await loadMessages()
      } finally {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const nextContainer = chatRef.current

            if (!nextContainer) {
              olderHistoryLoadInFlightRef.current = false
              return
            }

            const scrollHeightDelta = nextContainer.scrollHeight - previousScrollHeight

            if (scrollHeightDelta > 0) {
              nextContainer.scrollTop = previousScrollTop + scrollHeightDelta
            }

            olderHistoryLoadInFlightRef.current = false
          })
        })
      }
    },
    [],
  )

  const loadOlderMessages = useCallback(async (options: { preserveViewport?: boolean } = {}) => {
    const loadMessages = () => {
      if (anchoredHistory) {
        return loadAnchoredHistoryMessages('older')
      }

      return fetchNextPage()
    }

    if (options.preserveViewport === false) {
      await loadMessages()
      return
    }

    await loadOlderMessagesPreservingViewport(loadMessages)
  }, [anchoredHistory, fetchNextPage, loadAnchoredHistoryMessages, loadOlderMessagesPreservingViewport])

  const jumpToLatestMessages = useCallback(() => {
    const wasAnchored = Boolean(anchoredHistory)
    anchoredHistoryLoadingDirectionRef.current = null
    setAnchoredHistory(null)
    setAnchoredHistoryLoadingDirection(null)
    setReplyNavigationHighlightedMessageId(null)

    window.requestAnimationFrame(() => {
      const container = chatRef.current

      if (!container) {
        return
      }

      const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0)
      const distance = Math.abs(maxScrollTop - container.scrollTop)
      const canUseNativeSmooth =
        !wasAnchored && distance <= container.clientHeight * LOCAL_SMOOTH_SCROLL_DISTANCE_MULTIPLIER

      if (canUseNativeSmooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
        bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
        return
      }

      const fakeOffset = Math.min(container.clientHeight * 0.85, maxScrollTop)
      const fakeStartTop = Math.max(0, maxScrollTop - fakeOffset)

      container.scrollTo({
        top: fakeStartTop,
        behavior: 'auto',
      })
      window.requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
        bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
      })
    })
  }, [anchoredHistory])

  const handleReply = useCallback(
    (message: MessageWithMemberWithProfile['replyTo']) => {
      if (!message) {
        return
      }

      setReplyTo(message)
      window.dispatchEvent(new CustomEvent(CHAT_COMPOSER_FOCUS_EVENT, { detail: { chatId, mode: 'reply' } }))
    },
    [chatId, setReplyTo],
  )

  const patchReplyTargetContextPages = useCallback((message: MessageWithMemberWithProfile) => {
    setAnchoredHistory((currentHistory) => {
      if (!currentHistory) {
        return currentHistory
      }

      const [{ items }] = patchChatMessagesPages([{ items: currentHistory.items }], message)

      return {
        ...currentHistory,
        items,
      }
    })
  }, [])

  useChatSocket({ queryKey, addKey, onMessageUpdate: patchReplyTargetContextPages, updateKey })
  const isAnchoredHistoryMode = Boolean(anchoredHistory)
  const { isNearBottom } = useChatScroll({
    autoScrollEnabled: !isAnchoredHistoryMode,
    chatId,
    chatRef,
    bottomRef,
    loadMore: loadOlderMessages,
    loadMoreThreshold: HISTORY_LOAD_MORE_THRESHOLD_PX,
    shouldLoadMore: anchoredHistory
      ? Boolean(anchoredHistory.olderCursor) && anchoredHistoryLoadingDirection !== 'older'
      : !isFetchingNextPage && hasNextPage,
    count: isAnchoredHistoryMode ? 0 : (data?.pages?.[0]?.items?.length ?? 0),
  })
  useMarkChatRead({
    beforeMarkRead: captureUnreadAnchor,
    enabled: !isAnchoredHistoryMode && unreadSummaryStatus !== 'pending',
    isNearBottom: !isAnchoredHistoryMode && isNearBottom,
    serverId,
    paramKey,
    paramValue,
  })

  useEffect(() => {
    setActiveChatReadState({
      isNearBottom: !isAnchoredHistoryMode && isNearBottom,
      paramKey,
      paramValue,
      serverId,
    })

    return () => {
      clearActiveChatReadState({
        paramKey,
        paramValue,
        serverId,
      })
    }
  }, [isAnchoredHistoryMode, isNearBottom, paramKey, paramValue, serverId])

  useEffect(() => {
    if (
      isNearBottom ||
      unreadAnchor?.chatKey === chatReadKey ||
      !currentUnreadItem ||
      currentUnreadItem.unreadCount <= 0
    ) {
      return
    }

    setUnreadAnchor({
      chatKey: chatReadKey,
      lastReadAt: currentUnreadItem.lastReadAt,
    })
  }, [chatReadKey, currentUnreadItem, isNearBottom, unreadAnchor?.chatKey])

  useEffect(() => {
    const container = chatRef.current

    if (!container || !anchoredHistory?.newerCursor) {
      return
    }

    const handleAnchoredHistoryScroll = () => {
      if (anchoredHistoryLoadingDirectionRef.current) {
        return
      }

      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const loadMoreThreshold = Math.max(HISTORY_LOAD_MORE_THRESHOLD_PX, container.clientHeight * 0.75)

      if (distanceFromBottom <= loadMoreThreshold) {
        void loadAnchoredHistoryMessages('newer')
      }
    }

    container.addEventListener('scroll', handleAnchoredHistoryScroll)

    return () => {
      container.removeEventListener('scroll', handleAnchoredHistoryScroll)
    }
  }, [anchoredHistory?.newerCursor, anchoredHistoryLoadingDirection, loadAnchoredHistoryMessages])

  const t = useTranslations('ChannelPage')
  const commonTranslation = useTranslations('Common')
  const visiblePages = useMemo(
    () => (anchoredHistory ? [{ items: anchoredHistory.items }] : (data?.pages ?? [])),
    [anchoredHistory, data?.pages],
  )
  const canLoadOlderMessages = anchoredHistory ? Boolean(anchoredHistory.olderCursor) : hasNextPage
  const isLoadingOlderMessages = anchoredHistory ? anchoredHistoryLoadingDirection === 'older' : isFetchingNextPage
  const canLoadNewerAnchoredMessages = Boolean(anchoredHistory?.newerCursor)
  const hasReachedHistoryStart = anchoredHistory ? !anchoredHistory.olderCursor : !hasNextPage
  const isLoadingNewerAnchoredMessages = anchoredHistoryLoadingDirection === 'newer'
  const shouldShowJumpToLatestControl = Boolean(anchoredHistory) || !isNearBottom

  useEffect(() => {
    const container = chatRef.current

    if (!container || status !== 'success' || viewportFillInFlightRef.current) {
      return
    }

    const shouldFillViewport = () =>
      container.scrollHeight > 0 && container.scrollHeight < container.clientHeight * VIEWPORT_AUTO_FILL_MULTIPLIER

    if (!shouldFillViewport()) {
      return
    }

    viewportFillInFlightRef.current = true

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const nextContainer = chatRef.current

        if (!nextContainer) {
          viewportFillInFlightRef.current = false
          return
        }

        const isStillUnderfilled =
          nextContainer.scrollHeight > 0 &&
          nextContainer.scrollHeight < nextContainer.clientHeight * VIEWPORT_AUTO_FILL_MULTIPLIER

        if (!isStillUnderfilled) {
          viewportFillInFlightRef.current = false
          return
        }

        if (anchoredHistory) {
          const targetElement = messageElementByIdRef.current.get(anchoredHistory.targetMessageId)
          const containerRect = nextContainer.getBoundingClientRect()
          const targetRect = targetElement?.getBoundingClientRect()
          const topSpace = targetRect ? targetRect.top - containerRect.top : 0
          const bottomSpace = targetRect ? containerRect.bottom - targetRect.bottom : 0
          const preferOlder = !targetRect || topSpace <= bottomSpace

          const finish = () => {
            window.setTimeout(() => {
              viewportFillInFlightRef.current = false
            }, 0)
          }

          if (preferOlder && anchoredHistory.olderCursor && anchoredHistoryLoadingDirection !== 'older') {
            void loadOlderMessages().finally(finish)
            return
          }

          if (anchoredHistory.newerCursor && anchoredHistoryLoadingDirection !== 'newer') {
            void loadAnchoredHistoryMessages('newer').finally(finish)
            return
          }

          if (anchoredHistory.olderCursor && anchoredHistoryLoadingDirection !== 'older') {
            void loadOlderMessages().finally(finish)
            return
          }

          viewportFillInFlightRef.current = false
          return
        }

        if (hasNextPage && !isFetchingNextPage) {
          void loadOlderMessages({ preserveViewport: false }).finally(() => {
            window.setTimeout(() => {
              viewportFillInFlightRef.current = false
            }, 0)
          })
          return
        }

        viewportFillInFlightRef.current = false
      })
    })
  }, [
    anchoredHistory,
    anchoredHistoryLoadingDirection,
    hasNextPage,
    isFetchingNextPage,
    loadAnchoredHistoryMessages,
    loadOlderMessages,
    status,
    visiblePages,
  ])

  const unreadDividerMessageId = useMemo(() => {
    if (!unreadAnchor || unreadAnchor.chatKey !== chatReadKey) {
      return null
    }

    const anchorTime = getTimestampValue(unreadAnchor.lastReadAt)

    if (!Number.isFinite(anchorTime)) {
      return null
    }

    const unreadMessages =
      data?.pages
        ?.flatMap((page) => page.items)
        .filter((message) => {
          const messageTime = getTimestampValue(message.createdAt)

          return (
            !message.deleted &&
            message.memberId !== member.id &&
            Number.isFinite(messageTime) &&
            messageTime > anchorTime
          )
        }) ?? []

    if (unreadMessages.length === 0) {
      return null
    }

    return unreadMessages.reduce((oldestUnreadMessage, message) =>
      getTimestampValue(message.createdAt) < getTimestampValue(oldestUnreadMessage.createdAt)
        ? message
        : oldestUnreadMessage,
    ).id
  }, [chatReadKey, data?.pages, member.id, unreadAnchor])

  if (status === 'pending') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{commonTranslation('Chat.loadMessages')}...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{commonTranslation('Chat.error')}</p>
      </div>
    )
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
      {hasReachedHistoryStart && <div className="flex-1" />}
      {hasReachedHistoryStart && <ChatWelcome name={name} type={type} />}
      {canLoadOlderMessages && (
        <div className="flex justify-center">
          {isLoadingOlderMessages ? (
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
          ) : (
            <button
              onClick={() => {
                void loadOlderMessages()
              }}
              className={
                'text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition text-xs my-4'
              }>
              {t('loadMessages')}
            </button>
          )}
        </div>
      )}
      <div className={cn('flex flex-col-reverse', !anchoredHistory && 'mt-auto')}>
        {visiblePages.map((page, i) => (
          <Fragment key={i}>
            {page.items.map((m: MessageWithMemberWithProfile) => (
              <Fragment key={m.id}>
                <ChatItem
                  fileUrl={m.fileUrl}
                  messageApiUrl={messageApiUrl}
                  messageQuery={messageQuery}
                  currentMember={member}
                  id={m.id}
                  member={m.member}
                  createdAt={m.createdAt}
                  content={m.content}
                  mentions={m.mentions}
                  replyTo={m.replyTo}
                  replyToDirectMessageId={m.replyToDirectMessageId}
                  replyToMessageId={m.replyToMessageId}
                  serverId={serverId}
                  deleted={m.deleted}
                  isUpdated={m.updatedAt !== m.createdAt}
                  isEditing={editingMessageId === m.id}
                  isReplyNavigationHighlighted={replyNavigationHighlightedMessageId === m.id}
                  onStartEditing={() => setEditingMessageId(m.id)}
                  onCancelEditing={() => {
                    setEditingMessageId((currentEditingMessageId) =>
                      currentEditingMessageId === m.id ? null : currentEditingMessageId,
                    )
                  }}
                  onFinishEditing={() => {
                    setEditingMessageId((currentEditingMessageId) =>
                      currentEditingMessageId === m.id ? null : currentEditingMessageId,
                    )
                  }}
                  onReply={handleReply}
                  onNavigateToReplyTarget={navigateToReplyTarget}
                  onRegisterMessageElement={registerMessageElement}
                  mentionSuggestions={mentionSuggestions}
                  timestamp={format(new Date(m.createdAt), EDateFormat.MESSAGE_ITEM)}
                />
                {unreadDividerMessageId === m.id && <NewMessagesDivider />}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
      {anchoredHistory && canLoadNewerAnchoredMessages && (
        <div className="flex justify-center py-2">
          {isLoadingNewerAnchoredMessages ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          ) : (
            <button
              type="button"
              onClick={() => void loadAnchoredHistoryMessages('newer')}
              className="text-xs text-zinc-500 transition hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300">
              {t('loadMessages')}
            </button>
          )}
        </div>
      )}
      {shouldShowJumpToLatestControl && (
        <Button
          type="button"
          size="icon"
          variant="primary"
          aria-label="Jump to latest messages"
          title="Jump to latest messages"
          onClick={jumpToLatestMessages}
          className="sticky bottom-3 z-20 ml-auto mr-4 h-9 w-9 rounded-full shadow-md">
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
