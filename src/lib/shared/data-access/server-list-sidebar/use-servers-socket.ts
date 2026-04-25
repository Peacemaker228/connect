import { useEffect } from 'react'
import {
  getServerMembersRealtimeKey,
  type ServerMembersRealtimePayload,
} from '@app-core/contracts/server-slice-realtime'
import { useSocket } from '../../providers'
import { ERoutes } from '@app-core/routing/routes'
import { useRouter } from 'next/navigation'
import { useGetProfile } from '@sdk/queries/profile'
import { useGetServer } from '@sdk/queries/server'
import { useToast } from '@/lib/shared/utils/hooks/use-toast'

export const useServersSocket = (serverId: string | undefined) => {
  const router = useRouter()
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

  return socket
}
