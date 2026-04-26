import { Profile } from '@prisma/client'

import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'

type BackendAuthIdentity = {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  imageUrl: string | null
  primaryEmailAddress: string | null
}

type BackendAuthSession = {
  isAuthenticated: boolean
  strategy: 'anonymous' | 'profile-header' | 'user-header' | 'access-token'
  sessionId: string | null
  profile: Profile | null
  user: {
    id: string
    displayName: string | null
    email: string | null
    imageUrl: string | null
  } | null
}

type ResolveCurrentProfileOptions = {
  userId: string
  sessionId?: string | null
  loadIdentity: () => Promise<BackendAuthIdentity | null>
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

const requestResolvedSession = async ({
  userId,
  sessionId,
  identity,
}: {
  userId: string
  sessionId?: string | null
  identity?: BackendAuthIdentity
}) => {
  return requestBackendApi({
    path: '/api/auth/session/resolve',
    method: 'POST',
    headers: {
      'x-user-id': userId,
      'x-session-id': sessionId ?? undefined,
    },
    body: identity ? { identity } : undefined,
  })
}

export const resolveBackendAuthSession = async ({ userId, sessionId, loadIdentity }: ResolveCurrentProfileOptions) => {
  let response = await requestResolvedSession({
    userId,
    sessionId,
  })

  if (response.status === 404) {
    const identity = await loadIdentity()

    if (!identity) {
      return null
    }

    response = await requestResolvedSession({
      userId,
      sessionId,
      identity,
    })
  }

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to resolve backend auth session: ${response.status}`)
  }

  return await parseBackendSession(response)
}

export const createBackendAuthHeaders = (session: BackendAuthSession | null): BackendAuthHeaders | null => {
  if (!session?.profile) {
    return null
  }

  return {
    'x-profile-id': session.profile.id,
    'x-user-id': session.user?.id ?? session.profile.userId,
    'x-session-id': session.sessionId ?? undefined,
  }
}

export const resolveCurrentProfileFromBackendAuth = async (options: ResolveCurrentProfileOptions) => {
  const session = await resolveBackendAuthSession(options)

  return session?.profile ?? null
}
