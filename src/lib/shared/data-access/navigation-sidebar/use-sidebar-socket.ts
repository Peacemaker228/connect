import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '../../providers'

type SocketData = { action: string }

export const useSidebarSocket = (serverId: string) => {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const channelActions = useMemo(() => ['channel_updated', 'channel_deleted', 'channel_created'], [])
  const memberActions = useMemo(() => ['member_deleted', 'member_role_updated', 'member_left', 'member_added'], [])

  useEffect(() => {
    if (!socket) return

    const handleChannelEvent = (data: SocketData) => {
      if (channelActions.includes(data.action)) {
        queryClient.invalidateQueries({ queryKey: ['server', serverId] })
      }
    }

    const handleMemberEvent = (data: SocketData) => {
      if (memberActions.includes(data.action)) {
        queryClient.invalidateQueries({ queryKey: ['server', serverId] })
      }
    }

    socket.on(`server:${serverId}:channels`, handleChannelEvent)
    socket.on(`server:${serverId}:members`, handleMemberEvent)

    return () => {
      socket.off(`server:${serverId}:channels`, handleChannelEvent)
      socket.off(`server:${serverId}:members`, handleMemberEvent)
    }
  }, [serverId, queryClient, socket, channelActions, memberActions])

  return socket
}

// import { useEffect } from 'react'
// import { useQueryClient } from '@tanstack/react-query'
// import { useSocket } from '@/components/providers'
//
// export const useSidebarSocket = (serverId: string) => {
//   const queryClient = useQueryClient()
//   const { socket } = useSocket()
//
//   useEffect(() => {
//     if (!socket) return
//
//     socket.on(`server:${serverId}:channels`, (data: { action: string }) => {
//       if (data.action === 'channel_updated' || data.action === 'channel_deleted' || data.action === 'channel_created') {
//         queryClient.invalidateQueries({ queryKey: ['server', serverId] })
//       }
//     })
//
//     socket.on(`server:${serverId}:members`, (data: { action: string }) => {
//       if (
//         data.action === 'member_deleted' ||
//         data.action === 'member_role_updated' ||
//         data.action === 'member_left' ||
//         data.action === 'member_added'
//       ) {
//         queryClient.invalidateQueries({ queryKey: ['server', serverId] })
//       }
//     })
//
//     return () => {
//       socket.off(`server:${serverId}:channels`)
//       socket.off(`server:${serverId}:members`)
//     }
//   }, [serverId, queryClient, socket])
//
//   return socket
// }
