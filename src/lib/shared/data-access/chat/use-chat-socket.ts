import { useSocket } from '../../providers'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Member, Message, Profile } from '@prisma/client'

type TMessageMemberProfile = Message & {
  member: Member & {
    profile: Profile
  }
}

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
