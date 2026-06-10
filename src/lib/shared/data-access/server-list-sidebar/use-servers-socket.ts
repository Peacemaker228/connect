import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ServerListItemDto, ServerMembersProfilesDto } from '@app-core/contracts'
import {
  getServerMembersRealtimeKey,
  getServerProfileRealtimeKey,
  type ServerMembersRealtimePayload,
  type ServerProfileRealtimePayload,
} from '@app-core/contracts/server-slice-realtime'
import { useSocket } from '../../providers'
import { ERoutes } from '@app-core/routing/routes'
import { useRouter } from 'next/navigation'
import { useGetProfile } from '@sdk/queries/profile'
import { getServerQueryKey, useGetServer } from '@sdk/queries/server'
import { useToast } from '@/lib/shared/utils/hooks/use-toast'

export const useServersSocket = (serverId: string | undefined, servers: ServerListItemDto[] | undefined) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { socket } = useSocket()
  const { profile } = useGetProfile()
  const { data: server } = useGetServer(serverId || '')
  const { toast } = useToast()

  useEffect(() => {
    if (!socket || !serverId || !server) return

    const handleRedirectFromServer = (data: ServerMembersRealtimePayload) => {
      if (data.action !== 'member_deleted' || !(data.memberId && server.members)) return

      const member = server.members.find((m) => m.profile.userId === profile?.userId && m.id === data.memberId)

      if (!member) return

      toast({
        title: 'Вы были исключены из сервера',
        variant: 'destructive',
      })

      router.push(ERoutes.MAIN_PAGE)
    }

    const membersKey = getServerMembersRealtimeKey(serverId)

    socket.on(membersKey, handleRedirectFromServer)

    return () => {
      socket.off(membersKey, handleRedirectFromServer)
    }
  }, [serverId, server, socket, profile?.userId, router, toast])

  useEffect(() => {
    if (!socket || !servers?.length) return

    const handleServerProfileEvent = (data: ServerProfileRealtimePayload) => {
      if (data.action !== 'server_updated') {
        return
      }

      queryClient.setQueryData<ServerListItemDto[]>(['servers'], (cachedServers) => {
        if (!cachedServers?.some((cachedServer) => cachedServer.id === data.server.id)) {
          return cachedServers
        }

        return cachedServers.map((cachedServer) =>
          cachedServer.id === data.server.id ? { ...cachedServer, ...data.server } : cachedServer,
        )
      })
      queryClient.setQueryData<ServerMembersProfilesDto>(getServerQueryKey(data.server.id), (cachedServer) =>
        cachedServer ? { ...cachedServer, ...data.server } : cachedServer,
      )
    }

    const profileKeys = servers.map((candidate) => getServerProfileRealtimeKey(candidate.id))

    profileKeys.forEach((profileKey) => {
      socket.on(profileKey, handleServerProfileEvent)
    })

    return () => {
      profileKeys.forEach((profileKey) => {
        socket.off(profileKey, handleServerProfileEvent)
      })
    }
  }, [queryClient, servers, socket])

  return socket
}
