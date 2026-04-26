import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Profile } from '@prisma/client'

export const useGetProfile = () => {
  const { data: profile, ...query } = useQuery({
    queryKey: ['profile'],
    queryFn: () => axios.get(`/api/user`).then<Profile>((res) => res.data),
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
        return false
      }

      return failureCount < 2
    },
  })

  return { profile, ...query }
}
