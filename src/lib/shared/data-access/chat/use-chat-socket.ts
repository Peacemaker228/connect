import { useSocket } from '../../providers'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ChatMessageDto } from '@app-core/contracts'
import { patchChatMessagesPages } from '@/lib/shared/data-access/chat/chat-message-page-patch'

type TMessageMemberProfile = ChatMessageDto

type ChatMessagesInfiniteData = {
  pages: Array<{
    items: TMessageMemberProfile[]
  }>
  pageParams?: unknown[]
}

interface IChatSocket {
  addKey: string
  onMessageUpdate?: (message: TMessageMemberProfile) => void
  updateKey: string
  queryKey: string
}

export const useChatSocket = ({ addKey, onMessageUpdate, updateKey, queryKey }: IChatSocket) => {
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    socket.on(updateKey, (message: TMessageMemberProfile) => {
      queryClient.setQueryData<ChatMessagesInfiniteData>([queryKey], (oldData) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData

        const newData = patchChatMessagesPages(oldData.pages, message)

        return {
          ...oldData,
          pages: newData,
        }
      })
      onMessageUpdate?.(message)
    })

    socket.on(addKey, (message: TMessageMemberProfile) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message],
              },
            ],
          }
        }

        const newData = [...oldData.pages]
        const alreadyExists = newData.some((page) =>
          page.items?.some((item: TMessageMemberProfile) => item.id === message.id),
        )

        if (alreadyExists) {
          return oldData
        }

        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items],
        }

        return {
          ...oldData,
          pages: newData,
        }
      })
    })

    return () => {
      socket.off(addKey)
      socket.off(updateKey)
    }
  }, [addKey, onMessageUpdate, queryClient, queryKey, socket, updateKey])
}
