import { useSocket } from '../../providers'
import {
  type ChatQueryParams,
  useChatQuery as useBackendAwareChatQuery,
} from '@sdk/queries/chat'

type IChatQuery = Omit<ChatQueryParams, 'isConnected'>

export const useChatQuery = ({ queryKey, paramKey, paramValue, apiUrl }: IChatQuery) => {
  const { isConnected } = useSocket()

  return useBackendAwareChatQuery({
    queryKey,
    paramKey,
    paramValue,
    apiUrl,
    isConnected,
  })
}
