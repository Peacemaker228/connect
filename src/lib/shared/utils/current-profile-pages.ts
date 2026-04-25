import { NextApiRequest } from 'next'

import {
  createBackendAuthHeaders,
  resolveBackendAuthSession,
} from '@/lib/shared/utils/backend-auth-context'
import {
  getPagesRuntimeAuthState,
  loadPagesRuntimeAuthIdentity,
} from '@/lib/shared/utils/runtime-auth'

const resolveCurrentAuthSessionPages = async (req: NextApiRequest) => {
  const authState = getPagesRuntimeAuthState(req)

  if (!authState) return null

  try {
    return await resolveBackendAuthSession({
      userId: authState.userId,
      sessionId: authState.sessionId,
      loadIdentity: () => loadPagesRuntimeAuthIdentity(authState.userId),
    })
  } catch (error) {
    console.error('[CURRENT_PROFILE_PAGES_BACKEND]', error)
    return null
  }
}

export const currentProfilePages = async (req: NextApiRequest) => {
  const session = await resolveCurrentAuthSessionPages(req)

  return session?.profile ?? null
}

export const currentBackendAuthHeadersPages = async (req: NextApiRequest) => {
  const session = await resolveCurrentAuthSessionPages(req)

  return createBackendAuthHeaders(session)
}
