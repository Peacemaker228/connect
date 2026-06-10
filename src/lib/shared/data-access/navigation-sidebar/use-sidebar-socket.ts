import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ServerListItemDto, ServerMembersProfilesDto } from '@app-core/contracts'
import {
  getServerChannelsRealtimeKey,
  getServerMembersRealtimeKey,
  getServerProfileRealtimeKey,
  SERVER_CHANNEL_REALTIME_ACTIONS,
  SERVER_MEMBER_REALTIME_ACTIONS,
  type ServerChannelsRealtimePayload,
  type ServerMembersRealtimePayload,
  type ServerProfileRealtimePayload,
} from '@app-core/contracts/server-slice-realtime'
import { getServerQueryKey } from '@sdk/queries/server'
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

    const handleServerProfileEvent = (data: ServerProfileRealtimePayload) => {
      if (data.action !== 'server_updated' || data.server.id !== serverId) {
        return
      }

      queryClient.setQueryData<ServerListItemDto[]>(['servers'], (servers) => {
        if (!servers?.some((server) => server.id === data.server.id)) {
          return servers
        }

        return servers.map((server) =>
          server.id === data.server.id ? { ...server, ...data.server } : server,
        )
      })
      queryClient.setQueryData<ServerMembersProfilesDto>(getServerQueryKey(data.server.id), (server) =>
        server ? { ...server, ...data.server } : server,
      )
    }

    const channelsKey = getServerChannelsRealtimeKey(serverId)
    const membersKey = getServerMembersRealtimeKey(serverId)
    const profileKey = getServerProfileRealtimeKey(serverId)

    socket.on(channelsKey, handleChannelEvent)
    socket.on(membersKey, handleMemberEvent)
    socket.on(profileKey, handleServerProfileEvent)

    return () => {
      socket.off(channelsKey, handleChannelEvent)
      socket.off(membersKey, handleMemberEvent)
      socket.off(profileKey, handleServerProfileEvent)
    }
  }, [serverId, queryClient, socket])

  return socket
}
