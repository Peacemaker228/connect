import { getAuth } from '@clerk/nextjs/server'
import { db } from '@/lib/shared/utils/db'
import { NextApiRequest } from 'next'

export const currentProfilePages = async (req: NextApiRequest) => {
  const { userId } = getAuth(req)

  if (!userId) return null

  return db.profile.findUnique({
    where: {
      userId,
    },
  })
}
