import { auth, currentUser } from '@clerk/nextjs/server'

import { resolveCurrentProfileFromBackendAuth } from '@/lib/shared/utils/backend-auth-context'

export const currentProfile = async () => {
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
    return await resolveCurrentProfileFromBackendAuth({
      userId: authState.userId,
      sessionId: authState.sessionId,
      loadIdentity: async () => {
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
      },
    })
  } catch (error) {
    console.error('[CURRENT_PROFILE_BACKEND]', error)
    return null
  }
}
