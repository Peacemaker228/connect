import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '../../providers'
import { ERoutes } from '@/lib/shared/utils/routes'
import { useRouter } from 'next/navigation'
import { useGetProfile } from '@/lib/shared/data-access/user/api'
import { useGetServer } from '@/lib/shared/data-access/server/api'
import { useToast } from '@/lib/shared/utils/hooks/use-toast'

export const useServersSocket = (serverId: string | undefined) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { socket } = useSocket()
  const { profile } = useGetProfile()
  // const [id, setId] = useState(serverId)
  const { data: server, refetch } = useGetServer(serverId || '')
  const { toast } = useToast()

  useEffect(() => {
    if (!socket || !serverId || !server) return

    const handleRedirectFromServer = (data: { action: string; memberId: string }) => {
      if (data.action !== 'member_deleted' || !(data.memberId && server.members)) return

      const member = server.members.find((m) => m.profile.userId === profile?.userId && m.id === data.memberId)

      if (!member) return

      toast({
        title: 'Вы были исключены из сервера',
        variant: 'destructive',
      })
      router.push(ERoutes.MAIN_PAGE)
    }
    // TODO: добавить обновление списка серверов юзера, если в одном из них его исключили
    // const handleServersUpdate = async (data: { action: string; memberId: string; serverId?: string }) => {
    //   console.log('data', data)
    //   if (data.action !== 'member_deleted' || !(data.memberId && data.serverId)) return
    //
    //   setId(serverId)
    //
    //   try {
    //     const { data: updatedServer } = await refetch()
    //
    //     if (!updatedServer) return
    //
    //     const isMember = updatedServer.members.some(
    //       (m) => m.profile.userId === profile?.userId && m.id === data.memberId,
    //     )
    //
    //     if (!isMember) return
    //     queryClient.invalidateQueries({ queryKey: ['servers'] })
    //   } catch {
    //     console.error('Failed to update servers')
    //   }
    // }

    // socket.onAny((event, ...args) => {
    //   console.log(`Received event: ${event}`, args)
    // })

    // socket.on('server:members', handleServersUpdate)
    socket.on(`server:${serverId}:members`, handleRedirectFromServer)

    return () => {
      // socket.off('server:members', handleServersUpdate)
      socket.off(`server:${serverId}:members`, handleRedirectFromServer)
    }
  }, [serverId, server, socket, queryClient, profile?.userId, router, toast, refetch])

  return socket
}
