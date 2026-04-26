import {
  createBackendAuthHeaders,
  getBackendAuthSessionFromCookie,
  resolveBackendAuthSession,
} from '@/lib/shared/utils/backend-auth-context'
import {
  getCurrentRuntimeCookieHeader,
  getCurrentRuntimeAuthState,
  loadCurrentRuntimeAuthIdentity,
} from '@/lib/shared/utils/runtime-auth'

const resolveCurrentAuthSession = async () => {
  const cookieHeader = await getCurrentRuntimeCookieHeader()

  if (cookieHeader) {
    try {
      const cookieSession = await getBackendAuthSessionFromCookie(cookieHeader)

      if (cookieSession?.profile) {
        return cookieSession
      }
    } catch (error) {
      console.error('[CURRENT_PROFILE_COOKIE_BACKEND]', error)
    }
  }

  const authState = await getCurrentRuntimeAuthState()

  if (!authState) {
    return null
  }

  try {
    return await resolveBackendAuthSession({
      userId: authState.userId,
      sessionId: authState.sessionId,
      loadIdentity: loadCurrentRuntimeAuthIdentity,
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

export const currentBackendAuthSession = async () => {
  return resolveCurrentAuthSession()
}

export const currentBackendAuthHeaders = async () => {
  const session = await resolveCurrentAuthSession()

  return createBackendAuthHeaders(session)
}
