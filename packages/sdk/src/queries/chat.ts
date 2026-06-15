import { useInfiniteQuery } from '@tanstack/react-query'
import type { ChatMessageDto } from '@app-core/contracts'
import { privateApiInstance } from '../api/http-client'

export type ChatMessage = ChatMessageDto

export type ChatMessagesPage = {
  items: ChatMessage[]
  nextCursor?: string | null
  newerCursor?: string | null
  olderCursor?: string | null
}

export type ChatHistoryDirection = 'newer' | 'older'

export type ChatReplyTargetContextParams = {
  apiUrl: string
  direction?: ChatHistoryDirection
  messageId: string
  query: Record<string, string>
}

export type ChatQueryParams = {
  queryKey: string
  apiUrl: string
  initialLimit?: number
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  isConnected: boolean
}

const createChatQueryPath = (
  apiUrl: string,
  params: {
    cursor?: string
    limit?: number
    paramKey: ChatQueryParams['paramKey']
    paramValue: string
  },
) => {
  const searchParams = new URLSearchParams({
    [params.paramKey]: params.paramValue,
  })

  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  return `${apiUrl}?${searchParams.toString()}`
}

export const getChatQueryKey = (queryKey: string) => [queryKey] as const

export const fetchChatMessagesPage = async ({
  apiUrl,
  cursor,
  limit,
  paramKey,
  paramValue,
}: {
  apiUrl: string
  cursor?: string
  limit?: number
  paramKey: ChatQueryParams['paramKey']
  paramValue: string
}) => {
  const response = await privateApiInstance.get<ChatMessagesPage>(
    createChatQueryPath(apiUrl, {
      cursor,
      limit,
      paramKey,
      paramValue,
    }),
  )

  return response.data
}

export const fetchChatReplyTargetContext = async ({
  apiUrl,
  direction,
  messageId,
  query,
}: ChatReplyTargetContextParams) => {
  const searchParams = new URLSearchParams(query)

  if (direction) {
    searchParams.set('direction', direction)
  }

  const response = await privateApiInstance.get<ChatMessagesPage>(
    `${apiUrl}/${messageId}/context?${searchParams.toString()}`,
  )

  return response.data
}

export const useChatQuery = ({ queryKey, paramKey, paramValue, apiUrl, initialLimit, isConnected }: ChatQueryParams) => {
  const { data, fetchNextPage, hasNextPage, isFetchedAfterMount, status, isFetchingNextPage } = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: getChatQueryKey(queryKey),
    queryFn: ({ pageParam }) =>
      fetchChatMessagesPage({
        apiUrl,
        cursor: pageParam,
        limit: initialLimit,
        paramKey,
        paramValue,
      }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    refetchInterval: isConnected ? false : 1000,
  })

  return {
    data,
    fetchNextPage,
    isFetchingNextPage,
    isFetchedAfterMount,
    status,
    hasNextPage,
  }
}
