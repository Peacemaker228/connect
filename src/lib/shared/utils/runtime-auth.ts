import { auth, clerkClient, currentUser, getAuth } from '@clerk/nextjs/server'
import type { NextApiRequest } from 'next'

type RuntimeAuthState = {
  userId: string
  sessionId: string | null
}

type RuntimeAuthUserIdentity = {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  imageUrl?: string | null
  emailAddresses: Array<{
    emailAddress: string
  }>
}

const mapRuntimeAuthIdentity = (user: RuntimeAuthUserIdentity) => {
  return {
    id: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    username: user.username ?? null,
    imageUrl: user.imageUrl ?? null,
    primaryEmailAddress: user.emailAddresses[0]?.emailAddress ?? null,
  }
}

export const getCurrentRuntimeAuthState = async (): Promise<RuntimeAuthState | null> => {
  try {
    const authState = await auth()

    if (!authState.userId) {
      return null
    }

    return {
      userId: authState.userId,
      sessionId: authState.sessionId,
    }
  } catch (error) {
    console.error('[RUNTIME_AUTH_STATE]', error)
    return null
  }
}

export const loadCurrentRuntimeAuthIdentity = async () => {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return mapRuntimeAuthIdentity(user)
}

export const getPagesRuntimeAuthState = (req: NextApiRequest): RuntimeAuthState | null => {
  const { userId, sessionId } = getAuth(req)

  if (!userId) {
    return null
  }

  return {
    userId,
    sessionId,
  }
}

export const loadPagesRuntimeAuthIdentity = async (userId: string) => {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    return mapRuntimeAuthIdentity(user)
  } catch (error) {
    console.error('[PAGES_RUNTIME_AUTH_IDENTITY]', error)
    return null
  }
}
