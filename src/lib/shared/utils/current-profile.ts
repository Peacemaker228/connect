import {
  createBackendAuthHeaders,
  getBackendAuthSessionFromCookie,
} from '@/lib/shared/utils/backend-auth-context'
import { cookies } from 'next/headers'

const resolveCurrentAuthSession = async () => {
  const cookieStore = await cookies()
  const cookieEntries = cookieStore.getAll()

  if (cookieEntries.length === 0) {
    return null
  }

  const cookieHeader = cookieEntries
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join('; ')

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

  return null
}

export const currentProfile = async () => {
  const session = await resolveCurrentAuthSession()

  return session?.profile ?? null
}

export const currentBackendAuthHeaders = async () => {
  const session = await resolveCurrentAuthSession()

  return createBackendAuthHeaders(session)
}
