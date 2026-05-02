import type { ProfileDto } from '@app-core/contracts'

import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'

type BackendAuthSession = {
  isAuthenticated: boolean
  strategy: 'anonymous' | 'profile-header' | 'access-token'
  sessionId: string | null
  profile: ProfileDto | null
  user: {
    id: string
    displayName: string | null
    email: string | null
    imageUrl: string | null
  } | null
}

export type BackendAuthHeaders = Record<string, string | undefined>

const parseBackendSession = async (response: Response): Promise<BackendAuthSession> => {
  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected auth response status: ${parsedResponse.status}`)
  }

  return parsedResponse.data as BackendAuthSession
}

export const getBackendAuthSessionFromCookie = async (cookieHeader?: string) => {
  if (!cookieHeader) {
    return null
  }

  const response = await requestBackendApi({
    path: '/api/auth/session',
    headers: {
      cookie: cookieHeader,
    },
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to get backend auth session: ${response.status}`)
  }

  const session = await parseBackendSession(response)

  return session.profile ? session : null
}

export const createBackendAuthHeaders = (session: BackendAuthSession | null): BackendAuthHeaders | null => {
  if (!session?.profile) {
    return null
  }

  return {
    'x-profile-id': session.profile.id,
    'x-session-id': session.sessionId ?? undefined,
  }
}
