import { useInfiniteQuery } from '@tanstack/react-query'
import type { ChatMessageDto } from '@app-core/contracts'
import { privateApiInstance } from '../api/http-client'

export type ChatMessage = ChatMessageDto

export type ChatMessagesPage = {
  items: ChatMessage[]
  nextCursor?: string | null
}

export type ChatQueryParams = {
  queryKey: string
  apiUrl: string
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  isConnected: boolean
}

const createChatQueryPath = (
  apiUrl: string,
  params: {
    cursor?: string
    paramKey: ChatQueryParams['paramKey']
    paramValue: string
  },
) => {
  const searchParams = new URLSearchParams({
    [params.paramKey]: params.paramValue,
  })

  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  return `${apiUrl}?${searchParams.toString()}`
}

export const getChatQueryKey = (queryKey: string) => [queryKey] as const

export const fetchChatMessagesPage = async ({
  apiUrl,
  cursor,
  paramKey,
  paramValue,
}: {
  apiUrl: string
  cursor?: string
  paramKey: ChatQueryParams['paramKey']
  paramValue: string
}) => {
  const response = await privateApiInstance.get<ChatMessagesPage>(
    createChatQueryPath(apiUrl, {
      cursor,
      paramKey,
      paramValue,
    }),
  )

  return response.data
}

export const useChatQuery = ({ queryKey, paramKey, paramValue, apiUrl, isConnected }: ChatQueryParams) => {
  const { data, fetchNextPage, hasNextPage, status, isFetchingNextPage } = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: getChatQueryKey(queryKey),
    queryFn: ({ pageParam }) =>
      fetchChatMessagesPage({
        apiUrl,
        cursor: pageParam,
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
    status,
    hasNextPage,
  }
}
