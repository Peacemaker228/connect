import { useMutation } from '@tanstack/react-query'
import { ChannelType, Server } from '@prisma/client'
import { privateApiInstance } from '../api/http-client'

export type ChannelMutationPayload = {
  name?: string
  type?: ChannelType | string
}

type ChannelMutationParams = {
  serverId: string
}

type UpdateChannelMutationParams = ChannelMutationParams & {
  channelId: string
  payload: ChannelMutationPayload
}

type DeleteChannelMutationParams = ChannelMutationParams & {
  channelId: string
}

const createServerScopedPath = (path: string, serverId: string) => {
  const searchParams = new URLSearchParams({ serverId })

  return `${path}?${searchParams.toString()}`
}

export const useCreateChannel = () => {
  return useMutation({
    mutationFn: ({ serverId, payload }: ChannelMutationParams & { payload: ChannelMutationPayload }) =>
      privateApiInstance
        .post<Server>(createServerScopedPath('/api/channels', serverId), payload)
        .then((res) => res.data),
  })
}

export const useUpdateChannel = () => {
  return useMutation({
    mutationFn: ({ serverId, channelId, payload }: UpdateChannelMutationParams) =>
      privateApiInstance
        .patch<Server>(createServerScopedPath(`/api/channels/${channelId}`, serverId), payload)
        .then((res) => res.data),
  })
}

export const useDeleteChannel = () => {
  return useMutation({
    mutationFn: ({ serverId, channelId }: DeleteChannelMutationParams) =>
      privateApiInstance
        .delete<Server>(createServerScopedPath(`/api/channels/${channelId}`, serverId))
        .then((res) => res.data),
  })
}
