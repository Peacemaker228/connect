import { useSocket } from '../../providers'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ChatMessageDto, MessageReplyPreviewDto } from '@app-core/contracts'

type TMessageMemberProfile = ChatMessageDto

const toReplyPreview = (message: TMessageMemberProfile): MessageReplyPreviewDto => ({
  id: message.id,
  content: message.content,
  createdAt: message.createdAt,
  deleted: message.deleted,
  fileUrl: message.fileUrl,
  member: message.member,
  memberId: message.memberId,
  mentions: message.mentions,
})

const shouldRefreshReplyPreview = (item: TMessageMemberProfile, updatedMessageId: string) =>
  item.replyTo?.id === updatedMessageId ||
  item.replyToMessageId === updatedMessageId ||
  item.replyToDirectMessageId === updatedMessageId

interface IChatSocket {
  addKey: string
  updateKey: string
  queryKey: string
}

export const useChatSocket = ({ addKey, updateKey, queryKey }: IChatSocket) => {
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    socket.on(updateKey, (message: TMessageMemberProfile) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: TMessageMemberProfile) => {
              if (item.id === message.id) {
                return message
              }

              if (shouldRefreshReplyPreview(item, message.id)) {
                return {
                  ...item,
                  replyTo: toReplyPreview(message),
                }
              }

              return item
            }),
          }
        })

        return {
          ...oldData,
          pages: newData,
        }
      })
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
  }, [addKey, queryClient, queryKey, socket, updateKey])
}
