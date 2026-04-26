import { NextApiRequest } from 'next'

import {
  createBackendAuthHeaders,
  getBackendAuthSessionFromCookie,
} from '@/lib/shared/utils/backend-auth-context'

const resolveCurrentAuthSessionPages = async (req: NextApiRequest) => {
  try {
    const cookieSession = await getBackendAuthSessionFromCookie(req.headers.cookie)

    if (cookieSession?.profile) {
      return cookieSession
    }
  } catch (error) {
    console.error('[CURRENT_PROFILE_PAGES_COOKIE_BACKEND]', error)
  }

  return null
}

export const currentProfilePages = async (req: NextApiRequest) => {
  const session = await resolveCurrentAuthSessionPages(req)

  return session?.profile ?? null
}

export const currentBackendAuthHeadersPages = async (req: NextApiRequest) => {
  const session = await resolveCurrentAuthSessionPages(req)

  return createBackendAuthHeaders(session)
}
