'use client'

import { Member, Message, Profile } from '@prisma/client'
import { ElementRef, FC, Fragment, useRef } from 'react'
import { TChannelConversation } from '@/types'
import { useChatQuery } from '@/hooks/use-chat-query'
import { Loader2, ServerCrash } from 'lucide-react'
import { ChatItem, ChatWelcome } from '@/components/chat'
import { format } from 'date-fns'
import { EDateFormat } from '@/lib/dateFormat'
import { useChatSocket } from '@/hooks/use-chat-socket'
import { useChatScroll } from '@/hooks/use-chat-scroll'

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile
  }
}

interface IChatMessagesProps {
  name: string
  member: Member
  chatId: string
  apiUrl: string
  socketUrl: string
  socketQuery: Record<string, string>
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  type: TChannelConversation
}

export const ChatMessages: FC<IChatMessagesProps> = ({
  chatId,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
  apiUrl,
  member,
  name,
}) => {
  const queryKey = `chat:${chatId}`
  const addKey = `chat:${chatId}:messages`
  const updateKey = `chat:${chatId}:messages:update`

  const chatRef = useRef<ElementRef<'div'>>(null)
  const bottomRef = useRef<ElementRef<'div'>>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useChatQuery({
    queryKey,
    apiUrl,
    paramKey,
    paramValue,
  })
  useChatSocket({ queryKey, addKey, updateKey })
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  })

  if (status === 'pending') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Загрузка сообщений...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Что-то пошло не так!</p>
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
              Загрузить предыдущие сообщения
            </button>
          )}
        </div>
      )}
      <div className={'flex flex-col-reverse mt-auto'}>
        {data?.pages?.map((page, i) => (
          <Fragment key={i}>
            {page.items.map((m: MessageWithMemberWithProfile) => (
              <ChatItem
                fileUrl={m.fileUrl}
                socketUrl={socketUrl}
                socketQuery={socketQuery}
                currentMember={member}
                id={m.id}
                member={m.member}
                content={m.content}
                deleted={m.deleted}
                isUpdated={m.updatedAt !== m.createdAt}
                timestamp={format(new Date(m.createdAt), EDateFormat.MESSAGE_ITEM)}
                key={m.id}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
