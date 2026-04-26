import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Profile } from '@prisma/client'

export const useGetProfile = () => {
  const { data: profile, ...query } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await axios.get<Profile>(`/api/user`)

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
          return null
        }

        throw error
      }
    },
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
        return false
      }

      return failureCount < 2
    },
  })

  return { profile, ...query }
}
