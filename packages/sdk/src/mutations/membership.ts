import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Member, MemberRole, Profile, Server } from '@prisma/client'
import { TServerMembersProfiles } from '@/types'
import { privateApiInstance } from '../api/http-client'

export type ServerMembershipSnapshot = Server & {
  members: (Member & { profile: Profile })[]
}

type MemberMutationParams = {
  serverId: string
  memberId: string
  currentServer?: TServerMembersProfiles
}

type UpdateMemberRoleParams = MemberMutationParams & {
  role: MemberRole
}

const createServerScopedPath = (path: string, serverId: string) => {
  const searchParams = new URLSearchParams({ serverId })

  return `${path}?${searchParams.toString()}`
}

const mergeMembershipSnapshot = (
  updatedServer: ServerMembershipSnapshot,
  currentServer?: TServerMembersProfiles,
): TServerMembersProfiles => {
  return {
    ...currentServer,
    ...updatedServer,
    channels: currentServer?.channels ?? [],
    members: updatedServer.members,
  }
}

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ serverId, memberId, role, currentServer }: UpdateMemberRoleParams) => {
      const response = await privateApiInstance
        .patch<ServerMembershipSnapshot>(createServerScopedPath(`/api/members/${memberId}`, serverId), { role })
        .then((res) => res.data)

      return mergeMembershipSnapshot(response, currentServer)
    },
    onSuccess: (server) => {
      queryClient.setQueryData(['server', server.id], server)
      queryClient.invalidateQueries({ queryKey: ['server', server.id] })
    },
  })
}

export const useKickMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ serverId, memberId, currentServer }: MemberMutationParams) => {
      const response = await privateApiInstance
        .delete<ServerMembershipSnapshot>(createServerScopedPath(`/api/members/${memberId}`, serverId))
        .then((res) => res.data)

      return mergeMembershipSnapshot(response, currentServer)
    },
    onSuccess: (server) => {
      queryClient.setQueryData(['server', server.id], server)
      queryClient.invalidateQueries({ queryKey: ['server', server.id] })
    },
  })
}

export const useLeaveServer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serverId: string) => {
      const leftServer = await privateApiInstance.patch<Server>(`/api/servers/${serverId}/leave`).then((res) => res.data)
      let nextServerId: string | undefined

      queryClient.setQueryData<Server[]>(['servers'], (servers = []) => {
        const nextServers = servers.filter((server) => server.id !== serverId)
        nextServerId = nextServers[0]?.id

        return nextServers
      })

      queryClient.removeQueries({ queryKey: ['server', serverId], exact: true })
      queryClient.invalidateQueries({ queryKey: ['servers'] })

      return {
        leftServer,
        nextServerId,
      }
    },
  })
}
