import { clerkClient, getAuth } from '@clerk/nextjs/server'
import { NextApiRequest } from 'next'
import { ensureProfile } from '@/lib/shared/utils/ensure-profile'

export const currentProfilePages = async (req: NextApiRequest) => {
  const { userId } = getAuth(req)

  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  return ensureProfile(user)
}
