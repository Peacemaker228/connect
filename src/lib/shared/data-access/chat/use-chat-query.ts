import { useSocket } from '../../providers'
import qs from 'query-string'
import { useInfiniteQuery } from '@tanstack/react-query'

interface IChatQuery {
  queryKey: string
  apiUrl: string
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
}

export const useChatQuery = ({ queryKey, paramKey, paramValue, apiUrl }: IChatQuery) => {
  const { isConnected } = useSocket()

  const fetchMessages = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: apiUrl,
        query: {
          cursor: pageParam,
          [paramKey]: paramValue,
        },
      },
      { skipNull: true },
    )

    const res = await fetch(url)

    return res.json()
  }

  const { data, fetchNextPage, hasNextPage, status, isFetchingNextPage } = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: [queryKey],
    queryFn: fetchMessages,
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
