import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/shared/utils/db'

export const currentProfile = async () => {
  const { userId } = await auth()

  if (!userId) return null

  return db.profile.findUnique({
    where: {
      userId,
    },
  })
}
