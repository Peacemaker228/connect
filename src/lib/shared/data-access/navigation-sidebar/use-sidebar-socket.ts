import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getServerChannelsRealtimeKey,
  getServerMembersRealtimeKey,
  SERVER_CHANNEL_REALTIME_ACTIONS,
  SERVER_MEMBER_REALTIME_ACTIONS,
  type ServerChannelsRealtimePayload,
  type ServerMembersRealtimePayload,
} from '@app-core/contracts/server-slice-realtime'
import { useSocket } from '../../providers'

export const useSidebarSocket = (serverId: string) => {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleChannelEvent = (data: ServerChannelsRealtimePayload) => {
      if (SERVER_CHANNEL_REALTIME_ACTIONS.includes(data.action)) {
        queryClient.invalidateQueries({ queryKey: ['server', serverId] })
      }
    }

    const handleMemberEvent = (data: ServerMembersRealtimePayload) => {
      if (SERVER_MEMBER_REALTIME_ACTIONS.includes(data.action)) {
        queryClient.invalidateQueries({ queryKey: ['server', serverId] })
      }
    }

    const channelsKey = getServerChannelsRealtimeKey(serverId)
    const membersKey = getServerMembersRealtimeKey(serverId)

    socket.on(channelsKey, handleChannelEvent)
    socket.on(membersKey, handleMemberEvent)

    return () => {
      socket.off(channelsKey, handleChannelEvent)
      socket.off(membersKey, handleMemberEvent)
    }
  }, [serverId, queryClient, socket])

  return socket
}
