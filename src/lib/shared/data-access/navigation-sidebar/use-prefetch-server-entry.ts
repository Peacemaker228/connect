'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchChatMessagesPage, getChatQueryKey, type ChatMessagesPage } from '@sdk/queries/chat'
import { fetchServer, getServerQueryKey } from '@sdk/queries/server'

const SERVER_ENTRY_MESSAGE_API_URL = '/api/messages'
const SERVER_ENTRY_NAVIGATION_WAIT_MS = 200
const SERVER_ENTRY_PREFETCH_STALE_TIME_MS = 10_000

type UsePrefetchServerEntryParams = {
  currentServerId?: string | null
  initialChannelId?: string | null
  serverId: string
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

export const usePrefetchServerEntry = ({
  currentServerId,
  initialChannelId,
  serverId,
}: UsePrefetchServerEntryParams) => {
  const queryClient = useQueryClient()
  const isCurrentServer = currentServerId === serverId

  const prefetchServerEntry = useCallback(() => {
    if (!serverId || isCurrentServer) {
      return Promise.resolve()
    }

    const tasks: Promise<unknown>[] = [
      queryClient.prefetchQuery({
        queryKey: getServerQueryKey(serverId),
        queryFn: () => fetchServer(serverId),
        staleTime: SERVER_ENTRY_PREFETCH_STALE_TIME_MS,
      }),
    ]

    if (initialChannelId) {
      tasks.push(
        queryClient.prefetchInfiniteQuery({
          initialPageParam: undefined as string | undefined,
          queryKey: getChatQueryKey(`chat:${initialChannelId}`),
          queryFn: ({ pageParam }) =>
            fetchChatMessagesPage({
              apiUrl: SERVER_ENTRY_MESSAGE_API_URL,
              cursor: pageParam,
              paramKey: 'channelId',
              paramValue: initialChannelId,
            }),
          getNextPageParam: (lastPage: ChatMessagesPage) => lastPage?.nextCursor,
          staleTime: SERVER_ENTRY_PREFETCH_STALE_TIME_MS,
        }),
      )
    }

    return Promise.allSettled(tasks).then(() => undefined)
  }, [initialChannelId, isCurrentServer, queryClient, serverId])

  const waitForServerEntryPrefetch = useCallback(async () => {
    if (isCurrentServer) {
      return
    }

    const prefetchPromise = prefetchServerEntry()

    await Promise.race([prefetchPromise, wait(SERVER_ENTRY_NAVIGATION_WAIT_MS)])
  }, [isCurrentServer, prefetchServerEntry])

  return {
    prefetchServerEntry,
    waitForServerEntryPrefetch,
  }
}
