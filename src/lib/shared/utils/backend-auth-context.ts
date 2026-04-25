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
  strategy: 'anonymous' | 'profile-header' | 'user-header'
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

const parseBackendSession = async (response: Response): Promise<BackendAuthSession> => {
  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected auth response status: ${parsedResponse.status}`)
  }

  return parsedResponse.data as BackendAuthSession
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

export const resolveCurrentProfileFromBackendAuth = async ({
  userId,
  sessionId,
  loadIdentity,
}: ResolveCurrentProfileOptions) => {
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

  const session = await parseBackendSession(response)

  return session.profile
}
