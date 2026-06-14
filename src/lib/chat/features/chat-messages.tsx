'use client'

import type { ChatMessageDto, MemberDto } from '@app-core/contracts'
import { fetchChatReplyTargetContext, type ChatMessagesPage } from '@sdk/queries/chat'
import {
  getChatMessagesRealtimeKey,
  getChatMessagesUpdateRealtimeKey,
} from '@app-core/contracts/message-slice-realtime'
import { ElementRef, FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TChannelConversation } from '@/types'
import { Loader2, ServerCrash } from 'lucide-react'
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

type MessageWithMemberWithProfile = ChatMessageDto

type UnreadAnchor = {
  chatKey: string
  lastReadAt: Date | string
}

const REPLY_NAVIGATION_HIGHLIGHT_MS = 1800

const getTimestampValue = (value: Date | string) => new Date(value).getTime()

const getDedupedChatPages = (pages: ChatMessagesPage[]) => {
  const seenMessageIds = new Set<string>()

  return pages
    .map((page) => ({
      ...page,
      items: page.items.filter((message) => {
        if (seenMessageIds.has(message.id)) {
          return false
        }

        seenMessageIds.add(message.id)
        return true
      }),
    }))
    .filter((page) => page.items.length > 0)
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
  const replyNavigationHighlightTimeoutRef = useRef<number | null>(null)
  const pendingReplyTargetContextIdRef = useRef<string | null>(null)
  const [unreadAnchor, setUnreadAnchor] = useState<UnreadAnchor | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [replyNavigationHighlightedMessageId, setReplyNavigationHighlightedMessageId] = useState<string | null>(null)
  const [replyTargetContextPages, setReplyTargetContextPages] = useState<ChatMessagesPage[]>([])
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
    setUnreadAnchor(null)
    setEditingMessageId(null)
    setReplyNavigationHighlightedMessageId(null)
    setReplyTargetContextPages([])
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

  const scrollToLoadedReplyTarget = useCallback((messageId: string) => {
    const targetElement = messageElementByIdRef.current.get(messageId)

    if (!targetElement || !chatRef.current?.contains(targetElement)) {
      return false
    }

    targetElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
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
    (messageId: string) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (scrollToLoadedReplyTarget(messageId)) {
            return
          }

          window.setTimeout(() => {
            scrollToLoadedReplyTarget(messageId)
          }, 50)
        })
      })
    },
    [scrollToLoadedReplyTarget],
  )

  const navigateToReplyTarget = useCallback(
    async (messageId: string) => {
      if (scrollToLoadedReplyTarget(messageId)) {
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

        setReplyTargetContextPages((currentPages) => [...currentPages, { ...contextPage, nextCursor: null }])
        scheduleReplyTargetScroll(messageId)
      } catch {
        // Failing to load a reply target context must not move the user to the wrong message.
      } finally {
        pendingReplyTargetContextIdRef.current = null
      }
    },
    [messageApiUrl, messageQuery, scheduleReplyTargetScroll, scrollToLoadedReplyTarget],
  )

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
    setReplyTargetContextPages((currentPages) => patchChatMessagesPages(currentPages, message))
  }, [])

  useChatSocket({ queryKey, addKey, onMessageUpdate: patchReplyTargetContextPages, updateKey })
  const { isNearBottom } = useChatScroll({
    chatId,
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  })
  useMarkChatRead({
    beforeMarkRead: captureUnreadAnchor,
    enabled: unreadSummaryStatus !== 'pending',
    isNearBottom,
    serverId,
    paramKey,
    paramValue,
  })

  useEffect(() => {
    setActiveChatReadState({
      isNearBottom,
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
  }, [isNearBottom, paramKey, paramValue, serverId])

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

  const t = useTranslations('ChannelPage')
  const commonTranslation = useTranslations('Common')
  const visiblePages = useMemo(
    () => getDedupedChatPages([...(data?.pages ?? []), ...replyTargetContextPages]),
    [data?.pages, replyTargetContextPages],
  )
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
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome name={name} type={type} />}
      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className={
                'text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition text-xs my-4'
              }>
              {t('loadMessages')}
            </button>
          )}
        </div>
      )}
      <div className={'flex flex-col-reverse mt-auto'}>
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
      <div ref={bottomRef} />
    </div>
  )
}
