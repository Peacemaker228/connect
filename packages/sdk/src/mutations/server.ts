import { useMutation } from '@tanstack/react-query'
import { Server } from '@prisma/client'
import { privateApiInstance } from '../api/http-client'

export type ServerMutationPayload = {
  name?: string
  imageUrl?: string | null
}

export const useCreateServer = () => {
  return useMutation({
    mutationFn: (payload: ServerMutationPayload) =>
      privateApiInstance.post<Server>('/api/servers', payload).then((res) => res.data),
  })
}

export const useUpdateServer = () => {
  return useMutation({
    mutationFn: ({ serverId, payload }: { serverId: string; payload: ServerMutationPayload }) =>
      privateApiInstance.patch<Server>(`/api/servers/${serverId}`, payload).then((res) => res.data),
  })
}

export const useDeleteServer = () => {
  return useMutation({
    mutationFn: (serverId: string) =>
      privateApiInstance.delete<Server>(`/api/servers/${serverId}`).then((res) => res.data),
  })
}

export const useRegenerateServerInviteCode = () => {
  return useMutation({
    mutationFn: (serverId: string) =>
      privateApiInstance.patch<Server>(`/api/servers/${serverId}/invite-code`).then((res) => res.data),
  })
}
