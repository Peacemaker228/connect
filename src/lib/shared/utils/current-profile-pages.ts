import { clerkClient, getAuth } from '@clerk/nextjs/server'
import { NextApiRequest } from 'next'

import { resolveCurrentProfileFromBackendAuth } from '@/lib/shared/utils/backend-auth-context'

export const currentProfilePages = async (req: NextApiRequest) => {
  const { userId, sessionId } = getAuth(req)

  if (!userId) return null

  try {
    return await resolveCurrentProfileFromBackendAuth({
      userId,
      sessionId,
      loadIdentity: async () => {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)

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
    console.error('[CURRENT_PROFILE_PAGES_BACKEND]', error)
    return null
  }
}
