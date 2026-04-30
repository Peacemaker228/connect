import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TServerMembersProfiles } from '@/types'
import { Server } from '@prisma/client'
import { privateApiInstance } from '../api/http-client'

export type ServerListItem = Server & {
  initialChannelId: string | null
}

export const useGetServer = (serverId: string) => {
  return useQuery({
    queryKey: ['server', serverId],
    queryFn: () => privateApiInstance.get<TServerMembersProfiles>(`/api/servers/${serverId}`).then((res) => res.data),
    enabled: !!serverId,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false
      }

      return failureCount < 2
    },
  })
}

export const useGetServers = () => {
  return useQuery({
    queryKey: ['servers'],
    queryFn: () => privateApiInstance.get<ServerListItem[]>(`/api/servers`).then((res) => res.data),
  })
}
