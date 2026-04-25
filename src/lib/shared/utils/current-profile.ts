import { auth, currentUser } from '@clerk/nextjs/server'

import {
  createBackendAuthHeaders,
  resolveBackendAuthSession,
} from '@/lib/shared/utils/backend-auth-context'

const loadCurrentAuthIdentity = async () => {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    imageUrl: user.imageUrl,
    primaryEmailAddress: user.emailAddresses[0]?.emailAddress ?? null,
  }
}

const resolveCurrentAuthSession = async () => {
  let authState = null

  try {
    authState = await auth()
  } catch (error) {
    console.error('[CURRENT_PROFILE_AUTH]', error)
    return null
  }

  if (!authState.userId) {
    return null
  }

  try {
    return await resolveBackendAuthSession({
      userId: authState.userId,
      sessionId: authState.sessionId,
      loadIdentity: loadCurrentAuthIdentity,
    })
  } catch (error) {
    console.error('[CURRENT_PROFILE_BACKEND]', error)
    return null
  }
}

export const currentProfile = async () => {
  const session = await resolveCurrentAuthSession()

  return session?.profile ?? null
}

export const currentBackendAuthHeaders = async () => {
  const session = await resolveCurrentAuthSession()

  return createBackendAuthHeaders(session)
}
