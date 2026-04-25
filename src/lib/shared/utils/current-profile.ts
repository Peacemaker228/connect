import {
  createBackendAuthHeaders,
  resolveBackendAuthSession,
} from '@/lib/shared/utils/backend-auth-context'
import {
  getCurrentRuntimeAuthState,
  loadCurrentRuntimeAuthIdentity,
} from '@/lib/shared/utils/runtime-auth'

const resolveCurrentAuthSession = async () => {
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

export const currentBackendAuthHeaders = async () => {
  const session = await resolveCurrentAuthSession()

  return createBackendAuthHeaders(session)
}
