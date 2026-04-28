import { useInfiniteQuery } from '@tanstack/react-query'
import { Member, Message, Profile } from '@prisma/client'
import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

export type ChatMessage = Message & {
  member: Member & {
    profile: Profile
  }
}

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

const normalizeChatApiUrl = (apiUrl: string) => {
  if (!getBackendApiBaseUrl()) {
    return apiUrl
  }

  return apiUrl
    .replace('/api/socket/messages', '/api/messages')
    .replace('/api/socket/direct-messages', '/api/direct-messages')
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

  return `${normalizeChatApiUrl(apiUrl)}?${searchParams.toString()}`
}

export const useChatQuery = ({ queryKey, paramKey, paramValue, apiUrl, isConnected }: ChatQueryParams) => {
  const fetchMessages = async (cursor?: string) => {
    const response = await privateApiInstance.get<ChatMessagesPage>(
      createChatQueryPath(apiUrl, {
        cursor,
        paramKey,
        paramValue,
      }),
    )

    return response.data
  }

  const { data, fetchNextPage, hasNextPage, status, isFetchingNextPage } = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: [queryKey],
    queryFn: ({ pageParam }) => fetchMessages(pageParam),
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
