import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { ProfileDto } from '@app-core/contracts'
import { privateApiInstance, refreshBackendSession } from '../api/http-client'

type BackendAuthSession = {
  isAuthenticated: boolean
  profile: ProfileDto | null
}

type BackendAuthSessionExchange = {
  session?: BackendAuthSession
}

const PROFILE_QUERY_KEY = ['profile'] as const
const AUTH_MISSING_STATUSES = [401, 404]

export const getProfileQueryKey = () => PROFILE_QUERY_KEY

const isMissingAuthError = (error: unknown) => {
  return axios.isAxiosError(error) && AUTH_MISSING_STATUSES.includes(error.response?.status ?? 0)
}

const fetchBackendAuthSession = async () => {
  const response = await privateApiInstance.get<BackendAuthSession>('/api/auth/session')

  return response.data
}

const refreshAndReadProfile = async () => {
  try {
    const response = await refreshBackendSession()
    const exchange = response.data as BackendAuthSessionExchange
    const refreshedProfile = exchange.session?.profile

    if (refreshedProfile) {
      return refreshedProfile
    }

    const refreshedSession = await fetchBackendAuthSession()

    return refreshedSession.profile
  } catch (error) {
    if (isMissingAuthError(error)) {
      return null
    }

    throw error
  }
}

export const useGetProfile = () => {
  const { data: profile, ...query } = useQuery({
    queryKey: getProfileQueryKey(),
    queryFn: async () => {
      try {
        const session = await fetchBackendAuthSession()

        if (session.profile) {
          return session.profile
        }

        return refreshAndReadProfile()
      } catch (error) {
        if (isMissingAuthError(error)) {
          return null
        }

        throw error
      }
    },
    retry: (failureCount, error) => {
      if (isMissingAuthError(error)) {
        return false
      }

      return failureCount < 2
    },
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
  })

  return { profile, ...query }
}
