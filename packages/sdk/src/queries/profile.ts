import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Profile } from '@prisma/client'
import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

type BackendAuthSession = {
  profile: Profile | null
}

const getProfileRequestPath = () => {
  return getBackendApiBaseUrl() ? '/api/auth/session' : '/api/user'
}

const resolveProfileResponse = (data: Profile | BackendAuthSession) => {
  if ('profile' in data) {
    return data.profile
  }

  return data
}

export const useGetProfile = () => {
  const { data: profile, ...query } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await privateApiInstance.get<Profile | BackendAuthSession>(getProfileRequestPath())

        return resolveProfileResponse(response.data)
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
