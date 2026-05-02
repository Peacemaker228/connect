import { useMutation } from '@tanstack/react-query'
import type { ServerDto } from '@app-core/contracts'
import { privateApiInstance } from '../api/http-client'

export type ServerMutationPayload = {
  name?: string
  imageUrl?: string | null
}

export const useCreateServer = () => {
  return useMutation({
    mutationFn: (payload: ServerMutationPayload) =>
      privateApiInstance.post<ServerDto>('/api/servers', payload).then((res) => res.data),
  })
}

export const useUpdateServer = () => {
  return useMutation({
    mutationFn: ({ serverId, payload }: { serverId: string; payload: ServerMutationPayload }) =>
      privateApiInstance.patch<ServerDto>(`/api/servers/${serverId}`, payload).then((res) => res.data),
  })
}

export const useDeleteServer = () => {
  return useMutation({
    mutationFn: (serverId: string) =>
      privateApiInstance.delete<ServerDto>(`/api/servers/${serverId}`).then((res) => res.data),
  })
}

export const useRegenerateServerInviteCode = () => {
  return useMutation({
    mutationFn: (serverId: string) =>
      privateApiInstance.patch<ServerDto>(`/api/servers/${serverId}/invite-code`).then((res) => res.data),
  })
}
